export const ANALYTICS_OPTOUT_STORAGE_KEY = "ahc-google-analytics-opt-out";
export const INTERNAL_ANALYTICS_QUERY_KEY = "ahc_internal";

const PRODUCTION_HOSTNAMES = new Set([
  "australianhomecollective.com.au",
  "www.australianhomecollective.com.au",
]);

export function shouldEnableAnalytics({ hostname, optedOut = false } = {}) {
  return PRODUCTION_HOSTNAMES.has(String(hostname).toLowerCase()) && optedOut !== true;
}

export function applyInternalAnalyticsPreference({ location, storage, history } = {}) {
  if (!location) return false;

  let preference;
  try {
    const url = new URL(location.href);
    preference = url.searchParams.get(INTERNAL_ANALYTICS_QUERY_KEY);
    // Keep the query preference when storage is unavailable so every tracker
    // on this page can still honour an internal visit.
    if (!storage) return preference === "1";

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
    return preference === "1";
  }
}

export function shouldTrackAnalytics(windowObject = globalThis.window) {
  if (!windowObject?.location) return false;
  let storage;
  try {
    storage = windowObject.localStorage;
  } catch {
    // A browser can deny access to storage without disabling the page.
  }
  const optedOut = applyInternalAnalyticsPreference({
    location: windowObject.location,
    storage,
    history: windowObject.history,
  });
  return shouldEnableAnalytics({ hostname: windowObject.location.hostname, optedOut });
}
