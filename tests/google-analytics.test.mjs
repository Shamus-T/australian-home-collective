import assert from "node:assert/strict";
import test from "node:test";

import {
  AFFILIATE_CLICK_EVENT_NAME,
  ANALYTICS_OPTOUT_STORAGE_KEY,
  CONTACT_SUCCESS_EVENT_NAME,
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  applyInternalAnalyticsPreference,
  initialiseGoogleAnalytics,
  sendGoogleAnalyticsEvent,
  shouldEnableGoogleAnalytics,
} from "../src/scripts/google-analytics.js";

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("enables GA only on the two production hostnames", () => {
  assert.equal(shouldEnableGoogleAnalytics({ hostname: "australianhomecollective.com.au" }), true);
  assert.equal(shouldEnableGoogleAnalytics({ hostname: "www.australianhomecollective.com.au" }), true);
  assert.equal(shouldEnableGoogleAnalytics({ hostname: "localhost" }), false);
  assert.equal(shouldEnableGoogleAnalytics({
    hostname: "australianhomecollective.com.au",
    optedOut: true,
  }), false);
});

test("stores and removes the browser-level internal traffic preference", () => {
  const browserStorage = storage();
  const replacedUrls = [];
  const history = { replaceState: (_state, _title, url) => replacedUrls.push(url) };

  assert.equal(applyInternalAnalyticsPreference({
    location: { href: "https://australianhomecollective.com.au/?ahc_internal=1#start" },
    storage: browserStorage,
    history,
  }), true);
  assert.equal(browserStorage.getItem(ANALYTICS_OPTOUT_STORAGE_KEY), "true");
  assert.deepEqual(replacedUrls, ["/#start"]);

  assert.equal(applyInternalAnalyticsPreference({
    location: { href: "https://australianhomecollective.com.au/?ahc_internal=0" },
    storage: browserStorage,
    history,
  }), false);
  assert.equal(browserStorage.getItem(ANALYTICS_OPTOUT_STORAGE_KEY), null);
  assert.deepEqual(replacedUrls, ["/#start", "/"]);
});

test("initialises the production tag and keeps localhost and opted-out browsers clean", () => {
  const appended = [];
  const createWindow = (hostname, initialStorage = {}) => ({
    location: { hostname, href: `https://${hostname}/` },
    localStorage: storage(initialStorage),
    history: { replaceState() {} },
  });
  const documentObject = {
    querySelector: () => null,
    createElement: () => ({ async: false, src: "", dataset: {} }),
    head: { append: (tag) => appended.push(tag) },
  };

  const productionWindow = createWindow("australianhomecollective.com.au");
  assert.equal(initialiseGoogleAnalytics({ windowObject: productionWindow, documentObject }), true);
  assert.equal(appended.length, 1);
  assert.match(appended[0].src, new RegExp(GOOGLE_ANALYTICS_MEASUREMENT_ID));
  assert.equal(productionWindow.dataLayer.length, 2);

  const localWindow = createWindow("localhost");
  assert.equal(initialiseGoogleAnalytics({ windowObject: localWindow, documentObject }), false);

  const optedOutWindow = createWindow("australianhomecollective.com.au", {
    [ANALYTICS_OPTOUT_STORAGE_KEY]: "true",
  });
  assert.equal(initialiseGoogleAnalytics({ windowObject: optedOutWindow, documentObject }), false);
  assert.equal(appended.length, 1);
});

test("dispatches only valid GA4 event names when gtag is available", () => {
  const calls = [];
  const analytics = (...args) => calls.push(args);

  assert.equal(CONTACT_SUCCESS_EVENT_NAME, "generate_lead");
  assert.equal(AFFILIATE_CLICK_EVENT_NAME, "affiliate_click");
  assert.equal(sendGoogleAnalyticsEvent(CONTACT_SUCCESS_EVENT_NAME, {
    form_name: "contact",
  }, analytics), true);
  assert.deepEqual(calls, [["event", "generate_lead", { form_name: "contact" }]]);
  assert.equal(sendGoogleAnalyticsEvent("Invalid event", {}, analytics), false);
  assert.equal(sendGoogleAnalyticsEvent(AFFILIATE_CLICK_EVENT_NAME, {}, null), false);
});

function loadingBrowser() {
  const tags = [];
  let fallback;
  let fallbackDelay;
  const windowObject = Object.assign(new EventTarget(), {
    location: { hostname: "australianhomecollective.com.au", href: "https://australianhomecollective.com.au/" },
    localStorage: storage(),
    history: { replaceState() {} },
    setTimeout(callback, delay) { fallback = callback; fallbackDelay = delay; return 1; },
    clearTimeout() {},
  });
  const documentObject = Object.assign(new EventTarget(), {
    readyState: "interactive",
    visibilityState: "visible",
    querySelector: () => tags[0] ?? null,
    createElement: () => ({ dataset: {} }),
    head: { append: (tag) => tags.push(tag) },
  });
  return { windowObject, documentObject, tags, runFallback: () => fallback(), getDelay: () => fallbackDelay };
}

test("queues the initial page view and early conversions before loading the library once", () => {
  const browser = loadingBrowser();
  initialiseGoogleAnalytics(browser);
  sendGoogleAnalyticsEvent(CONTACT_SUCCESS_EVENT_NAME, { form_name: "contact" }, browser.windowObject.gtag);
  sendGoogleAnalyticsEvent(AFFILIATE_CLICK_EVENT_NAME, { guide_path: "/guides/example/" }, browser.windowObject.gtag);
  assert.equal(browser.tags.length, 0);
  assert.deepEqual(browser.windowObject.dataLayer.map((entry) => [...entry].slice(0, 2)), [
    ["js", browser.windowObject.dataLayer[0][1]],
    ["config", GOOGLE_ANALYTICS_MEASUREMENT_ID],
    ["event", CONTACT_SUCCESS_EVENT_NAME],
    ["event", AFFILIATE_CLICK_EVENT_NAME],
  ]);
  initialiseGoogleAnalytics(browser);
  assert.equal(browser.windowObject.dataLayer.length, 4, "reinitialisation must not duplicate page views");
  browser.windowObject.dispatchEvent(new Event("load"));
  browser.windowObject.dispatchEvent(new Event("pointerdown"));
  browser.runFallback();
  assert.equal(browser.tags.length, 1);
  assert.equal(browser.tags[0].fetchPriority, "low");
  assert.equal(browser.windowObject.dataLayer.length, 4, "queued events are preserved");
});

for (const event of ["pointerdown", "keydown", "pagehide"]) {
  test(`starts measurement early on ${event}`, () => {
    const browser = loadingBrowser();
    initialiseGoogleAnalytics(browser);
    browser.windowObject.dispatchEvent(new Event(event));
    assert.equal(browser.tags.length, 1);
  });
}

test("starts when the tab is hidden and bounds waiting on stalled resources", () => {
  const browser = loadingBrowser();
  initialiseGoogleAnalytics(browser);
  browser.documentObject.visibilityState = "hidden";
  browser.documentObject.dispatchEvent(new Event("visibilitychange"));
  assert.equal(browser.tags.length, 1);
  const stalled = loadingBrowser();
  initialiseGoogleAnalytics(stalled);
  assert.equal(stalled.getDelay(), 2500);
  stalled.runFallback();
  assert.equal(stalled.tags.length, 1);
});

test("loads immediately if initialised after the page has finished loading", () => {
  const browser = loadingBrowser();
  browser.documentObject.readyState = "complete";
  initialiseGoogleAnalytics(browser);
  assert.equal(browser.tags.length, 1);
});
