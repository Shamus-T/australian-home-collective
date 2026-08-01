import assert from "node:assert/strict";
import test from "node:test";

import {
  SEARCH_ANALYTICS_DEBOUNCE_MS,
  createSearchAnalyticsTracker,
  normaliseAnalyticsQuery,
  visibleQueryCharacterCount,
} from "../src/scripts/search-analytics-tracker.js";

function fakeClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();

  const schedule = (callback, delay) => {
    const id = nextId;
    nextId += 1;
    timers.set(id, { at: now + delay, callback });
    return id;
  };

  const cancel = (id) => {
    timers.delete(id);
  };

  const advance = (milliseconds) => {
    const target = now + milliseconds;
    while (true) {
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= target)
        .sort((left, right) => left[1].at - right[1].at)[0];
      if (!due) break;
      const [id, timer] = due;
      timers.delete(id);
      now = timer.at;
      timer.callback();
    }
    now = target;
  };

  return { advance, cancel, schedule };
}

function harness() {
  const events = [];
  const clock = fakeClock();
  const tracker = createSearchAnalyticsTracker({
    recordEvent: (event) => events.push(event),
    schedule: clock.schedule,
    cancel: clock.cancel,
  });
  return { clock, events, tracker };
}

test("continuous typing records one final query with its final result count", () => {
  const { clock, events, tracker } = harness();
  const prefixes = [
    "kit",
    "kitchen",
    "kitchen si",
    "kitchen sink",
    "kitchen sink g",
    "kitchen sink guid",
    "kitchen sink guide",
  ];

  for (const [index, query] of prefixes.entries()) {
    tracker.handleQueryChange(query, { active: true });
    tracker.handleResults(query, index);
    clock.advance(200);
  }

  clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS - 201);
  assert.deepEqual(events, []);
  clock.advance(1);
  assert.deepEqual(events, [{
    eventType: "search",
    query: "kitchen sink guide",
    resultCount: 6,
  }]);
});

test("pauses shorter than 1,200 ms never persist intermediate prefixes", () => {
  const { clock, events, tracker } = harness();

  for (const [query, resultCount] of [
    ["kit", 18],
    ["kitchen", 12],
    ["kitchen sink", 4],
  ]) {
    tracker.handleQueryChange(query, { active: true });
    tracker.handleResults(query, resultCount);
    clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS - 1);
    assert.deepEqual(events, []);
  }

  tracker.handleQueryChange("kitchen sink guide", { active: true });
  tracker.handleResults("kitchen sink guide", 2);
  clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS);
  assert.equal(events.length, 1);
  assert.equal(events[0].query, "kitchen sink guide");
  assert.equal(events[0].resultCount, 2);
});

test("Enter before the debounce records exactly one completed search", () => {
  const { clock, events, tracker } = harness();
  tracker.handleQueryChange("Kitchen Sink Guide", { active: true });
  tracker.completeSearch("enter");
  tracker.handleResults("Kitchen Sink Guide", 3);
  clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS * 2);

  assert.deepEqual(events, [{
    eventType: "search",
    query: "kitchen sink guide",
    resultCount: 3,
  }]);
  assert.equal(tracker.getState().lastRecordedTrigger, "enter");
});

test("a result click records one search and one attributed click without a later duplicate", () => {
  const { clock, events, tracker } = harness();
  tracker.handleQueryChange("kitchen sink guide", { active: true });
  tracker.handleResults("kitchen sink guide", 5);
  assert.equal(
    tracker.recordResultClick("/guides/kitchen-sink-buying-guide/"),
    true,
  );
  clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS * 2);

  assert.deepEqual(events, [
    {
      eventType: "search",
      query: "kitchen sink guide",
      resultCount: 5,
    },
    {
      eventType: "result_click",
      query: "kitchen sink guide",
      resultCount: 5,
      selectedPath: "/guides/kitchen-sink-buying-guide/",
    },
  ]);
});

test("queries with fewer than three visible characters are ignored", () => {
  const { clock, events, tracker } = harness();

  for (const query of ["", "a", "ab", "a b", " \t a \n b "]) {
    tracker.handleQueryChange(query, { active: true });
    tracker.handleResults(query, 1);
    clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS);
  }

  assert.deepEqual(events, []);
  assert.equal(visibleQueryCharacterCount("a b"), 2);
  assert.equal(visibleQueryCharacterCount("a b c"), 3);
});

test("whitespace and casing normalise consistently without duplicate aggregation", () => {
  const { clock, events, tracker } = harness();
  tracker.handleQueryChange("  Kitchen   Sink GUIDE  ", { active: true });
  tracker.handleResults("  Kitchen   Sink GUIDE  ", 4);
  clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS);

  tracker.handleQueryChange("kitchen sink guide", { active: true });
  tracker.handleResults("kitchen sink guide", 4);
  clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS);

  assert.equal(normaliseAnalyticsQuery("  Kitchen   Sink GUIDE  "), "kitchen sink guide");
  assert.equal(events.length, 1);
  assert.equal(events[0].query, "kitchen sink guide");
});

test("clearing the field cancels pending completion tracking", () => {
  const { clock, events, tracker } = harness();
  tracker.handleQueryChange("kitchen sink guide", { active: true });
  tracker.handleResults("kitchen sink guide", 4);
  tracker.handleQueryChange("", { active: true });
  clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS * 2);

  assert.deepEqual(events, []);
  assert.equal(tracker.getState().hasPendingTimer, false);
});

test("unloading the page cancels pending completion tracking", () => {
  const { clock, events, tracker } = harness();
  tracker.handleQueryChange("kitchen sink guide", { active: true });
  tracker.handleResults("kitchen sink guide", 4);
  tracker.cancelPending();
  clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS * 2);

  assert.deepEqual(events, []);
  assert.equal(tracker.getState().hasPendingTimer, false);
});

test("programmatic restoration does not record until the reader actively submits", () => {
  const { clock, events, tracker } = harness();
  tracker.handleQueryChange("kitchen sink guide");
  tracker.handleResults("kitchen sink guide", 4);
  clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS * 2);
  assert.deepEqual(events, []);

  tracker.completeSearch("enter");
  assert.equal(events.length, 1);
  assert.equal(events[0].query, "kitchen sink guide");
});

test("returning deliberately to an earlier query starts a new completion revision", () => {
  const { clock, events, tracker } = harness();

  for (const [query, count] of [
    ["kitchen sink guide", 4],
    ["bathroom storage", 8],
    ["kitchen sink guide", 4],
  ]) {
    tracker.handleQueryChange(query, { active: true });
    tracker.handleResults(query, count);
    clock.advance(SEARCH_ANALYTICS_DEBOUNCE_MS);
  }

  assert.deepEqual(events.map((event) => event.query), [
    "kitchen sink guide",
    "bathroom storage",
    "kitchen sink guide",
  ]);
});
