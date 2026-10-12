# Appliance buying-journey review, 12 October 2026

## Scope and merchant boundary

Improve the existing dryer and fridge guides first; retain washer and dishwasher guides as the other two monitored pages. Every buying button must be an approved affiliate offer. Manufacturer manuals and other editorial citations are evidence links, not shopping alternatives. No unpaid retailer options were added.

The dryer comparison now includes Bosch WQG24201AU (9kg heat pump) and Electrolux EDV605H3WC (6kg vented). The capacities differ deliberately: explain suitability rather than asserting a controlled efficiency comparison. A conventional condenser remains an explicit research gap. Product records contain manufacturer, manual, individual owner-feedback, Australian availability, recall-search and seller evidence. The Electrolux image comes from the exact-model Good Guys listing. No Amazon product photography was used.

The fridge guide now opens with a mm/cm size chart and model-specific width calculations for LG GB-B400PS and Westinghouse WTM4302WD-R. Body dimensions are distinct from installation space. Its search title and description answer the size/chart/width queries observed in Bing. No ranking or click-through improvement is assumed before measurement.

## Measurement contract

- Baseline: 28 September–11 October 2026 inclusive, 14 days.
- Change day: 12 October; exclude from both comparison windows.
- Follow-up: 13–26 October inclusive, 14 days; assess on or after 29 October to allow reporting to settle. Re-read the baseline then too.
- Reporting timezone: use the source account's reporting timezone and record it. D1 timestamps must be converted to Australia/Brisbane boundaries. Do not silently combine differently bounded periods.
- Pages: `/guides/washing-machine-and-dryer-space-what-to-measure-before-buying-storage/`, `/guides/dishwasher-sizes-australia/`, `/guides/fridge-dimensions-australia/`, `/guides/heat-pump-vs-condenser-vs-vented-dryers/`.
- Record GA4 views, active users, engagement and page/landing sessions where available. Qualified visits mean Australian engaged landing sessions after known internal/QA exclusions; report unavailable if that segment cannot be measured. Views and active users are not qualified visits.
- Report D1 affiliate events, distinct clicking sessions, merchant and product separately. Remove labelled QA/internal events; unidentified internal traffic or bots cannot be confidently classified as humans. Do not backfill zero for periods before functioning collection.
- Only calculate a click-through rate with a defined, matched denominator. The stored D1 event session identifier cannot be directly joined to a GA4 user/session identifier.
- Merchant reports determine ordered items and earned commission. Report pending, approved and paid amounts separately when supplied. GA4 revenue is not affiliate commission. The shared Amazon `ahc07-22` identifier cannot establish orders for these page groups.
- A reported zero order total across a merchant account is different from unknown page-level attribution. Do not assign account orders to this cohort without merchant-supported attribution.
- Preserve the original storage trial and its 7 November final review; this appliance cohort is separate.

Private raw observations and the baseline are in `tmp/appliance-commercial-followup-2026-10-12/`, not published website content. Existing client tracking suppresses localhost and visits labelled `?ahc_internal=1`; use that flag for live QA and do not click merchant buttons for testing.

## Indexing

The three Bing warnings observed on 12 October are legacy 301s: `/password`, `/pages/contact` and `/pages/australian-status-labels`. Retain useful redirects. The `/guides` folder showed zero warnings and zero errors. `/our-approach` had a historical HTTP-200 refresh page; explicit server redirects now point both forms to `/about/`.

Corrected the dryer sitemap lastmod from July to 12 October. IndexNow uses a public root ownership file (not a Cloudflare, Microsoft or account credential). Build writes a public commit-revision marker. After the main-branch build, audits and Control Centre checks, CI waits for that exact revision on production, verifies the ownership file and changed pages, then submits only sitemap-approved canonical URLs. Changes to product records and comparison copy notify their affected guides; shared presentation changes notify all sitemap pages.

Manual retry after deployment:

```powershell
node scripts/submit-indexnow.mjs --dry-run /guides/heat-pump-vs-condenser-vs-vented-dryers/ /guides/fridge-dimensions-australia/
node scripts/submit-indexnow.mjs /guides/heat-pump-vs-condenser-vs-vented-dryers/ /guides/fridge-dimensions-australia/
```

HTTP 200 means accepted; 202 means received pending key validation. Neither proves crawling, indexing or improved rankings. CI fails visibly if the revision is not live or submission fails. This implementation submits updated indexable pages; removal notifications are not implemented.

Protocol reference: https://www.indexnow.org/documentation
