import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCsvExport,
  createCsv,
  escapeCsvValue,
  filenameDate,
} from "../public/csv-export-lib.js";

const generatedAt = "2026-08-24T03:04:05.000Z";

test("escapes embedded quotes, commas and line breaks", () => {
  assert.equal(
    createCsv(["value"], [['He said "hello", then\nleft.']]),
    '"value"\r\n"He said ""hello"", then\nleft."',
  );
});

test("protects dangerous string values from spreadsheet formula injection", () => {
  assert.equal(escapeCsvValue("  =SUM(A1:A2)"), '"\'  =SUM(A1:A2)"');
  assert.equal(escapeCsvValue("+1+1"), '"\'+1+1"');
  assert.equal(escapeCsvValue("@IMPORT"), '"\'@IMPORT"');
});

test("keeps genuine negative numbers numeric", () => {
  assert.equal(escapeCsvValue(-12.5), '"-12.5"');
  assert.equal(escapeCsvValue("-12.5"), '"\'-12.5"');
});

test("creates a valid header-only CSV for empty data", () => {
  assert.equal(createCsv(["page", "clicks"], []), '"page","clicks"');
  const exported = buildCsvExport("search-console-pages", { searchConsole: { pages: [] } }, { generatedAt });
  assert.equal(exported.rowCount, 0);
  assert.match(exported.csv, /^"page","clicks","impressions","ctr","position","period_start","period_end","source_updated_at"$/u);
});

test("exports raw Search Console CTR and position with source period metadata", () => {
  const exported = buildCsvExport("search-console-pages", {
    snapshots: {
      search_console: {
        periodStart: "2026-07-27",
        periodEnd: "2026-08-23",
        updatedAt: "2026-08-24T01:02:03.000Z",
      },
    },
    searchConsole: {
      pages: [{ page: "/guides/example/", clicks: 3, impressions: 250, ctr: 0.012, position: 9.7 }],
    },
  }, { generatedAt });

  assert.match(exported.csv, /"3","250","0\.012","9\.7"/u);
  assert.match(exported.csv, /"2026-07-27","2026-08-23","2026-08-24T01:02:03\.000Z"$/u);
});

test("exports affiliate selected-days and CTR-window metadata", () => {
  const exported = buildCsvExport("affiliate-guides", {
    affiliate: {
      selectedDays: 28,
      ctr: { periodStart: "2026-08-19", periodEnd: "2026-08-23" },
      guides: [{
        guidePath: "/guides/example/",
        title: "Example guide",
        clicks: 5,
        clickingSessions: 4,
        productsClicked: 2,
        ctrClicks: 3,
        pageViews: 100,
        articleToMerchantCtr: 0.03,
      }],
    },
  }, { generatedAt });

  assert.match(exported.csv, /"5","4","2","3","100","0\.03","28","2026-08-19","2026-08-23","2026-08-24T03:04:05\.000Z"$/u);
});

test("uses a stable Brisbane-dated filename", () => {
  assert.equal(filenameDate("2026-08-23T14:05:00.000Z"), "2026-08-24");
  assert.equal(
    buildCsvExport("onsite-search", { internalSearch: { queries: [] } }, { generatedAt }).filename,
    "ahc-onsite-search-2026-08-24.csv",
  );
});
