import assert from "node:assert/strict";
import test from "node:test";

import { __test, integrationConfiguration } from "../src/sync.js";

test("calculates fixed UTC reporting periods", () => {
  const period = __test.periodEndingDaysAgo(new Date("2026-07-30T12:00:00Z"), 2, 28);
  assert.deepEqual(period, { start: "2026-07-01", end: "2026-07-28" });
});

test("splits Cloudflare requests into daily UTC windows", () => {
  const windows = __test.dailyUtcWindows(
    new Date("2026-07-01T00:00:00Z"),
    new Date("2026-07-04T00:00:00Z"),
  );
  assert.deepEqual(windows.map((window) => ({
    start: window.start.toISOString(),
    end: window.end.toISOString(),
  })), [
    { start: "2026-07-01T00:00:00.000Z", end: "2026-07-02T00:00:00.000Z" },
    { start: "2026-07-02T00:00:00.000Z", end: "2026-07-03T00:00:00.000Z" },
    { start: "2026-07-03T00:00:00.000Z", end: "2026-07-04T00:00:00.000Z" },
  ]);
  assert.throws(
    () => __test.dailyUtcWindows(new Date("2026-07-01T00:00:00Z"), new Date("2026-08-02T00:00:00Z")),
    /31 daily requests/,
  );
});

test("caps Cloudflare traffic sync to a 7-day lookback", () => {
  const period = __test.cloudflareTrafficPeriod(new Date("2026-07-31T04:42:55Z"));
  assert.equal(period.periodStart, "2026-07-24");
  assert.equal(period.periodEnd, "2026-07-30");
  assert.equal(period.windows.length, 7);
  assert.equal(period.windows[0].start.toISOString(), "2026-07-24T00:00:00.000Z");
  assert.equal(period.windows.at(-1).end.toISOString(), "2026-07-31T00:00:00.000Z");

  for (const window of period.windows) {
    assert.ok(
      window.end.getTime() - window.start.getTime() <= 24 * 60 * 60 * 1000,
      "Cloudflare query windows must not exceed one day",
    );
  }
});

test("aggregates Cloudflare top paths across daily windows", () => {
  const aggregated = __test.aggregateCloudflareZones([
    {
      hourly: [
        {
          count: 10,
          sum: { visits: 6, edgeResponseBytes: 1000 },
          dimensions: { datetimeHour: "2026-07-01T00:00:00Z" },
        },
      ],
      topPaths: [
        { count: 9, sum: { visits: 5, edgeResponseBytes: 900 }, dimensions: { clientRequestPath: "/guides/" } },
        { count: 2, sum: { visits: 1, edgeResponseBytes: 200 }, dimensions: { clientRequestPath: "/" } },
      ],
    },
    {
      hourly: [
        {
          count: 4,
          sum: { visits: 3, edgeResponseBytes: 400 },
          dimensions: { datetimeHour: "2026-07-02T00:00:00Z" },
        },
      ],
      topPaths: [
        { count: 7, sum: { visits: 4, edgeResponseBytes: 700 }, dimensions: { clientRequestPath: "/" } },
        { count: 3, sum: { visits: 2, edgeResponseBytes: 300 }, dimensions: { clientRequestPath: "/privacy-policy/" } },
      ],
    },
  ]);

  assert.deepEqual(aggregated.hourly, [
    { hour: "2026-07-01T00:00:00Z", requests: 10, visits: 6, bytes: 1000 },
    { hour: "2026-07-02T00:00:00Z", requests: 4, visits: 3, bytes: 400 },
  ]);
  assert.deepEqual(aggregated.paths, [
    { path: "/", requests: 9, visits: 5, bytes: 900 },
    { path: "/guides/", requests: 9, visits: 5, bytes: 900 },
    { path: "/privacy-policy/", requests: 3, visits: 2, bytes: 300 },
  ]);
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
