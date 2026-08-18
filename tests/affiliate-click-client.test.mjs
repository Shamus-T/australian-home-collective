import assert from "node:assert/strict";
import test from "node:test";

import {
  AFFILIATE_CLICK_ENDPOINT,
  ANALYTICS_SESSION_KEY,
  createAffiliateClickEvent,
  createAffiliateClickTracker,
} from "../src/scripts/affiliate-click-tracker.js";

const pagePath = "/guides/coffee-machine-types-australia/";
const eventId = "550e8400-e29b-41d4-a716-446655440000";

function link(overrides = {}) {
  const { dataset = {}, ...linkOverrides } = overrides;
  return {
    href: "https://www.amazon.com.au/dp/B000000000?tag=ahc07-22",
    ...linkOverrides,
    dataset: {
      commercialLink: "affiliate",
      affiliateTrackable: "true",
      commercialProductId: "breville-barista-express",
      commercialProductName: "Breville Barista Express",
      commercialGuidePath: pagePath,
      commercialAffiliateNetwork: "amazon-australia",
      commercialMerchant: "Amazon Australia",
      commercialDestinationHost: "www.amazon.com.au",
      ...dataset,
    },
  };
}

test("builds a complete event from rendered commercial-link metadata", () => {
  assert.equal(AFFILIATE_CLICK_ENDPOINT, "/api/affiliate-click");
  assert.equal(ANALYTICS_SESSION_KEY, "ahc-search-session");
  assert.deepEqual(createAffiliateClickEvent(link(), {
    pagePath,
    sessionId: "session_12345678",
    eventId,
    device: "desktop",
  }), {
    eventId,
    guidePath: pagePath,
    productId: "breville-barista-express",
    productName: "Breville Barista Express",
    affiliateNetwork: "amazon-australia",
    merchant: "Amazon Australia",
    destinationHost: "www.amazon.com.au",
    sessionId: "session_12345678",
    device: "desktop",
  });
});

test("does not track retailer links or stale page and destination metadata", () => {
  const options = { pagePath, sessionId: "session_12345678", eventId, device: "desktop" };
  assert.equal(createAffiliateClickEvent(link({ dataset: { commercialLink: "retailer" } }), options), null);
  assert.equal(createAffiliateClickEvent(link(), { ...options, pagePath: "/guides/another-guide/" }), null);
  assert.equal(createAffiliateClickEvent(link({
    dataset: { commercialDestinationHost: "example.com" },
  }), options), null);
  assert.equal(createAffiliateClickEvent(link({ href: "http://www.amazon.com.au/dp/B000000000" }), options), null);
});

test("records one event for any future affiliate link carrying the shared attributes", () => {
  const events = [];
  const tracker = createAffiliateClickTracker({
    recordEvent: (event) => events.push(event),
    pagePath: () => pagePath,
    sessionId: () => "session_12345678",
    createEventId: () => eventId,
    device: () => "mobile",
  });

  assert.equal(tracker.recordLink(link()), true);
  assert.equal(events.length, 1);
  assert.equal(events[0].device, "mobile");
  assert.equal(tracker.recordLink(link({ dataset: { commercialLink: "retailer" } })), false);
  assert.equal(events.length, 1);
});
