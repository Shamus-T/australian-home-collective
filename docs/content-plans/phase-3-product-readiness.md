# Phase 3 product readiness

Started 10 July 2026 after completion of the Phase 2 merge and coverage audit.

## Purpose

Phase 3 turns the existing product-category plans into a reusable reader-facing comparison format.
The aim is to help a reader compare product types after sorting and measuring, without turning the
guides into shopping lists.

## Commercial boundary

Phase 3 does not add:

- retailer or affiliate links
- prices or availability claims
- named product recommendations
- `best` claims
- hands-on testing claims
- affiliate disclosure on pages without affiliate links

Those additions require a real commercial setup, suitable partners, disclosure placement and a
documented review process. Until then, product-decision sections remain independent editorial
content.

## Reusable format

`ProductDecisionBlock.astro` presents each product type through four questions:

1. What may it help with?
2. What should be measured first?
3. What should be checked before buying?
4. When should it be avoided?

This follows the editorial blueprint and product-section templates while keeping the public copy
useful without a commercial link.

## Phase 3 rollout

### Kitchen pilot

- pantry organisers
- kitchen drawer organisers

### Laundry

- drying racks and airers
- baskets, hampers and sorters

### Bathroom

- vanity organisers
- product-storage organisers

### Garage

- storage tubs and labelled containers
- sports-gear storage

These subjects are the clearest lower-risk fit for measurement-led comparisons. Appliance,
electrical, chemical, structural, wall-fixing and wet-area installation recommendations remain out
of scope.

## Completion checks

- each section appears after the practical guidance rather than leading the article
- wording stays specific to the article and does not repeat a generic product pitch
- no page gains disclosure unless it contains a real affiliate link
- layouts work on desktop and mobile
- internal links, canonical URLs and sitemap entries remain valid
- every push is verified through GitHub Actions and on the live VentraIP site
