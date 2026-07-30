import assert from "node:assert/strict";
import test from "node:test";

import { __test } from "../src/db.js";

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
