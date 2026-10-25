# Affiliate availability monitoring

Implemented 24 October 2026. This replaces the expired manual supplier-order exceptions; it does not change affiliate link destinations or image assets.

## Coverage and cadence

- Good Guys: every four hours, all approved primary and additional retailer offers. Check the authenticated product feed and clean exact-product purchase pages. As of 26 October the catalogue contains 55 distinct active offers, including the freshly researched Tefal B4850217 pan. C2780483 was already monitored; its new kitchen placement does not add a second unique offer. The monitor derives coverage from the current catalogue; no fixed SKU list needs updating.
- Amazon Australia: daily at 09:00 Australia/Brisbane through the local AHC affiliate availability follow-up, all currently approved ASINs, including additional retailer offers. As of 26 October, the catalogue selects 85 distinct offers after the five-category additions and Outward Hound 51006; this count is not a fresh whole-catalogue stock result. Check primary ASIN, title, availability text and order control without activating it. This requires Shane's computer/Codex to be available; a missed or blocked run is a coverage gap, not a stock confirmation.
- GitHub checks Amazon link structure offline daily at 06:30 Brisbane. The first cloud stock run was challenged on 76 listings and gave different availability on two; the cloud requests have been removed. Its green offline result must never be presented as a stock check. No proxies, CAPTCHA bypass or browser impersonation are used.
- Both GitHub workflows run on relevant main-branch changes and manual dispatch. Catalogue additions are selected automatically; no fixed shortlist to become stale.
- Both workflows run the offline commercial audit for approved affiliate IDs, destinations and catalogue validation. They do not exercise commission redirects: redirect operation and actual merchant attribution cannot be proved without producing a referral.

## Meaning of results

Available, low-stock and supplier-order/delayed-dispatch are separate observations. Availability reflects the retailer's anonymous delivery context, not nationwide or postcode-specific stock. Low-stock and delayed dispatch stay visible in each report. Explicit unavailable status or HTTP 404/410, identity changes, redirects, bot challenges, missing evidence and network failures require attention. A challenge or unknown status never counts as available or as confirmed out of stock.

Good Guys feed Stock=No remains in the raw report. It is explained only by a fresh matching-model purchase page accepting supplier orders in the same execution. A missing feed row, wrong campaign, invalid price/currency, identity change or failed page check cannot be waived this way. No indefinitely renewed manual exception is used.

Previous listing titles remain the comparison baseline across failures and changes. A changed title requires review; repeated runs do not silently accept the new identity. After a verified legitimate identity change, explicitly refresh the relevant cached baseline with documented evidence.

## Response to problems

Each Good Guys execution saves a sanitised report artifact and summary. Failures open or update one owned GitHub issue, with product names and clean URLs. Unchanged faults do not generate repeated comments; a fully successful subsequent check closes the issue. Missing reports are monitoring failures, not a pass. Amazon's daily local follow-up saves its current report and previous comparison at `tmp/availability-monitor/amazon.json` and `amazon-previous.json`, investigates faults and reports meaningful changes in this chat.

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

## Deployment and actual execution verification

Commit `781cdf2` passed the full local build, GitHub build/audits and Cloudflare deployment. The five affected live pages were checked with internal/no-cache requests: withdrawn heater shopping link absent, corrected heater copy present, both Keter placements and Cowdroy dispatch caveats present, GOAT supplier-order caveat retained.

[Good Guys run 40030935129](https://github.com/Shamus-T/australian-home-collective/actions/runs/40030935129) substantively checked 49 feed offers and 49 clean pages: 47 available, two supplier-order, zero unresolved faults. Raw feed Stock=No for GOAT is preserved and reconciled against its fresh exact-model supplier-order purchase page.

[Initial Amazon cloud run 40030935087](https://github.com/Shamus-T/australian-home-collective/actions/runs/40030935087) failed honestly: 76 challenged pages and two different availability results from the cloud delivery context. This is not evidence of 78 unavailable products. That cloud stock fetch has been removed; the named daily local follow-up performs fresh checks instead. The GitHub workflow name now explicitly says offline, and its summary states that it does not verify stock.
