import assert from "node:assert/strict";
import test from "node:test";

import { __test } from "../src/index.js";

test("validates Facebook imports", () => {
  const rows = __test.validateManualRows("facebook", [{
    date: "2026-07-29",
    reach: "100",
    engagements: 12,
    linkClicks: 4,
    followers: 20,
  }]);
  assert.deepEqual(rows[0], {
    date: "2026-07-29",
    reach: 100,
    engagements: 12,
    linkClicks: 4,
    followers: 20,
  });
});

test("rejects invalid Bing metrics and dates", () => {
  assert.throws(() => __test.validateManualRows("bing", [{
    date: "not-a-date",
    clicks: 1,
    impressions: 2,
    ctr: 0.5,
    position: 4,
  }]), /invalid date/i);
  assert.throws(() => __test.validateManualRows("bing", [{
    date: "2026-07-29",
    clicks: 1,
    impressions: 2,
    ctr: 4,
    position: 4,
  }]), /invalid metric/i);
});

test("checks same-origin writes", () => {
  assert.equal(__test.sameOrigin(new Request("https://dashboard.example.com/api/sync", {
    headers: { Origin: "https://dashboard.example.com" },
  })), true);
  assert.equal(__test.sameOrigin(new Request("https://dashboard.example.com/api/sync", {
    headers: { Origin: "https://example.com" },
  })), false);
});
