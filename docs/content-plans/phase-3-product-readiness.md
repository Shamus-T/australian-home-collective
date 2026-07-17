# Phase 3 product readiness

Completed 10 July 2026 after the Phase 2 merge and coverage audit.

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
- every push is verified through GitHub Actions and on the live Cloudflare Pages site

## Implementation result

- The reusable component is live across eight guides in Kitchen, Laundry, Bathroom and Garage.
- Each guide contains four article-specific product decisions, for 32 decision cards in total.
- Product-decision blocks contain no retailer links, affiliate links, prices or named products.
- None of the eight guides shows affiliate disclosure because none contains an affiliate link.
- The two-column desktop layout collapses to one column below the existing 820-pixel breakpoint.
- The global stylesheet reference is versioned so the new card layout is not masked by a cached
  pre-Phase 3 stylesheet after deployment.
- Electrical, heated, chemical, structural, wall-mounted and wet-area installation recommendations
  remain outside the Phase 3 comparison scope.

## Final audit

- The Astro build produces 131 pages.
- The generated-output audit checked 4,183 internal links with no broken targets.
- All 20 generated external anchors use `target="_blank"` and `rel="noopener noreferrer"`.
- The sitemap contains 112 unique canonical URLs with no duplicates, missing pages, canonical
  mismatches or `noindex` entries.
- All eight Phase 3 pages have the expected self-canonical URL, four cards and no disclosure block.
- The product-decision blocks contain no outbound links.
