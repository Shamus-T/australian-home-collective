import { sendGoogleAnalyticsEvent } from "./google-analytics.js";
import { shouldTrackAnalytics } from "./analytics-preference.js";

export const WORKSHEET_DOWNLOAD_EVENT_NAME = "worksheet_download";
const APPLIANCES = new Set(["washing-machine", "dishwasher", "fridge", "rangehood"]);

export function createWorksheetDownloadEvent(link, pageUrl) {
  const appliance = link?.dataset?.measurementDownload;
  if (!APPLIANCES.has(appliance)) return null;
  try {
    const page = new URL(pageUrl);
    const destination = new URL(link.href, page);
    const fileName = `${appliance}-measurement-worksheet.pdf`;
    if (destination.origin !== page.origin || destination.pathname !== `/downloads/${fileName}`) return null;
    return {
      appliance,
      guide_path: page.pathname,
      file_name: fileName,
      file_extension: "pdf",
      link_url: `${destination.origin}${destination.pathname}`,
      download_location: ["intro", "checklist"].includes(link.dataset.downloadLocation)
        ? link.dataset.downloadLocation : "measurement_resource",
    };
  } catch {
    return null;
  }
}

export function initialiseMeasurementDownloadTracking({
  windowObject = globalThis.window,
  documentObject = globalThis.document,
} = {}) {
  if (!windowObject || !documentObject) return;
  const record = (event) => {
    if (!shouldTrackAnalytics(windowObject)) return;
    if (!(event.target instanceof windowObject.Element)) return;
    const link = event.target.closest("a[data-measurement-download]");
    const parameters = createWorksheetDownloadEvent(link, windowObject.location.href);
    if (parameters) sendGoogleAnalyticsEvent(WORKSHEET_DOWNLOAD_EVENT_NAME, parameters, windowObject.gtag);
  };
  documentObject.addEventListener("click", (event) => {
    if (event.button === 0) record(event);
  });
  documentObject.addEventListener("auxclick", (event) => {
    if (event.button === 1) record(event);
  });
}
