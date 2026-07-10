# Phase 4 commercial readiness

Started 10 July 2026 after Phase 3 product readiness.

## Current boundary

Phase 4A prepares the site for a small affiliate pilot without publishing commercial content.
Commission Factory approval and verified advertiser links are still required before Phase 4B can
activate any retailer recommendation.

Until that approval is confirmed:

- the commercial catalogue remains empty
- no retailer, product or tracking links are published
- no product names, prices, availability statements or affiliate claims are published
- the three pilot guides render exactly as editorial guides
- the commercial block renders nothing and no page-level disclosure is added

## Initial pilot guides

- pantry organisers
- kitchen drawer organisers
- laundry baskets, hampers and sorters

These are lower-risk, measurement-led categories already covered by Phase 3. Appliances,
electrical products, chemicals, child or pet safety products, wall-mounted products and
installation-sensitive products remain outside the pilot.

## Product catalogue

Commercial records live in `src/data/commercial-products.json`. Each record uses the typed shape in
`src/types/commercial-product.ts` and must include:

- a stable ID, status and one enabled guide path
- a product name, product type, reader-facing summary and merchant
- an HTTPS destination URL and clear link label
- affiliate status, network and advertiser ID where applicable
- the dates on which product details were verified and must next be reviewed
- evidence for every factual product claim, including its source URL and check date

The allowed statuses are:

- `draft`: being researched and never rendered
- `approved`: fully verified and eligible to render
- `paused`: retained for review but never rendered

Only an `approved` record with a destination URL can reach a public guide.

## Disclosure and link behaviour

`CommercialProductBlock.astro` reads only approved records for the guide in which it is placed.
If at least one rendered record is an affiliate link, the existing disclosure block appears before
the product cards. Affiliate links open in a new tab and use
`rel="sponsored noopener noreferrer"`. Non-affiliate retailer links do not trigger the disclosure.

The block is wired into the three pilot guides but the empty catalogue means it currently produces
no public HTML.

## Publishing checklist for Phase 4B

1. Confirm Commission Factory approval and the approved advertiser relationship.
2. Obtain the exact tracking URL from the authenticated Commission Factory account.
3. Verify the retailer page, product name, useful specifications and availability.
4. Record every claim and its primary retailer or manufacturer source.
5. Set `verifiedOn` and a short, realistic `reviewDueOn` date.
6. Add the record as `draft` and run `npm run audit:commercial`.
7. Review the reader-facing wording and change the status to `approved` only after sign-off.
8. Build and run `npm run audit:commercial:dist` before publishing.
9. Verify GitHub Actions and the live VentraIP page after the push.

Prices should not be added during the pilot. Availability and product details can change and must
not be presented as current after the review-due date.

## Automated safeguards

The commercial-data audit checks:

- catalogue version, dates and record structure
- unique IDs and enabled guide routes
- HTTPS destinations and evidence sources
- affiliate network and advertiser attribution
- verification and review dates for approved records
- overdue approved recommendations
- the number of commercial and affiliate links in the built pages
- disclosure presence only when an approved affiliate link is rendered
- `target` and `rel` safety on built affiliate links

GitHub Actions runs the catalogue audit before the Astro build and the rendered-output audit after
the build. A failure stops deployment before the VentraIP upload step.
