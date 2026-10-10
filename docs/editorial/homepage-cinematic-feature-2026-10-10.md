# Homepage feature and imagery refresh — 10 October 2026

Requested: cinematic, realistic background for the Precision Fit card, more prominent homepage placement, sparse greenery, and correction of the plant-filled homepage hero.

The fridge preview is now a full-width editorial feature immediately after the homepage hero and before the measurement guides. The previous small duplicate in the lower featured grid was replaced with the existing kitchen-storage guide, preserving six lower featured cards.

`ProductPreviewFeature.astro` places the unchanged manufacturer RF600AMPVG1 transparent WebP over a separately generated kitchen background. The product itself was not generated, retouched or cropped. The setting is labelled illustrative; it is not evidence of installation dimensions or a photograph from the preview event. The article and its source/clearance warnings remain unchanged.

Assets:

- `public/images/guides/precision-fit-kitchen-background.webp`: 1280 × 853, 98,404 bytes. Built-in image_gen created a photographic walnut and charcoal-stone kitchen with raking afternoon light, no plants and an empty centre bay. A second edit narrowed the empty bay to improve the final composition. Sharp resized and encoded the background; the appliance remains a separate original image in the browser.
- `public/images/home-lifestyle-hero-refined.webp`: 1600 × 979, 155,084 bytes. Built-in image_gen edited the existing homepage room to remove all excessive greenery and the branches in the hanging shopping bag. One modest plant remains by the window. Existing architecture and furniture were retained. The homepage uses Astro's responsive AVIF/WebP pipeline.
- `public/images/home-lifestyle-hero.jpg`: original source retained, no longer used by the homepage.

Visual checks: desktop at 1440 pixels and mobile at 390 pixels; complete fridge visible, no horizontal overflow, readable text and CTA, coherent background placement, feature directly follows the hero. Production build and complete existing audit chain passed; final background refinement was then rebuilt and checked with the output/image audits.

No article publication dates or factual claims were changed.

## Composition correction

The user identified mismatched lighting and appliance alignment in the first composition. Replaced the live background with `public/images/guides/precision-fit-kitchen-aligned.webp` (1280 × 853, 106,954 bytes), generated with the built-in image tool. Softer frontal light now matches the original product photograph; an overhead cabinet frames the opening. The manufacturer appliance remains unchanged and separate. Removed the artificial directional drop shadow. Position and scale account for the transparent margins in the source: image height 80.3%, top 3.7%, horizontal centre 50.13%. Checked the complete appliance, cabinet reveals and floor contact in the browser at desktop, 820px tablet and 390px mobile; no horizontal overflow. The illustrative-setting label remains.
