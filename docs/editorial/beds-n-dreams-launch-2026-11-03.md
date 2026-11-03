# Beds n Dreams launch — 3 November 2026

Shane confirmed partnership acceptance and authorised monetising relevant pages. The signed-in Partnerize campaign was checked directly: Beds n Dreams, campaign 1101l6580, active default 2% CPA, 30-day cookie. Assembly exclusions and reversals apply. This is not a promise of commission on every order.

## Campaign and link integrity

The Tracking page generated `https://bnd.prf.hn/click/camref:1110lSAJY` and an encoded product deep-link. Exact product variants are encoded within that destination. No tracking link was requested, clicked or resolved. Clean research URLs were generated offline and requested anonymously with redirects disabled. The campaign registry prevents mixing this merchant with The Good Guys. The click collector accepts the exact new tracking host and retains merchant, guide and product fields; it does not establish merchant sales attribution.

## Selected products

| Product | Exact variant | Fit and specification evidence | Availability observed |
| --- | --- | --- | --- |
| Englander Orlando Queen Firm | 41363083821149 | 1530 × 2030 × 280mm, 36.7kg, five-zone pocket springs, ten-year listed manufacturer warranty | GET IT NOW, Queensland |
| Capri Natural bedside | 43488987086941 | W540 × D440 × H500mm, 25kg, two drawers, paper-veneered composite timber, two-year manufacturer defect warranty | GET IT NOW, Queensland |
| Brooklyn bedside | 43488986890333 | W580 × D400 × H610mm, two drawers, solid Mountain Ash combined with veneer and composite timber, two-year manufacturer defect warranty | GET IT NOW, Queensland |

Fresh exact-variant checks at 13:49 UTC on 3 November matched selected variant, structured offer and visible regional delivery text. No postcode quote or nationwide stock assurance. The manufacturer/retailer product pages, warranty wording, consumer terms and individual retailer-hosted owner reviews were inspected. The catalogue contains dated sources and the limitations.

Orlando's materials paragraph incorrectly names Seattle. Claims from that paragraph were excluded rather than silently treating the models as identical. The independent [Bedbuyer Orlando review](https://bedbuyer.com.au/review/englander-orlando/) corroborates retained dimensions, spring construction and warranty; it is an affiliate publisher's hands-on review, not AHC testing. The retailer's 86 reviews span variants; the latest 20 were inspected, including comfort comments, service-only entries, a delivery complaint and a sliding-base report. No Queen Firm-specific rating, medical benefit, cooling result or long-term durability claim was made.

Capri's three and Brooklyn's four individual reviews are small retailer-hosted samples. A Brooklyn comment about a bed light was excluded as table evidence. Drawer internal dimensions/load ratings and included anchor kits were not established. Product copy asks readers to confirm setup and anchoring instructions; it does not claim a stability test.

Official ACCC recall RSS results for Beds n Dreams and Englander and exact model searches showed no matching recall in the inspected results. The feeds did contain unrelated results. This is a dated limited search, not safety certification.

The retailer generally does not accept change-of-mind returns; cancellation fees may apply. No opened-mattress sleep trial was verified. Ask for exact base/care requirements and claim conditions before paying. Warranty lengths describe the listed manufacturer cover, not comfort or lifespan guarantees, and do not replace consumer rights.

## Placement decisions

- Mattress sizes: add a 28cm-profile Queen Firm alongside the existing 34cm Giselle option, with a clear distinction between dimensions, feel and returns.
- Bedside setup: compare 50cm Capri and 61cm Brooklyn by reach, width, depth and construction.
- Small-bedroom storage: offer Capri for a defined bedside need, not as a replacement for wardrobe or linen storage.
- Bedroom essentials: optional Orlando/Capri choices; no claim that they form a tested matching set. Bedding, lighting and window-covering gaps remain explicit in the coverage register.

Isabelle storage bed was not added: the Queensland purchase section said out of stock despite InStock schema offers. Ensemble drawer-base dimensions were insufficient. Tallboy, linen and other products were not forced into these pages merely because the merchant is approved.

## Artwork and monitoring

Campaign terms section 2.3 permit only creative assets supplied through Partnerize and forbid unapproved modification. The supplied brand creative 1110l30638 is stored unchanged at `public/images/retailers/beds-n-dreams-partnerize.png`, SHA256 `ef9a7720a8af0ec9ed37f5cad4d3ea44d1f1e681d50c34e1b12e7634cb635257`. Its full proportions are retained inside the existing 212 × 56px buying-link footprint, beside a price-check label. Existing Amazon and Good Guys artwork is unchanged.

No permitted exact-product photograph was positively identified among the supplied creatives. The campaign feed was marked Not Processed and its supplied endpoint returned 404. New image gaps are recorded; public product images were not copied. No tracking pixel or creative remote request is added to AHC.

The four-hour cloud monitor reads exact clean product pages for identity and destination checks only, never affiliate redirects. The existing daily local follow-up now also checks Beds n Dreams stock. It requires matching variant and recognised Australian regional delivery evidence; stale InStock schema cannot override an out-of-stock message. Access challenges, redirects, missing variant data and dispatch estimates requiring review remain alerts, not healthy-stock claims. One owned GitHub issue is maintained per changed cloud fault state. Regions are recorded in reports, and no automatic product removal is inferred from blocked requests.

### Launch verification and foreign-region correction

Commit be67b395513387d1e3523164b961956c4f11bba9 passed GitHub build and audit run 41649676908. All four live pages passed desktop/mobile checks, exact approved destination checks and the unchanged supplied artwork checksum, with merchant and analytics requests blocked. The first cloud monitor run 41649677027 completed, but inspection of its report (artifact SHA256 049da35fffb3c76b9389bcb5ae7fe0044c834876747db8a4b3704cd7b832abbd) showed region OR. Its three available counts must **not** be used as Australian stock evidence. The original artifact is retained unchanged in `tmp/beds-n-dreams-2026-11-03/cloud-monitor/`.

On 4 November Brisbane time, the parser was corrected to reject non-Australian delivery contexts and the cloud workflow was explicitly limited to identity checks. Regression tests cover foreign-region stock and both reporting modes. The existing 09:00 local follow-up was extended for a fresh Beds n Dreams sweep each day; its prior Amazon/Good Guys scope and quiet notification rules are preserved. No geolocation spoofing, retailer cookies or scripted cart interactions were introduced.

## Evidence and verification

Local evidence: `tmp/beds-n-dreams-2026-11-03/`: observed campaign terms and tracking UI, exact HTML and offers, reviews, recall results, unchanged artwork and test/build/live reports. Private feed URL is not published in repository documentation. No purchase, merchant click, live collector test or third-party message was made.
