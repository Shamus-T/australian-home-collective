import assert from "node:assert/strict";
import test from "node:test";

import {
  __test,
  onRequest,
  onRequestPost,
} from "../functions/api/affiliate-click.js";

const validClick = {
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  guidePath: "/guides/coffee-machine-types-australia/",
  productId: "breville-barista-express",
  productName: "Breville Barista Express",
  affiliateNetwork: "amazon-australia",
  merchant: "Amazon Australia",
  destinationHost: "www.amazon.com.au",
  sessionId: "session_12345678",
  device: "desktop",
};

function request(payload, overrides = {}) {
  return new Request("https://australianhomecollective.com.au/api/affiliate-click", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://australianhomecollective.com.au",
      "CF-Connecting-IP": "203.0.113.42",
      "User-Agent": "Not stored by the collector",
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

test("validates and normalises the affiliate event payload", () => {
  const result = __test.validateEvent({
    ...validClick,
    productName: "  Breville   Barista Express  ",
    destinationHost: "WWW.AMAZON.COM.AU",
  });
  assert.deepEqual(result.event, {
    ...validClick,
    productName: "Breville Barista Express",
    destinationHost: "www.amazon.com.au",
  });
});

test("stores the required click fields without request IP or user-agent data", async () => {
  const { database, calls } = mockDatabase();
  const response = await onRequestPost({
    request: request(validClick),
    env: { AHC_ANALYTICS_DB: database },
  });

  assert.equal(response.status, 204);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /INSERT INTO affiliate_clicks/);
  assert.match(calls[0].sql, /ON CONFLICT \(event_id\) DO NOTHING/);
  assert.deepEqual(calls[0].values.slice(0, 9), [
    validClick.eventId,
    validClick.guidePath,
    validClick.productId,
    validClick.productName,
    validClick.affiliateNetwork,
    validClick.merchant,
    validClick.destinationHost,
    validClick.sessionId,
    validClick.device,
  ]);
  assert.match(calls[0].values[9], /^\d{4}-\d{2}-\d{2}T/);
  assert.doesNotMatch(JSON.stringify(calls[0].values), /203\.0\.113\.42|Not stored/);
});

test("rejects invalid guide, product, network and destination metadata", () => {
  for (const payload of [
    { ...validClick, guidePath: "/privacy-policy/" },
    { ...validClick, productId: "bad product id" },
    { ...validClick, affiliateNetwork: "unknown-network" },
    { ...validClick, destinationHost: "example.com" },
    { ...validClick, eventId: "not-a-uuid" },
  ]) {
    assert.ok(__test.validateEvent(payload).error);
  }
});

test("rejects cross-origin, malformed and oversized events", async () => {
  const crossOrigin = await onRequestPost({
    request: request(validClick, { headers: { Origin: "https://example.com" } }),
    env: {},
  });
  assert.equal(crossOrigin.status, 403);

  const malformed = await onRequestPost({ request: request(validClick, { body: "{" }), env: {} });
  assert.equal(malformed.status, 400);

  const oversized = await onRequestPost({
    request: request(validClick, { body: JSON.stringify({ ...validClick, padding: "x".repeat(5000) }) }),
    env: {},
  });
  assert.equal(oversized.status, 413);
});

test("fails open without D1 and returns a private error when D1 fails", async () => {
  const unbound = await onRequestPost({ request: request(validClick), env: {} });
  assert.equal(unbound.status, 204);

  const { database } = mockDatabase({ fail: true });
  const failed = await onRequestPost({
    request: request(validClick),
    env: { AHC_ANALYTICS_DB: database },
  });
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /D1 unavailable/);
});

test("rejects non-POST requests", () => {
  const response = onRequest();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST");
});
