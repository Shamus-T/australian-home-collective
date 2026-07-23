# Phase 1 Publishing and Trust Audit

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Source audit complete; production verification is the release gate |
| Document type | Completed audit record |
| Owner | Australian Home Collective |
| Audit date | 24 July 2026 |
| Source baseline | `10ee575fcf888d9d373bf952125f316f0dda4129` |

## Executive summary

Phase 1 is complete in the repository. The audit covered the full documentation set, public
trust pages, metadata, structured data, internal links and commercial boundaries. It did not
add articles, product recommendations, retailer links, affiliate links, prices, review scores
or images.

The publication now has one concise operating document set, consistent public trust wording,
machine-readable dates that agree with visible date labels and FAQ schema generated from the
FAQs readers can see. The complete 140-page output passes the repository's build and commercial
audits.

## Documentation reviewed

The starting set contained 40 files:

- 30 Markdown documents;
- three structured visual-audit files; and
- seven visual contact sheets.

All were reviewed for current purpose, duplication, contradictions and retired workflow
references. The active set contains the governance, editorial, knowledge, tool, legal and
roadmap documents listed in [`docs/README.md`](../README.md), plus supporting visual evidence.

Fifteen obsolete documents were removed:

- ten completed or superseded files under `docs/content-plans/`;
- `docs/kitchen-product-category-plan.md`;
- the duplicated `docs/editorial/editorial-policy.md`;
- the parked fridge-planner delivery plan;
- the parked fridge-planner functional specification; and
- the parked fridge-planner test plan.

`docs/tools/tool-development-standard.md` was consolidated into the current
`docs/tools/planning-tool-standard.md`. No live article or public guide was deleted.

## Public trust review

The audit reviewed:

- About;
- Editorial Standards;
- How We Select Products and Guide Topics;
- Corrections and Content Review Policy;
- Affiliate Disclosure;
- Privacy Policy;
- Contact;
- Australian Status Labels;
- Our Approach; and
- the related homepage, header and footer navigation.

Changes made:

- About now states the registered-business and independent-publication identity, mission and
  approved motto.
- The public Editorial Standards page no longer exposes an unnecessary internal publication-edit
  section.
- Corrections uses the actual `Published` and `Updated` date standard.
- Affiliate Disclosure accurately states that the publication has no affiliate links at
  present and explains the approval boundary for future links.
- Privacy identifies Formspree, Cloudflare Turnstile and Google Analytics.
- Contact links readers to the Privacy Policy beside the form.
- Our Approach, which duplicated About, is now a noindex moved page with `/about/` as its
  canonical destination. It was removed from public navigation and the sitemap.
- The footer identifies the site as independent planning guidance.

## Metadata audit

All 119 indexable pages have:

- a unique title no longer than 60 characters;
- a unique description between 70 and 160 characters;
- a self-referencing canonical without a query string or fragment;
- matching Open Graph title, description and URL fields; and
- an existing local Open Graph image with the correct media type and alt text.

Three indexable descriptions changed:

| Page | Reason |
| --- | --- |
| About | Reflect the registered-business, independent-publication identity and mission. |
| Affiliate Disclosure | Accurately describe the future approval and disclosure process without implying that affiliate links already exist. |
| Privacy Policy | Cover contact-form processing, spam protection, analytics and website operation. |

The noindex Our Approach moved page received a short redirect description. Existing guide
descriptions were retained because they were already unique, relevant and within the approved
length range.

## Structured-data audit

The final output contains:

- 99 `Article` nodes;
- eight articles with verified `datePublished` values;
- 91 articles with verified `dateModified` values;
- 108 `FAQPage` nodes generated only where visible FAQs exist; and
- one JSON-LD graph on each indexable page, with unique node identifiers.

The eight guides visibly labelled `Published July 2026` now use `datePublished="2026-07-23"`
instead of an incorrect modified date. Australian Status Labels now carries its confirmed
10 July 2026 modified date. Existing update dates were retained where the repository does not
record a confirmed original publication day.

No `Product`, `Review`, `AggregateRating` or `Offer` schema is present. There are no unsupported
reviewer claims or duplicate JSON-LD blocks.

## Internal-link audit

- No indexable page is orphaned.
- No indexable page links to a moved legacy route.
- All internal targets exist.
- The Australian-made gift guide was the only page with just one inbound source. A relevant
  contextual link was added from Australian Status Labels.
- Existing useful guide and category links were preserved.

## Commercial and Commission Factory readiness

The commercial audit confirms:

- three pilot guide paths;
- zero commercial product records;
- zero approved commercial records;
- zero affiliate links;
- no unapproved retailer links, model batches, price or review-count claims; and
- no prohibited commercial schema.

The publication is ready to apply to Commission Factory after this Phase 1 release is verified
on the production domain. The current strengths, remaining administrative steps, proposed
application description and checklist are recorded in
[`commission-factory-readiness.md`](commission-factory-readiness.md).

## Validation result

The following checks passed on 24 July 2026:

- source commercial-boundary audit across 127 Astro pages and 62 external links;
- production build of 140 pages;
- output audit covering metadata, canonicals, Open Graph fields and images, links, sitemap,
  visible link spacing, dates, FAQ schema, prohibited schema and inbound discovery; and
- built commercial-boundary audit across 140 HTML pages and 62 external links.

The result is 119 indexable pages and 21 deliberate noindex pages.

## Deliberately deferred

- Original `datePublished` days were not invented for 91 articles whose confirmed original
  publication day is not recorded in the repository.
- No public planning tool was revived. Tool work remains subject to a separate evidence-based
  decision.
- Product, retailer and affiliate links remain blocked until advertiser and placement approval.
- Further imagery work remains a separate approved phase. No image was regenerated in this
  audit.
- Commission Factory account, billing, card pre-authorisation and application submission remain
  administrative actions for Shane.

## Remaining priorities

### High

- Deploy the Phase 1 commit and verify the changed trust pages, moved route, metadata and schema
  on the production domain.
- Submit the Commission Factory application with accurate business and traffic-source details
  after production verification.

### Medium

- Continue the separately controlled imagery program using the approved visual standards.
- Introduce commercial records only after network, advertiser and editorial approval.

### Low

- Add historic publication dates only where reliable source evidence becomes available.
- Reassess a planning tool only when a specific reader need and evidence base justify it.

## Exact next recommended task

Deploy this audited source to production, verify the release on the public domain, then complete
the Commission Factory application checklist without adding speculative product or affiliate
content.
