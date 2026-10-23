# Affiliate availability monitoring

Implemented 24 October 2026. This replaces the expired manual supplier-order exceptions; it does not change affiliate link destinations or image assets.

## Coverage and cadence

- Good Guys: every four hours, all approved primary and additional retailer offers. Check the authenticated product feed and clean exact-product purchase pages. The catalogue currently contains 49 distinct active offers after pausing TRRS0715EG.
- Amazon Australia: daily at 06:30 Australia/Brisbane, all 78 distinct approved ASINs, including additional retailer offers. Check primary ASIN, title, availability text and order control without activating it.
- Both run on relevant main-branch changes and manual dispatch. Catalogue additions are selected automatically; no fixed shortlist to become stale.
- Both run the offline commercial audit for approved affiliate IDs, destinations and catalogue validation. They do not exercise commission redirects: redirect operation and actual merchant attribution cannot be proved without producing a referral.

## Meaning of results

Available, low-stock and supplier-order/delayed-dispatch are separate observations. Availability reflects the retailer's anonymous delivery context, not nationwide or postcode-specific stock. Low-stock and delayed dispatch stay visible in each report. Explicit unavailable status or HTTP 404/410, identity changes, redirects, bot challenges, missing evidence and network failures require attention. A challenge or unknown status never counts as available or as confirmed out of stock.

Good Guys feed Stock=No remains in the raw report. It is explained only by a fresh matching-model purchase page accepting supplier orders in the same execution. A missing feed row, wrong campaign, invalid price/currency, identity change or failed page check cannot be waived this way. No indefinitely renewed manual exception is used.

Previous listing titles remain the comparison baseline across failures and changes. A changed title requires review; repeated runs do not silently accept the new identity. After a verified legitimate identity change, explicitly refresh the relevant cached baseline with documented evidence.

## Response to problems

Each execution saves a sanitised report artifact and summary. Failures open or update one owned GitHub issue per merchant, with product names and clean URLs. Unchanged faults do not generate repeated comments; a fully successful subsequent check closes the issue. Missing reports are monitoring failures, not a pass.

Investigate reported faults against a clean direct listing. Pause a confirmed withdrawn offer and correct affected article wording/coverage; do not disable links solely because an automated request was blocked. Do not substitute another model without proper suitability research. Keep low-stock offers under observation and disclose a material wait where it affects suitability. Do not promise delivery.

## Click integrity

`scripts/research-url.mjs` decodes approved destinations offline. `fetchProduct` accepts canonical clean retailer product URLs only, strips no query at fetch time, follows no redirects, sends no cookies or Referer, and executes no JavaScript, analytics, image or cart requests. Tests exercise rejection of tagged URLs, redirects, ASIN mismatches, hidden unrelated stock text and invalid feed exceptions. This prevents the monitor from generating affiliate referrals; retailer server access logs can still record the anonymous page request.

AHC browser QA must use `?ahc_internal=1` with analytics and merchant requests blocked. Never test a shopping button by clicking through. No historical merchant clicks are subtracted because of this repair.

## Initial findings

24 October clean-page sweep: 128 offers, 113 available, 10 low-stock, four orderable with delayed dispatch/supplier ordering, one withdrawn. All 78 Amazon ASINs were orderable at that observation; this does not guarantee later availability.

- De'Longhi TRRS0715EG: exact Good Guys page says NOT AVAILABLE / no longer available. Buying option paused; heater guide revised; oil-column replacement remains an explicitly recorded research gap.
- GOAT O600 RTK: supplier-order purchase option remains present. Existing delivery caveat retained, warranty unchanged. Fresh page validation replaces the expired exception.
- Instant Duo Plus 8L: also supplier-order on its purchase page; existing caveat retained.
- Cowdroy repair patches: Amazon dispatch stated 2–4 weeks. Updated the product drawback to flag unsuitability for an urgent repair.
- Keter Borneo: Amazon dispatch stated 6–7 days. Updated both article placements with the dated dispatch caveat.

Local evidence: `tmp/availability-2026-10-24/requests.json`, numbered raw HTML, and `all.json`. Images were not downloaded or modified. Scheduled-run verification is required separately from this local sweep.
