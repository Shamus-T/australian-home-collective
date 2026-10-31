# Monthly product pricing review — 1 November 2026

Scope: main at 8915ad1, reconciled with concurrent maintenance commit b2137f8; 220 catalogue records, every manufacturerPrice record (one), guide source and imported dryer comparison data scanned for numeric product prices and RRP references.

## Manufacturer-direct selling price

Breville the Fast Slow GO BPR680BSS, brushed stainless steel: unchanged at AUD 339.00. Official Australian page https://www.breville.com/en-au/product/bpr680 retrieved freshly through web retrieval on 1 November 2026 shows $339.00, Add to cart at $339.00, and Brushed Stainless Steel construction. A concurrent maintenance commit removed the expired price while this review ran. Restored the freshly verified amount, updated checkedOn to 2026-11-01 and reviewDueOn to 2026-12-01 (30 days). Delivery remains separately qualified. Product article: /guides/small-kitchen-appliances-what-to-check-before-you-buy/ . Other product research/availability dates were not advanced.

Access limits: the SKU-query version of Breville's URL failed in web retrieval, and a direct local HTTP request received 403. The canonical official Australian page retrieved successfully and identified the product and finish. No retailer price or RRP was used as a substitute.

## Article correction

/guides/heat-pump-vs-condenser-vs-vented-dryers/ had subsequently introduced AUD 799 and 1,499 RRPs for Electrolux EDV705H3WC and EDH803P5WC from retailer-hosted fact sheets, plus a $700 premium and RRP payback estimates. These violate the existing pricing rule. Removed the RRP table row, price basis, premium and payback examples, and retailer-hosted RRP citations. Removed the underlying RRP fields and their source exceptions. Preserved the label energy figures, rated-capacity caveat, electricity-cost scenarios, current retailer links and formula using the reader's actual delivered/installed quotes. Updated article date and its reviewed-source hash.

No other product-specific selling prices were found in guide source. Budget limits and illustrative electricity costs are not product selling prices and remain. No additional manufacturer prices added; no claim that fresh manufacturer pricing was researched for all 220 products.

## Validation

Full production build and audit chain passed after regenerating initially empty local Pagefind index files. Rendered attribution, retailer wording and removal of dryer RRP amounts passed. Independently check live Breville attribution date, current retailer wording and the dryer page's removal of RRP references after deployment. No deployment settings changed.
