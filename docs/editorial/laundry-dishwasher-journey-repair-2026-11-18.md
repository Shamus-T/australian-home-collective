# Laundry and dishwasher buying-journey repair — 18 November 2026

## Evidence and scope

The completed 2–15 November Brisbane D1 cohort is in `tmp/buying-journey-review-2026-11-18/`. Australia: laundry 106 measured visits, 86 comparison views, nine clicking visits; dishwasher 44 visits, 36 comparison views, eight clicking visits. Mobile dishwasher: 17/12/1. These are unclassified measured visits, not verified shoppers. Zero identified tests is not a clean-human guarantee. The figures identify where activity stops, not its cause.

Fresh no-click live layout checks at 320, 390, 768 and 1440px are in `tmp/journey-repair-2026-11-18/before.json`. At 390px, full washer dimensions started at 8,212px, after five product cards; the stack section started at 9,936px. Dishwasher installation/choice guidance also followed all four product cards. Important restrictions (including no stacking on the shallow LG washer) required opening collapsed notes. The approved buttons rendered and retained their destinations: this was not a confirmed broken-link incident.

## Repair

- Move existing washer measurement and documented Bosch stack guidance immediately after the comparison, ahead of long product cards. Add a full-measurements shortcut and a return link to the comparison.
- Move dishwasher rack/installation choice guidance and model-specific installation qualifications ahead of the cards. Add explicit return links to each relevant model and its approved retailer option.
- Surface essential fit restrictions beside existing retailer buttons for these seven models. Preserve detailed notes, original manufacturer references and qualifications. No new products, stock claims, offer destinations, merchant artwork or tracking definitions.

Use `tmp/journey-repair-2026-11-18/publication.json` for the actual live boundary. This is another intervention inside the 16–29 November comparison window; split at verified publication when reviewing, and do not claim a controlled before/after result. The separate automations and their dates remain unchanged.

## Validation and merchant outcomes

Run full build/audits and buying-journey regression tests. Check 320, 390, 768 and 1440px local and live layouts, fit guidance order, visible essential notes, model jumps, 212 × 56 retailer buttons, approved artwork and exact registered destinations. Production QA uses `ahc_internal=1`, blocks analytics and merchants before loading, and does not click retailer links. Save evidence in the folder above.

Live Partnerize report, 2–15 November inclusive, Australia/Brisbane, clicks and conversions, all campaigns, approved and pending: the sole campaign row was The Good Guys Australia, 77 gross clicks, zero conversions/items, A$0 order value and A$0 commission. These are account-wide merchant figures, not guide-attributed sales; do not subtract D1 QA counts. Evidence: `merchant-outcomes.json` in the repair folder. Amazon remains unverified because Computer Use stopped on its browser URL policy check when opening another report tab. No claim of zero Amazon sales is made.
