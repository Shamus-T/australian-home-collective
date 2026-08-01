import assert from "node:assert/strict";
import test from "node:test";

import {
  __test,
  onRequest,
  onRequestPost,
} from "../functions/api/search-analytics.js";

function request(payload, overrides = {}) {
  return new Request("https://australianhomecollective.com.au/api/search-analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://australianhomecollective.com.au",
      ...overrides.headers,
    },
    body: overrides.body ?? JSON.stringify(payload),
  });
}

function mockDatabase({ fail = false } = {}) {
  const calls = [];
  const database = {
    prepare(sql) {
      const entry = { sql, values: null };
      calls.push(entry);
      return {
        bind(...values) {
          entry.values = values;
          return this;
        },
        async run() {
          if (fail) throw new Error("D1 unavailable");
          return { success: true };
        },
      };
    },
  };
  return { database, calls };
}

const validSearch = {
  eventType: "search",
  query: "  fridge   delivery access  ",
  resultCount: 4,
  originPath: "/search/",
  sessionId: "session_12345678",
  device: "desktop",
};

test("normalises search terms and internal paths", () => {
  assert.equal(__test.normaliseQuery("  Heat   Pump DRYER "), "heat pump dryer");
  assert.equal(__test.visibleQueryCharacterCount("a b"), 2);
  assert.equal(__test.visibleQueryCharacterCount("a b c"), 3);
  assert.equal(__test.normalisePath("/guides/fridge-dimensions-australia/", { selected: true }), "/guides/fridge-dimensions-australia/");
  assert.equal(__test.normalisePath("https://example.com/attack", { selected: true }), "");
});

test("stores a valid anonymous search event", async () => {
  const { database, calls } = mockDatabase();
  const response = await onRequestPost({
    request: request(validSearch),
    env: { AHC_ANALYTICS_DB: database },
  });

  assert.equal(response.status, 204);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /INSERT INTO search_events/);
  assert.equal(calls[0].values[0], "search");
  assert.equal(calls[0].values[1], "fridge delivery access");
  assert.equal(calls[0].values[2], 4);
  assert.equal(calls[0].values[5], "session_12345678");
  assert.equal(calls[0].values[6], "desktop");
});

test("stores an internal result click without accepting external destinations", async () => {
  const { database, calls } = mockDatabase();
  const response = await onRequestPost({
    request: request({
      ...validSearch,
      eventType: "result_click",
      resultCount: undefined,
      selectedPath: "/guides/fridge-dimensions-australia/",
    }),
    env: { AHC_ANALYTICS_DB: database },
  });

  assert.equal(response.status, 204);
  assert.equal(calls[0].values[0], "result_click");
  assert.equal(calls[0].values[4], "/guides/fridge-dimensions-australia/");

  const rejected = await onRequestPost({
    request: request({
      ...validSearch,
      eventType: "result_click",
      resultCount: undefined,
      selectedPath: "https://example.com/",
    }),
    env: { AHC_ANALYTICS_DB: database },
  });
  assert.equal(rejected.status, 400);
});

test("rejects cross-origin events", async () => {
  const response = await onRequestPost({
    request: request(validSearch, { headers: { Origin: "https://example.com" } }),
    env: {},
  });
  assert.equal(response.status, 403);
});

test("rejects malformed or oversized events", async () => {
  const malformed = await onRequestPost({
    request: request(validSearch, { body: "{" }),
    env: {},
  });
  assert.equal(malformed.status, 400);

  const oversized = await onRequestPost({
    request: request(validSearch, { body: JSON.stringify({ ...validSearch, padding: "x".repeat(5000) }) }),
    env: {},
  });
  assert.equal(oversized.status, 413);
});

test("rejects invalid result counts and terms shorter than three visible characters", async () => {
  const invalidCount = await onRequestPost({
    request: request({ ...validSearch, resultCount: -1 }),
    env: {},
  });
  assert.equal(invalidCount.status, 400);

  for (const query of ["a", "ab", "a b"]) {
    const shortTerm = await onRequestPost({
      request: request({ ...validSearch, query }),
      env: {},
    });
    assert.equal(shortTerm.status, 400);
  }
});

test("fails open when the optional D1 binding is not configured", async () => {
  const response = await onRequestPost({ request: request(validSearch), env: {} });
  assert.equal(response.status, 204);
});

test("returns a private service error when D1 fails", async () => {
  const { database } = mockDatabase({ fail: true });
  const response = await onRequestPost({
    request: request(validSearch),
    env: { AHC_ANALYTICS_DB: database },
  });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.success, false);
  assert.doesNotMatch(JSON.stringify(body), /D1 unavailable/);
});

test("rejects non-POST requests", () => {
  const response = onRequest();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST");
});
