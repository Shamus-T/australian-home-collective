import assert from "node:assert/strict";
import test from "node:test";
import { createWorksheetDownloadEvent, WORKSHEET_DOWNLOAD_EVENT_NAME } from "../src/scripts/measurement-download-tracker.js";

const page = "https://australianhomecollective.com.au/guides/dishwasher-sizes-australia/?utm_source=test";
const link = {
  href: "/downloads/dishwasher-measurement-worksheet.pdf?private=exclude#page=1",
  dataset: { measurementDownload: "dishwasher", downloadLocation: "intro" },
};

test("worksheet clicks identify the guide, PDF and placement without query strings", () => {
  assert.equal(WORKSHEET_DOWNLOAD_EVENT_NAME, "worksheet_download");
  assert.deepEqual(createWorksheetDownloadEvent(link, page), {
    appliance: "dishwasher",
    guide_path: "/guides/dishwasher-sizes-australia/",
    file_name: "dishwasher-measurement-worksheet.pdf",
    file_extension: "pdf",
    link_url: "https://australianhomecollective.com.au/downloads/dishwasher-measurement-worksheet.pdf",
    download_location: "intro",
  });
  assert.equal(createWorksheetDownloadEvent({...link, dataset: {measurementDownload:"dishwasher"}},page).download_location,"measurement_resource");
  assert.equal(createWorksheetDownloadEvent({...link, dataset: {...link.dataset,downloadLocation:"checklist"}},page).download_location,"checklist");
});

test("unrelated, external and mismatched downloads are not worksheet events", () => {
  for (const candidate of [null, {...link,href:"https://example.com/downloads/dishwasher-measurement-worksheet.pdf"},
    {...link,href:"/downloads/fridge-measurement-worksheet.pdf"}, {...link,dataset:{measurementDownload:"unknown"}}]) {
    assert.equal(createWorksheetDownloadEvent(candidate,page),null);
  }
});
