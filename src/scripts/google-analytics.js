import { shouldTrackAnalytics } from "./analytics-preference.js";
export {
  ANALYTICS_OPTOUT_STORAGE_KEY,
  INTERNAL_ANALYTICS_QUERY_KEY,
  applyInternalAnalyticsPreference,
  shouldEnableAnalytics as shouldEnableGoogleAnalytics,
  shouldTrackAnalytics,
} from "./analytics-preference.js";

export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-NHVS6YBB8J";
export const CONTACT_SUCCESS_EVENT_NAME = "generate_lead";
export const AFFILIATE_CLICK_EVENT_NAME = "affiliate_click";

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

  if (!shouldTrackAnalytics(windowObject)) {
    return false;
  }

  windowObject.dataLayer = windowObject.dataLayer || [];
  windowObject.gtag = windowObject.gtag || function gtag() {
    windowObject.dataLayer.push(arguments);
  };
  windowObject.gtag("js", new Date());
  windowObject.gtag("config", measurementId);

  if (!documentObject.querySelector(`[data-google-analytics-tag="${measurementId}"]`)) {
    const tag = documentObject.createElement("script");
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    tag.dataset.googleAnalyticsTag = measurementId;
    documentObject.head.append(tag);
  }

  return true;
}
