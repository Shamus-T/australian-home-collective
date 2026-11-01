# Appliance buying-journey measurement

Scope: fridge dimensions, washer/laundry space, dishwasher sizes. Buying-journey content was published 31 October 2026; instrumentation was published and verified on 1 November in revision `5eea8ef1ee9d71eaa1417c5aeaa5854d3224216c`. Version `appliance-2026-11-01-v1`. Three labelled page-view receipts were verified in D1 and all three excluded by the shared reporting predicate. Desktop/mobile production checks emitted no collector events and sent no merchant requests. The publication receipt holds the timestamps and evidence. Do not backfill stages or attribute previous traffic gains to this instrumentation.

## Measures

- `guide_view`: page is visible, once per page load. Not proof of a human or a landing session.
- `engaged_10s`: ten accumulated seconds in a visible tab. Not proof of reading or purchase intent.
- `comparison_view`: at least half of the first comparison option heading is visible continuously for one second. Whole tall mobile tables are not used as the visibility target.
- `product_view`: at least half of a product-card heading is visible continuously for one second, once per model/page.
- `retailer_click`: the existing approved-link handler records a click, once per model/placement/page in the funnel. Shares its event ID with the existing raw affiliate record; does not create a second merchant navigation or duplicate GA4 affiliate event. Raw affiliate-click totals can exceed funnel clicks because repeats are deduplicated here.

Product-detail viewing is optional: a reader can legitimately click directly from the comparison. Reports show both branches, ordered by elapsed time on the same page, and separately disclose missing-entry events. Do not subtract all independent stage totals to invent a linear funnel.

The D1 table `buying_journey_events` stores server-observed Cloudflare country, broad device, random tab-session/page IDs and coarse referring-source/medium categories. No IP, raw referrer, arbitrary UTM strings, email or names are stored. Attribution is first observed in this browser tab; an internal arrival without saved context is `internal_unknown`, not direct/search. It is not equivalent to GA4 session attribution. Storage denial falls back to a per-page random session. `XX` country is unknown. JavaScript blocking, collectors failing, background tabs and privacy controls can cause missing observations. Back-forward cache preserves the existing page cohort.

The four non-click stages also emit GA4 custom events prefixed `buying_`; D1 is the independently queryable report and requires no GA4 custom-dimension setup. No purchase event or revenue is generated. Amazon and Partnerize reports remain authoritative for orders and commission; shared merchant totals cannot be assigned to these guides without supported merchant attribution.

## Internal work and retention

Existing `ahc_internal=1` and browser opt-out suppress all collectors. Sessions prefixed QA/test/internal also suppress client collection, including GA4 and existing affiliate/search tracking. The collector accepts deliberately labelled direct QA receipts so they remain auditable; all reporting uses the shared known-ID/prefix predicate in `apps/control-centre/src/traffic-quality.js`. Raw, excluded and unclassified counts are separate. Zero recognised tests is not proof of human traffic. No blanket deletion of direct or overseas visits.

Live browser QA must use `ahc_internal=1` and block analytics and merchants before navigation. Functional browser tests intercept every production-host request and fulfil it locally; no merchant or production analytics traffic is permitted. Any explicit D1 receipt test uses `qa_` session IDs and records exact event/page IDs in private evidence. New table retention removes events older than 400 days when new events are inserted; the privacy notice states this condition.

## Comparison plan

1. Preserve the existing 13–26 October account evidence in `tmp/australian-commercial-2026-10-31/` and `tmp/commercial-review-2026-10-31/`. It contains Australian GA4 views/click events and separate gross merchant results, but no exposure stages. It is context only for the new stage measurements.
2. Compare 17–30 October versus 2–15 November (14 complete days each) for source-native GA4 Australian traffic and affiliate events, GSC guide clicks and merchant totals. Exclude 31 October content changes and 1 November instrumentation/partial collection. Obtain the matched baseline from accounts; do not relabel the older 13–26 October figures. Preserve timezone and exclusion limitations. Merchant orders stay account-level unless supported guide attribution exists.
3. Planned first full new-stage cohort: 2–15 November, Brisbane, conditional on verified deployment on 1 November. Twice-weekly coverage checks use only complete days, without claiming a final outcome. Settled first review on/after 18 November. Second like-instrumented cohort: 16–29 November, review on/after 2 December. Both measure post-change behaviour; neither supplies a pre-change exposure funnel. If deployment is delayed, shift to complete covered 14-day windows and update the follow-up schedule accordingly.
4. Generate read-only SQL with `node scripts/buying-journey-report.mjs START END`. Save exact query and raw results. Report Australian rows first; report other/unknown country separately. Show raw and known-test events, unclassified tab sessions/page visits, ten-second engagement, comparison/product visibility, clicking visits and placement/model counts. Ratios use matching country/source/device cohorts and measured page-visit denominators; no zero-denominator percentage, no shopper label and no causal claim from a small observational sample.
5. Interpret the largest measured losses: no comparison exposure -> examine arrival intent and placement; comparison without clicks -> investigate fit, choice and offer competitiveness; merchant clicks without credited sales -> examine merchant evidence/attribution, not GA4 revenue. Check whether model availability or article changes occurred during the window. Do not automatically add products or rewrite guides on a scheduled read-only review.

Evidence, deploy time, schema receipt and QA are recorded in `tmp/buying-journey-2026-11-01/`. Before treating any window as covered, verify the collector is receiving unclassified events, the table and production binding exist, and the deployed revision matches. Absence of events alone is not proof of no readers.

Follow-up automation: `ahc-appliance-buying-journey-review`, Wednesdays and Saturdays at 09:30 Australia/Brisbane. It also checks that publication actually occurred before analysing collection. Existing availability and commercial-trial automations remain separate.
