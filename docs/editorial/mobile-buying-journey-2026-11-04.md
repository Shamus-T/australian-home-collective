# Fridge and laundry mobile buying journey — 4 November 2026

## Evidence and scope

The 2–3 November Brisbane D1 cohort had 15 Australian mobile page visits and no clicking visits, versus six clicking visits among 23 desktop visits across fridge, laundry and dishwasher. These visits are unclassified, not verified shoppers, and the sample does not establish a mobile defect or conversion uplift. Preserve the raw review in `tmp/buying-journey-review-2026-11-04/`.

Fresh live checks at 320, 390 and 1440px found no page overflow and rendered the approved retailer buttons. At 390px the fridge comparison began at y=4525 and its first retailer button at y=5113; laundry was y=3640 and y=4229 respectively. These are document coordinates for the captured viewport, not time-to-purchase. Evidence: `tmp/mobile-journey-2026-11-04/before.json` and screenshots.

## Changes

- Replace repeated introductory chooser prose with large, need-led internal jump links to the existing comparison rows. Preserve the original deep links and all exact-model fit and stacking constraints.
- Bring the fridge comparison before its detailed size chart; keep the size chart directly after the comparison and before longer product cards, with a visible measuring route near the start.
- Bring the laundry comparison forward; distinguish the shallow 8kg front loader, 9kg dosing/stack option, 9kg top loader and documented Bosch stack. Keep the grouped washer, dryer and kit buying links and their separate-purchase warning.
- Compact comparison thumbnails beside model names on these two guides only. Preserve all existing approved affiliate destinations, tracking, disclosures and 212 × 56 retailer artwork footprints. No new product, stock or price claims.

## Measurement boundary

From this release, comparison exposure observes **any comparison-row heading**, not only the first row. A direct jump to a later option must not be misreported as skipping the comparison. The same half-visible, one-continuous-second threshold and once-per-page deduplication remain. Event schema/version stays `appliance-2026-11-01-v1` so historical and still-open-page events remain accepted and reportable; no historical rows are changed.

The release timestamp/revision must be retained in `tmp/mobile-journey-2026-11-04/publication.json` when publication is verified. This is an additional intervention inside the 2–15 November window. Separate 2–3 November, the partial deployment day, and later complete days when interpreting the response; do not attribute an exposure increase entirely to reader behaviour. The scheduled 18 November assessment and separate automations remain unchanged. Historical exposure cannot be reconstructed.

## QA integrity

Live inspection uses `ahc_internal=1` and blocks external and collector requests before navigation. Functional tests serve production-origin pages entirely from local build files, mock collector responses and abort every external request. Affiliate destinations are checked against the approved catalogue offline. No production event receipts or real merchant clicks are needed. Preserve raw test outcomes, blocked-request counts, screenshots, build log and deployment verification in the dated evidence directory.

Local validation passed: full `npm run build`, ten journey/research-integrity unit tests, mocked browser stage/deduplication and exclusion checks, plus approved-destination/artwork and jump-link checks at 320, 390 and 1440px. The dishwasher was included as a shared-component/tracker regression check. Internal QA produced zero collector attempts; simulated clicks were intercepted locally and all merchant requests aborted. At 390px the revised first retailer buttons are y=2783 for fridge and y=2937 for laundry, approximately 46% and 31% less document scrolling respectively. This is a layout improvement, not a measured affiliate-click or sales uplift.
