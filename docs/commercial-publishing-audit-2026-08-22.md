# Commercial publishing audit — 22 August 2026

## Executive summary

Australian Home Collective's existing commercial system is structurally sound and appropriately restrained. The audit covered every published guide, every commercial product record and every unique Amazon Australia destination in the registry.

| Measure | Before | After |
| --- | ---: | ---: |
| Published guides audited | 129 | 129 |
| Commercially enabled guides | 33 | 33 |
| Guides carrying affiliate products | 33 | 33 |
| Affiliate product records | 76 | 76 |
| Unique Amazon Australia destinations | 70 | 70 |
| Deliberately unmonetised guides | 96 | 96 |
| Newly monetised guides in this audit | 0 | 0 |

The current 33-guide rollout already covered the guides with the strongest purchase intent and evidence-supported products. This audit therefore concentrated on accuracy, trust and guardrails rather than adding affiliate links for their own sake.

The Amazon Australia review found 14 unique destinations that were unavailable, had no current featured offer, resolved to the wrong size or variant, or otherwise no longer matched the editorial record. Because one destination was reused in two guides, 15 product records were affected. All 15 records were corrected with current, identity-matched Amazon Australia listings; no product block had to be removed.

Amazon availability and listing details can change after the review date. The registry's validation dates and status fields remain the source of truth for when each link was last checked.

## Audit method

- Enumerated every `index.astro` route under `src/pages/guides`: 129 published guides.
- Reconciled those routes with the commercial registry: 33 enabled and 96 deliberately not enabled.
- Reviewed all 76 product records for editorial approval, suitability, drawbacks, source support, affiliate metadata and guide placement.
- Opened all 70 unique Amazon Australia destinations in a browser on 22 August 2026 and checked the resolved product identity, Australian listing, current offer state and tracking parameter.
- Checked replacement listings for exact identity, current buy-box controls and a supporting manufacturer or brand source.
- Reviewed the disclosure, privacy, editorial, methodology, corrections and site-identity pages and the in-article disclosure UX.
- Ran automated commercial-data, internal-link, policy, accessibility, build-output and structured-data checks.

## Guide classification

The four classes below are exhaustive and mutually exclusive. Counts reconcile to all 129 published guides.

### A. Commercially suitable now — 33

These guides have clear purchase intent, genuinely suitable products, adequate evidence and restrained inline placement. They remain enabled.

- `air-conditioner-dry-mode-humidity`
- `bathroom-vanity-storage-what-to-sort-before-buying-organisers`
- `bedroom-wardrobe-organisation-what-to-sort-before-buying-storage`
- `coffee-machine-types-australia`
- `cookware-materials-compared`
- `cordless-stick-vacuums-australia`
- `garage-shelving-what-to-measure-before-buying-storage-units`
- `garage-storage-tubs-what-to-sort-before-buying-more-containers`
- `garage-tool-storage-what-to-sort-before-buying-cabinets-or-pegboards`
- `garage-wall-storage-what-to-check-before-buying-hooks-rails-or-panels`
- `home-office-cable-management-what-to-plan-before-buying-organisers`
- `home-office-lighting-what-to-compare-before-you-buy`
- `home-office-storage-for-paperwork-tech-and-supplies-what-to-plan-before-buying`
- `how-to-choose-the-right-dog-bed-for-your-home`
- `how-to-keep-house-cooler-in-summer`
- `kitchen-drawer-storage-what-to-measure-before-buying-organisers`
- `laundry-basket-storage-what-to-sort-before-buying-hampers-or-sorters`
- `laundry-drying-space-what-to-measure-before-buying-airers-or-racks`
- `laundry-tub-storage-what-to-check-before-buying-under-sink-organisers`
- `outdoor-shade-setup-for-patios-and-backyards-what-to-check-before-buying`
- `outdoor-storage-for-small-australian-backyards-what-to-plan-before-buying`
- `pantry-storage-what-to-measure-before-buying-organisers`
- `pet-food-storage-what-to-check-before-buying-containers`
- `pet-gates-barriers-and-room-separation-what-to-check-before-you-buy`
- `pet-travel-essentials-what-to-check-before-buying-car-travel-gear`
- `portable-air-conditioners-australia`
- `robot-vacuum-buying-guide-australia`
- `shower-storage-what-to-check-before-buying-caddies-or-shelves`
- `small-bathroom-storage-what-to-check-before-buying-shelves-or-caddies`
- `small-kitchen-appliances-what-to-check-before-you-buy`
- `under-bed-storage-what-to-measure-before-you-buy`
- `under-sink-bathroom-storage-what-to-check-before-buying-organisers`
- `under-sink-kitchen-storage-what-to-check-before-you-buy`

### B. Potentially commercial, but no current product set clears the bar — 69

These articles have some purchase intent, but monetisation would currently require forced, duplicative, weakly evidenced, poorly fitting, bulky or higher-risk recommendations. They remain unmonetised until specific products pass the same identity, availability, evidence, suitability and drawback review used for Class A.

- `australian-made-gift-ideas-under-100`
- `baby-bath-time-essentials`
- `baby-change-station-setup-what-to-check-before-you-buy`
- `baby-monitors-australia`
- `baby-outing-essentials-what-to-pack-before-leaving-the-house`
- `balcony-and-courtyard-garden-setup-what-to-plan-before-buying-pots-and-planters`
- `barbecue-area-setup-what-to-measure-before-buying-outdoor-cooking-gear`
- `bassinet-vs-cot`
- `bathroom-essentials-australian-homes`
- `bathroom-product-storage-what-to-sort-before-buying-organisers`
- `bathroom-storage-products-worth-considering`
- `bathroom-storage-what-to-measure-and-check-before-you-buy`
- `bedding-and-linen-basics-for-australian-bedrooms`
- `bedroom-drawers-tallboys-and-dressers-what-to-check-before-you-buy`
- `bedroom-essentials-for-a-more-comfortable-home`
- `bedroom-lighting-and-window-coverings-what-to-compare-before-you-buy`
- `bedroom-storage-ideas-small-australian-rooms`
- `bedside-table-setup-what-to-check-before-you-buy`
- `best-kitchen-storage-ideas-small-australian-homes`
- `cat-litter-tray-setup-what-to-plan-before-you-buy`
- `cleaning-product-storage-what-to-check-before-buying-cabinets-or-caddies`
- `electric-blankets-vs-heated-throws`
- `everyday-kitchen-essentials-australian-homes`
- `fan-heater-vs-ceramic-heater`
- `garage-storage-ideas-busy-australian-homes`
- `garage-storage-what-to-measure-and-check-before-you-buy`
- `home-office-chair-and-seating-what-to-check-before-you-buy`
- `home-office-desk-setup-what-to-measure-before-you-buy`
- `home-office-setup-ideas-small-spaces`
- `home-office-video-call-background-and-desk-zone-setup-what-to-plan-before-buying`
- `kids-play-and-toy-storage-what-to-plan-before-buying`
- `kitchen-bench-space-what-to-clear-before-buying-more-storage`
- `kitchen-container-storage-what-to-sort-before-buying-more-containers`
- `laundry-essentials-australian-homes`
- `laundry-organisation-ideas-that-save-space`
- `laundry-storage-what-to-measure-and-check-before-you-buy`
- `living-room-cable-management-what-to-plan-before-buying-organisers`
- `living-room-lighting-ideas-for-australian-homes`
- `living-room-rug-size-and-placement-what-to-check-before-you-buy`
- `living-room-storage-ideas-everyday-australian-homes`
- `mattress-sizes-australia`
- `nappy-change-station-checklist`
- `new-puppy-essentials`
- `newborn-essentials`
- `nursery-essentials-for-australian-homes`
- `nursery-storage-small-rooms`
- `outdoor-dining-area-setup-what-to-measure-before-buying-furniture`
- `outdoor-entertaining-area-setup-what-to-plan-before-buying-extra-furniture-and-accessories`
- `outdoor-lounge-area-setup-what-to-measure-before-buying-seating`
- `outdoor-storage-ideas-australian-patios-balconies-gardens`
- `pantry-storage-ideas-australian-kitchens`
- `pet-cleaning-supplies-what-to-check-before-buying-cleaning-gear`
- `pet-essentials-for-australian-homes`
- `pet-feeding-station-ideas-for-australian-homes`
- `pet-friendly-home-products-for-australian-households`
- `rental-friendly-pet-setup-what-to-check-before-buying-pet-gear`
- `renter-friendly-bathroom-storage-what-to-check-before-you-buy`
- `renter-friendly-garage-storage-what-to-check-before-you-buy`
- `renter-friendly-kitchen-storage-what-to-check-before-you-buy`
- `renter-friendly-laundry-storage-what-to-check-before-you-buy`
- `shared-home-office-spaces-how-to-set-up-without-taking-over-the-room`
- `side-tables-coffee-tables-and-console-tables-what-to-compare-before-you-buy`
- `small-garage-storage-what-to-check-before-buying-shelves-or-racks`
- `small-laundry-storage-what-to-check-before-buying-organisers`
- `sofa-and-seating-layout-what-to-measure-before-buying-furniture`
- `sports-gear-storage-what-to-check-before-buying-hooks-racks-or-bins`
- `towel-storage-what-to-measure-before-buying-rails-hooks-or-shelves`
- `toy-blanket-and-everyday-clutter-control-for-living-rooms`
- `tv-unit-and-media-storage-what-to-measure-before-you-buy`

### C. Better suited to a future major-appliance or retailer-partner model — 15

These decisions involve installed equipment, major appliances, high delivery or returns friction, or professional sizing and installation. Small Amazon accessories would not answer the main buying question. These guides remain independent and unmonetised until an appropriate Australian retailer or lead-generation model can be assessed.

- `air-conditioning-buying-guide`
- `ceiling-fans-before-you-buy`
- `dishwasher-sizes-australia`
- `evaporative-cooler-vs-refrigerated-air-conditioning`
- `fridge-dimensions-australia`
- `heat-pump-vs-condenser-vs-vented-dryers`
- `heating-a-bedroom-overnight-comfort`
- `heating-an-open-plan-living-area`
- `home-heating-options-australia`
- `oil-column-heater-vs-panel-heater`
- `portable-vs-window-wall-vs-split-system-air-conditioner`
- `reverse-cycle-heating-explained`
- `split-system-air-conditioner-installation-costs`
- `washing-machine-and-dryer-space-what-to-measure-before-buying-storage`
- `what-size-air-conditioner-do-i-need`

### D. Non-commercial or primarily editorial — 12

These are maintenance, seasonal reset, building-performance or household-practice articles. A product block would interrupt the task and weaken the editorial purpose, so they are deliberately unmonetised.

- `20-minute-spring-reset`
- `air-conditioner-maintenance-before-summer`
- `condensation-and-mould-during-winter`
- `garden-tool-care-and-seasonal-outdoor-reset`
- `gutter-maintenance-guide`
- `home-insulation-basics`
- `lawn-care-basics`
- `lower-waste-laundry-essentials`
- `preparing-your-home-for-winter`
- `reduce-draughts-before-buying-bigger-heater`
- `spring-cleaning-checklist`
- `spring-home-maintenance-checklist`

## Amazon Australia destination corrections

All replacements below were checked on Amazon Australia on 22 August 2026. The links retain the approved `ahc07-22` tracking tag. The two D-Line records were not unavailable; their large and small ASINs had been assigned to the opposite editorial records and were swapped back to the correct identities.

| Guide | Previous record / ASIN | Corrected record / ASIN | Reason |
| --- | --- | --- | --- |
| Cordless stick vacuums | Dyson V8 Cordless Vacuum Cleaner / `B0B4N9ZR2Q` | Dyson V8 Origin Cordless Vacuum Cleaner / `B0DDRX3475` | Previous listing had no featured offer |
| Robot vacuum buying guide | Dreame L20 Ultra / `B0CF5XP9GN` | Dreame L10s Ultra Gen 2 / `B0DCFTXDVL` | Previous model was unavailable |
| Pet gates and barriers | BabyDan Flex M / `B00GK6SENI` | BabyDan Flex M / `B00HV9C0CY` | Previous URL resolved to the XL variant and was out of stock |
| Pet travel essentials | eDog car hammock / `B0CZ6MG1X3` | eDog car hammock / `B0CZ6T5QJ3` | Previous listing had no featured offer |
| Pet food storage | Gamma2 Gamma Seal Lid / `B007RGBATK` | Gamma2 Gamma Seal Lid, Orange / `B00AYVRHCO` | Previous colour listing was unavailable |
| Small bathroom storage | Luxsuite over-toilet shelf / `B0BWH38GH2` | SONGMICS bamboo over-toilet organiser / `B07TBDS9BC` | Previous listing had no featured offer; replacement has clearer brand support |
| Laundry drying space | LT Williams A-frame airer / `B0CYL5S5S7` | L.T. Williams large black collapsible airer / `B0FJ7ZMN4H` | Previous listing was temporarily unavailable |
| Laundry drying space | Brabantia HangOn 20m / `B098SV3PLY` | Brabantia HangOn 20m, Matt Black / `B0987Z4WWC` | Previous colour listing had no featured offer |
| Garage storage tubs | 30L clear storage tub / `B0H25MVQZ8` | Sterilite 51L Gasket Box / `B00LHZFKC0` | Previous generic listing was unavailable; replacement has manufacturer evidence |
| Garage storage tubs | Really Useful Box 19L / `B003VVW3N2` | Really Useful Box 19L / `B000YXLJ7G` | Previous URL resolved to a 0.7L box |
| Home-office storage | Really Useful Box 19L / `B003VVW3N2` | Really Useful Box 19L / `B000YXLJ7G` | Same misleading destination reused in a second guide |
| Garage tool storage | Stanley FatMax organiser / `B00EARIB5K` | STANLEY FATMAX PRO-STACK 10-cup organiser / `B083ZPBYN1` | Previous listing was temporarily unavailable |
| Outdoor shade setup | Wallaroo 3 x 5m shade sail / `B079ZRS47S` | Wallaroo 280 GSM 3 x 5m shade sail / `B0CVL3KX3Q` | Previous listing was temporarily unavailable |
| Home-office cable management | D-Line Large / `B0076XNIAI` | D-Line Large / `B0076XD7HC` | Previous URL resolved to the small size |
| Home-office cable management | D-Line Small / `B0076XD7HC` | D-Line Small / `B0076XNIAI` | Previous URL resolved to the large size |

No price claims, ratings, invented testing or unverified superlatives were introduced. Where the replacement is a materially different model, the summary, suitability, drawbacks and supporting evidence were rewritten rather than inheriting the old claims.

## Disclosure, policy and trust review

Verified site-wide and in the commercial component:

- The footer exposes About, Editorial Standards, How We Select Products, Corrections, Status Labels, Affiliate Disclosure, Privacy and Contact from ordinary site navigation.
- The Affiliate Disclosure states that Australian Home Collective may earn a commission, that this does not increase the reader's price, and that editorial conclusions remain independent.
- The Privacy Policy covers affiliate and tracking-link data.
- Editorial Standards and How We Select Products explain the separation between commercial relationships and editorial decisions.
- The About page now states, in restrained language, that affiliate revenue helps support publication while product inclusion remains independent.
- Every commercial product block places a plain-language affiliate disclosure before its outgoing retailer link.
- Affiliate links carry `rel="sponsored nofollow noopener noreferrer"` and the approved tracking metadata.
- The implementation does not emit unsupported Product, Review or AggregateRating structured data. Article, breadcrumb and supported FAQ data remain unchanged.
- No verified ABN or other legal business identifier is present in the repository, so none was invented or added.

## Guardrails added

- The commercial-data audit now rejects duplicate affiliate destinations within the same guide. Cross-guide reuse remains allowed when the same product genuinely fits two different articles.
- The audit now rejects source-level Product, Review and AggregateRating schema in published guide pages unless a future implementation establishes adequate first-party support.
- Automated tests exercise both failure modes so later edits cannot silently weaken them.

## Files changed

- `src/data/commercial-products.json` — corrected 15 affected product records and refreshed current listing validation and evidence.
- `src/pages/about/index.astro` — added a restrained explanation of named-product selection and affiliate funding.
- `src/pages/how-we-select-products/index.astro` — made the editorial/commercial separation explicit.
- `scripts/audit-commercial-data.mjs` — added duplicate-destination and unsupported-schema checks.
- `scripts/audit-card-layout.mjs` — made the existing responsive-card assertion tolerant of Windows line endings so the release audit tests the CSS rule rather than the checkout format.
- `tests/commercial-audit.test.mjs` — added regression coverage for both new guardrails.
- `docs/commercial-publishing-audit-2026-08-22.md` — this exhaustive audit and decision record.

## Remaining gaps and next priorities

- Amazon inventory and seller status are volatile. Re-run the current automated review cadence and manually re-open retailer listings before material seasonal campaigns.
- Class B contains 69 future opportunities, but none should be enabled until specific products clear the existing evidence and fit requirements.
- Class C needs a different commercial model. Assess reputable Australian appliance retailers, installation partners or lead-generation arrangements before adding monetisation.
- Higher-risk nursery, baby, heating and electrical topics need a deliberately higher evidence and safety threshold than ordinary storage products.
- Do not add an ABN or formal legal-entity claim until the publisher supplies and verifies the correct identifier.
- Continue building first-party testing only where testing actually occurs; keep `research-only` labels and avoid first-hand claims elsewhere.
