# Product pricing review — 11 October 2026

Reviewed all 123 catalogue records and all guide source files for existing RRP and numeric product selling prices. No existing card had a numeric price or RRP. Budget guidance and illustrative electricity costs are not selling prices and remain.

## Changes

- Updated shared retailer card wording and comparison heading for every enabled guide.
- Added optional structured manufacturer-direct prices with monthly expiry validation and dated rendering.
- Breville Fast Slow GO BPR680BSS: Australian official page https://www.breville.com/en-au/product/bpr680 lists $339.00 with Add to cart and brushed stainless steel specifications. Added AUD 339, checked 11 October; review due 1 November. Delivery must be checked separately. This is the manufacturer's own advertised selling price, not RRP.
- LG GB-B400MW, GB-B400PS and GB-B400BS: official Australian model pages retrieved but exposed no verifiable selling price. GB-B400MB retrieval failed. Retained no-price cards for all four finishes.
- Breville BES881: official Australian page retrieved but exposed no dollar selling price. Dyson V8 official page retrieved; no eligible price added because exact current offer/variant was not established.
- Fisher & Paykel RF600AMPVG1 preview: removed the $3,799 Joyce Mayne pre-order quote and repeated reference, because existing editorial evidence expressly states it was not independently confirmed and it is not a manufacturer-direct price. Retained attributed pre-order information and store confirmation instructions; removed speculative floor-stock price wording.
- All other catalogue cards retain no-price retailer links. This was a complete audit of existing published pricing, not a claim that fresh manufacturer selling prices were verified for all 123 products.

## Monthly review scope

Repository: Shamus-T/australian-home-collective, main. Review `manufacturerPrice` in `src/data/commercial-products.json`, this policy, and product-specific article selling prices. Verify exact Australian manufacturer offers; correct or remove unverifiable prices, run the full build/audits, publish through the existing main deployment workflow, and independently check live output. Do not relabel retailer prices or RRP as direct selling prices.
