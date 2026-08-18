export const AFFILIATE_CLICK_ENDPOINT = "/api/affiliate-click";
export const ANALYTICS_SESSION_KEY = "ahc-search-session";

function normalisePath(value) {
  if (typeof value !== "string") return "";
  const path = value.trim();
  return /^\/guides\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(path) ? path : "";
}

function normaliseText(value, maximumLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/gu, " ").slice(0, maximumLength);
}

export function createAffiliateClickEvent(link, {
  pagePath,
  sessionId,
  eventId,
  device = "unknown",
} = {}) {
  if (!link || link.dataset?.commercialLink !== "affiliate") return null;
  if (link.dataset?.affiliateTrackable !== "true") return null;

  const guidePath = normalisePath(link.dataset?.commercialGuidePath);
  if (!guidePath || guidePath !== normalisePath(pagePath)) return null;

  let destination;
  try {
    destination = new URL(link.href);
  } catch {
    return null;
  }
  if (destination.protocol !== "https:") return null;

  const destinationHost = normaliseText(link.dataset?.commercialDestinationHost, 253).toLowerCase();
  if (!destinationHost || destination.hostname.toLowerCase() !== destinationHost) return null;

  const event = {
    eventId: normaliseText(eventId, 36),
    guidePath,
    productId: normaliseText(link.dataset?.commercialProductId, 120),
    productName: normaliseText(link.dataset?.commercialProductName, 200),
    affiliateNetwork: normaliseText(link.dataset?.commercialAffiliateNetwork, 80),
    merchant: normaliseText(link.dataset?.commercialMerchant, 120),
    destinationHost,
    sessionId: normaliseText(sessionId, 80),
    device: normaliseText(device, 20) || "unknown",
  };

  if (
    !event.eventId
    || !event.productId
    || !event.productName
    || !event.affiliateNetwork
    || !event.merchant
  ) {
    return null;
  }
  return event;
}

export function createAffiliateClickTracker({
  recordEvent,
  pagePath,
  sessionId,
  createEventId,
  device = () => "unknown",
}) {
  if (typeof recordEvent !== "function") throw new TypeError("recordEvent must be a function.");
  if (typeof createEventId !== "function") throw new TypeError("createEventId must be a function.");

  return {
    recordLink(link) {
      const event = createAffiliateClickEvent(link, {
        pagePath: typeof pagePath === "function" ? pagePath() : pagePath,
        sessionId: typeof sessionId === "function" ? sessionId() : sessionId,
        eventId: createEventId(),
        device: typeof device === "function" ? device() : device,
      });
      if (!event) return false;
      recordEvent(event);
      return true;
    },
  };
}
