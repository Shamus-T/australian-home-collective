import assert from "node:assert/strict";
import test from "node:test";

import { __test, integrationConfiguration } from "../src/sync.js";

test("calculates fixed UTC reporting periods", () => {
  const period = __test.periodEndingDaysAgo(new Date("2026-07-30T12:00:00Z"), 2, 28);
  assert.deepEqual(period, { start: "2026-07-01", end: "2026-07-28" });
});

test("classifies sitemap routes and creates readable fallback titles", () => {
  assert.equal(__test.pageType("/guides/fridge-dimensions-australia/"), "guide");
  assert.equal(__test.pageType("/privacy-policy/"), "page");
  assert.equal(__test.titleFromPath("/guides/tv-wall-mount-planning/"), "TV Wall Mount Planning");
});

test("reports configuration state without exposing secrets", () => {
  const statuses = integrationConfiguration({
    AHC_ANALYTICS_DB: { prepare() {} },
    GOOGLE_SERVICE_ACCOUNT_EMAIL: "service@example.iam.gserviceaccount.com",
    GOOGLE_PRIVATE_KEY: "private-key",
    SEARCH_CONSOLE_SITE_URL: "sc-domain:example.com",
  });
  assert.equal(statuses.find((item) => item.source === "search_console").state, "configured");
  assert.equal(statuses.find((item) => item.source === "ga4").state, "not_configured");
  assert.equal(statuses.find((item) => item.source === "facebook").state, "manual_import");
});
