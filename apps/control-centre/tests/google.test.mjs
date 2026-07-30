import assert from "node:assert/strict";
import test from "node:test";

import { __test } from "../src/google.js";

test("parses Search Console rows into named dimensions", () => {
  const rows = __test.parseSearchConsoleRows({
    rows: [{ keys: ["2026-07-28", "/guide/"], clicks: 2, impressions: 40, ctr: 0.05, position: 11.3 }],
  }, ["date", "page"]);
  assert.deepEqual(rows[0], {
    date: "2026-07-28",
    page: "/guide/",
    clicks: 2,
    impressions: 40,
    ctr: 0.05,
    position: 11.3,
  });
});

test("parses GA4 rows and converts metric values to numbers", () => {
  const rows = __test.parseGa4Rows({
    rows: [{
      dimensionValues: [{ value: "20260728" }],
      metricValues: [{ value: "12" }, { value: "18" }],
    }],
  }, ["date"], ["activeUsers", "sessions"]);
  assert.deepEqual(rows[0], { date: "20260728", activeUsers: 12, sessions: 18 });
});
