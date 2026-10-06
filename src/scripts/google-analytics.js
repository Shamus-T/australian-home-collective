export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-NHVS6YBB8J";
export const ANALYTICS_OPTOUT_STORAGE_KEY = "ahc-google-analytics-opt-out";
export const INTERNAL_ANALYTICS_QUERY_KEY = "ahc_internal";
export const CONTACT_SUCCESS_EVENT_NAME = "generate_lead";
export const AFFILIATE_CLICK_EVENT_NAME = "affiliate_click";

const PRODUCTION_HOSTNAMES = new Set([
  "australianhomecollective.com.au",
  "www.australianhomecollective.com.au",
]);

export function shouldEnableGoogleAnalytics({ hostname, optedOut = false } = {}) {
  return PRODUCTION_HOSTNAMES.has(String(hostname).toLowerCase()) && optedOut !== true;
}

export function applyInternalAnalyticsPreference({ location, storage, history } = {}) {
  if (!location || !storage) return false;

  try {
    const url = new URL(location.href);
    const preference = url.searchParams.get(INTERNAL_ANALYTICS_QUERY_KEY);

    if (preference === "1") {
      storage.setItem(ANALYTICS_OPTOUT_STORAGE_KEY, "true");
    } else if (preference === "0") {
      storage.removeItem(ANALYTICS_OPTOUT_STORAGE_KEY);
    }

    if (preference === "1" || preference === "0") {
      url.searchParams.delete(INTERNAL_ANALYTICS_QUERY_KEY);
      const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
      history?.replaceState?.(null, "", cleanUrl);
    }

    return storage.getItem(ANALYTICS_OPTOUT_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function sendGoogleAnalyticsEvent(eventName, parameters = {}, analytics = globalThis.gtag) {
  if (typeof analytics !== "function") return false;
  if (!/^[a-z][a-z0-9_]{0,39}$/.test(eventName)) return false;

  analytics("event", eventName, parameters);
  return true;
}

export function initialiseGoogleAnalytics({
  windowObject = globalThis.window,
  documentObject = globalThis.document,
  measurementId = GOOGLE_ANALYTICS_MEASUREMENT_ID,
} = {}) {
  if (!windowObject || !documentObject) return false;

  const optedOut = applyInternalAnalyticsPreference({
    location: windowObject.location,
    storage: windowObject.localStorage,
    history: windowObject.history,
  });

  if (!shouldEnableGoogleAnalytics({
    hostname: windowObject.location?.hostname,
    optedOut,
  })) {
    return false;
  }

  const initialisedKey = `__ahcGoogleAnalytics_${measurementId}`;
  if (windowObject[initialisedKey]) return true;
  windowObject[initialisedKey] = true;

  windowObject.dataLayer = windowObject.dataLayer || [];
  windowObject.gtag = windowObject.gtag || function gtag() {
    windowObject.dataLayer.push(arguments);
  };
  windowObject.gtag("js", new Date());
  windowObject.gtag("config", measurementId);

  if (!documentObject.querySelector(`[data-google-analytics-tag="${measurementId}"]`)) {
    let started = false;
    let timeout;
    const startEvents = ["load", "pointerdown", "keydown", "pagehide"];
    const onVisibilityChange = () => {
      if (documentObject.visibilityState === "hidden") loadTag();
    };
    const loadTag = () => {
      if (started) return;
      started = true;
      windowObject.clearTimeout?.(timeout);
      for (const event of startEvents) windowObject.removeEventListener?.(event, loadTag);
      documentObject.removeEventListener?.("visibilitychange", onVisibilityChange);
      const tag = documentObject.createElement("script");
      tag.async = true;
      tag.fetchPriority = "low";
      tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      tag.dataset.googleAnalyticsTag = measurementId;
      documentObject.head.append(tag);
    };

    // Queue page views and conversions immediately, but let essential assets
    // finish before downloading the analytics library. Interaction and a bounded
    // timeout start it early so a stalled asset cannot postpone measurement.
    if (documentObject.readyState === "complete" || documentObject.visibilityState === "hidden"
      || typeof windowObject.addEventListener !== "function"
      || typeof documentObject.addEventListener !== "function"
      || typeof windowObject.setTimeout !== "function") {
      loadTag();
    } else {
      for (const event of startEvents) windowObject.addEventListener(event, loadTag, { once: true });
      documentObject.addEventListener("visibilitychange", onVisibilityChange);
      timeout = windowObject.setTimeout(loadTag, 2500);
    }
  }

  return true;
}
