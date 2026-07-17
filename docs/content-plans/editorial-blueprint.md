# Australian Home Collective Editorial Blueprint v2

Purpose: set the reader-first editorial standards for Australian Home Collective guide articles, category planning, product-section planning and future commercial content.

Use this blueprint before drafting, editing or expanding guide articles. It should be read alongside `docs/content-plans/product-section-templates.md` and any relevant category plan.

## 1. Editorial independence

Australian Home Collective must prioritise the reader's interests over affiliate revenue.

Every article should:

- recommend against unnecessary purchases where appropriate
- explain when repairing, reusing, delaying a purchase, or choosing a lower-cost option may be better
- present advantages and disadvantages honestly
- recommend products based on suitability rather than commission potential
- avoid exaggerated claims
- avoid pretending products were personally tested unless they genuinely were

The reader's interests always come first.

## 2. External linking policy

External links are allowed only when they genuinely improve the article.

Approved external sources:

- Australian Government websites
- state or territory government websites
- local council resources where relevant
- product safety authorities
- energy rating, water rating and consumer safety resources
- recognised standards organisations
- universities and research institutions
- professional bodies and industry associations
- registered charities and not-for-profit organisations
- official manufacturer resources, but only for practical information such as installation instructions, care instructions, measurements, warranty details or specifications

Prohibited external links:

- online retailers, unless the link is an intentional affiliate recommendation inside an approved product section
- competitor home websites
- other affiliate websites
- coupon websites
- deal websites
- AI-generated content farms
- content mills
- link farms
- low-quality blogs
- unverified opinion websites
- forums or social media as factual references, unless clearly discussing community experiences
- press releases used as primary sources
- websites with poor reputations or questionable trustworthiness

When in doubt, do not add the external link.

## 3. External link quality test

Every external link must pass the ABC rule:

- Authoritative: the source has recognised expertise, official standing, or clear subject authority
- Beneficial: the link genuinely helps the reader understand, verify, or act on the information
- Credible: the source is factually reliable, transparent, and reputable

Also check:

- Is this the original source where possible?
- Would Australian Home Collective confidently recommend this source with no financial benefit?
- Would an editor of a respected Australian publication be comfortable linking to it?

If any answer is no, omit the link.

## 4. External link limits

As a general rule:

- use 0-3 external links per article
- only include external links where they add genuine editorial value
- internal links should normally outnumber external links
- never add external links just to make an article look researched

## 5. External link behaviour

All approved external links must:

- open in a new tab or window
- use `target="_blank"`
- include `rel="noopener noreferrer"`
- use clear descriptive anchor text
- never use vague anchor text such as "click here"

Example:

```html
<a href="https://www.productsafety.gov.au/" target="_blank" rel="noopener noreferrer">Product Safety Australia</a>
```

Internal links must not open in a new tab. Internal Australian Home Collective links should remain normal same-tab links.

Where possible, use the existing `ExternalLink.astro` component or the established external-link pattern so future external links behave consistently.

## 6. Article workflow checklist

Before drafting or publishing the next article:

- confirm the article is useful before any product links are added
- include practical reasons not to buy where relevant
- check whether repairing, reusing, sorting, measuring, delaying or choosing a lower-cost option should be mentioned
- use internal links first where they genuinely help the reader
- add external links only if they pass the ABC rule
- keep external links limited and purposeful
- make sure any external links open in a new tab with `rel="noopener noreferrer"`
- avoid fake testing, fake reviews, fake urgency, current prices and unsupported best-product claims
- add affiliate disclosure only when actual affiliate links are present
- complete the required publication edit in `humanisation-style-guide.md`
- confirm the page title, description and heading still match the intended search question
- check that the canonical URL and sitemap entry are correct after route or content changes
- preserve useful internal links and add a next-step guide only where it genuinely helps
- keep future product pathways editorial until verified commercial links are ready
- run the built-site and commercial audits before deployment
