import assert from "node:assert/strict";
import test from "node:test";

import {
  SEARCH_TRACKING_CORRECTED_FROM,
  __test,
  loadOverview,
} from "../src/db.js";

test("clamps dashboard reporting periods", () => {
  assert.equal(__test.clampDays("7"), 7);
  assert.equal(__test.clampDays("28"), 28);
  assert.equal(__test.clampDays("365"), 28);
});

test("creates content and integration actions", () => {
  const actions = __test.buildActions({
    internalSearches: [{ query: "integrated dishwasher", no_results: 3 }],
    gscPages: [{ page: "/guides/fridge/", impressions: 120, ctr: 0.01, position: 9 }],
    integrations: [{ source: "ga4", label: "Google Analytics 4", state: "not_configured", detail: "Connect it." }],
  });
  assert.equal(actions[0].type, "content-gap");
  assert.ok(actions.some((action) => action.type === "ctr"));
  assert.ok(actions.some((action) => action.type === "integration"));
});

test("interprets low Search Console CTR in the context of average position", () => {
  const actions = __test.buildActions({
    internalSearches: [],
    gscPages: [
      { page: "/guides/page-one/", impressions: 120, ctr: 0.01, position: 9 },
      { page: "/guides/page-two/", impressions: 120, ctr: 0.01, position: 15 },
      { page: "/guides/deeper/", impressions: 120, ctr: 0.01, position: 25 },
      { page: "/guides/healthy-ctr/", impressions: 120, ctr: 0.03, position: 15 },
    ],
    integrations: [],
  });

  const actionFor = (page) => actions.find((action) => action.title.endsWith(page));

  assert.equal(actionFor("/guides/page-one/").type, "ctr");
  assert.match(actionFor("/guides/page-one/").title, /title and search snippet/i);
  assert.match(actionFor("/guides/page-two/").title, /ranking and search snippet/i);
  assert.match(actionFor("/guides/deeper/").title, /content and authority/i);
  assert.match(actionFor("/guides/deeper/").detail, /before treating CTR as a snippet problem/i);
  assert.match(actionFor("/guides/healthy-ctr/").title, /^Strengthen /);
});

test("uses a reporting-only historical prefix treatment and exposes its boundary", async () => {
  const statements = [];
  const database = {
    prepare(sql) {
      const statement = {
        sql,
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async all() {
          return { results: [] };
        },
      };
      statements.push(statement);
      return statement;
    },
  };

  const overview = await loadOverview(database, { days: 28 });
  const effectiveSearchStatements = statements.filter((statement) =>
    statement.sql.includes("effective_searches")
  );

  assert.equal(effectiveSearchStatements.length, 2);
  assert.ok(effectiveSearchStatements.every((statement) =>
    statement.values[1] === SEARCH_TRACKING_CORRECTED_FROM
  ));
  assert.match(__test.effectiveSearchesCte, /later\.session_id = candidate\.session_id/);
  assert.match(__test.effectiveSearchesCte, /<= 2/);
  assert.match(__test.effectiveSearchesCte, /attributed_click\.event_type = 'result_click'/);
  assert.equal(
    overview.internalSearch.trackingCorrectedFrom,
    SEARCH_TRACKING_CORRECTED_FROM,
  );
  assert.match(overview.internalSearch.historicalTreatment, /raw events are retained/i);
});
