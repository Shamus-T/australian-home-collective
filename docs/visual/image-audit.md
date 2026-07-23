# Australian Home Collective image audit

Audit date: 23 July 2026
Baseline audit head: `e774e08022888da8674282df457dd5ddbd644b93`
Phase 1 implementation started from: `74257c91eaee5a82f937cd21470e098201691804`

## Scope and outcome

The baseline audit covers every file under `public/images/`, all nested image folders, built page references, source references, guide heroes, homepage and category cards, category fallbacks, and Open Graph images.

The first public repair phase is now implemented:

- `pet.webp`, `guides/mattress-sizes-australia.webp` and `guides/coffee-machine-types-australia.webp` remain in the repository but have no public source or built references.
- `guides/pet-essentials-home-zones.webp` is the temporary Pets fallback with one truthful general alt description.
- `guides/bedroom-storage-clear-walkway.webp` is the temporary Mattress Sizes hero and card image, with a right-shifted mobile-safe focal position.
- Coffee Machine Types now uses the existing text-only article header and text-only featured card.
- `social/pets.jpg` was regenerated deterministically from the approved AI-generated source supplied to the project at 1200 × 630.
- Fridge and dishwasher focal positions were repaired without changing their source pixels.
- Robot vacuum, cordless stick vacuum and dryer were checked at full resolution. No urgent safety or credibility defect requiring immediate removal was found; their true replacements remain pending.

No new AI image was generated during the repository repair. The Pets social image was produced as a deterministic 1200 × 630 derivative of an approved AI-generated source image supplied to the project. No stock or branded photography was introduced. No file was deleted and no site redesign was made.

The broader finding remains: ten category fallback files still act as hero images for 90 guides. The temporary pet fallback is safer and more truthful than the defective source, but category imagery is still carrying too much of the publication.

## Audit files

- `docs/visual/image-inventory.csv` — one row per image, including dimensions, use locations, alt text, reuse, Open Graph use, palette flags, status and six scores.
- `docs/visual/image-assessments.json` — the review decisions and replacement specifications used to build the scored inventory.
- `docs/visual/image-analysis.json` — machine-readable hashes, route references, colour diagnostics and assessment data.
- `docs/visual/phase-1-replacement-assets.md` — final production specifications for the six true replacement assets.
- `scripts/build-image-audit.py` — repeatable inventory, perceptual-hash, palette and contact-sheet generator.

Contact sheets:

- `docs/visual/contact-sheets/contact-sheet-01.jpg` — 18 root and publication images.
- `docs/visual/contact-sheets/contact-sheet-02.jpg` — 10 category social images.
- `docs/visual/contact-sheets/contact-sheet-03.jpg` — 24 guide images.
- `docs/visual/contact-sheets/contact-sheet-homepage-categories.jpg`
- `docs/visual/contact-sheets/contact-sheet-featured-guides.jpg`
- `docs/visual/contact-sheets/contact-sheet-restored-guides.jpg`
- `docs/visual/contact-sheets/contact-sheet-generic-fallbacks.jpg`

No numbered sheet contains more than 24 images. Thumbnails preserve their source aspect ratio and are not cropped.

## Summary

| Measure | Result |
| --- | ---: |
| Total image files | 52 |
| Binary-unique image files | 52 |
| Exact binary duplicate groups | 0 |
| Perceptual near-duplicate pairs | 3 |
| Images used on more than one public route | 28 |
| Generic category hero files | 10 |
| Guides using a generic category hero | 90 |
| Open Graph files | 11 |
| Files that appear unused | 7 |

### Status totals

| Status | Count |
| --- | ---: |
| KEEP | 22 |
| RECROP | 2 |
| MINOR EDIT | 2 |
| REPLACE | 23 |
| URGENT REPLACEMENT | 3 |

Quality status records what is in the repository. It does not imply that an urgent file remains public.

### Phase 1 public-use status

| Phase 1 status | Count |
| --- | ---: |
| FINAL KEEP | 19 |
| TEMPORARY SAFE FALLBACK | 3 |
| TEMPORARILY REMOVED FROM PUBLIC USE | 5 |
| RECROP COMPLETED | 2 |
| REPLACEMENT ASSET PENDING | 21 |
| MINOR EDIT PENDING | 2 |

### Palette diagnostic

Flags overlap and are diagnostic only.

| Flag | Images |
| --- | ---: |
| Beige or cream | 41 |
| Brown | 38 |
| Warm or orange colour grade | 27 |
| Grey | 26 |
| Cobalt blue | 3 |
| Dull green | 2 |
| Coral or terracotta | 2 |

The dominant issue is not one prohibited colour. It is the repeated combination of beige or grey rooms, pale timber, warm brown grading and a small number of artificially saturated cobalt-and-coral scenes.

## Dominant visual problems

1. **Category fallbacks are doing the work of guide imagery.** Ten files serve 90 guide heroes. A generic room cannot truthfully illustrate specific advice about appliance clearances, renter constraints, cable routes, furniture anchoring or storage geometry.
2. **The palette is repetitive.** Beige or cream appears in 41 files, brown in 38 and warm grading in 27. Much of the site therefore reads as one decor collection rather than a varied editorial publication.
3. **Five repository files with credibility or endorsement concerns are no longer public.** The pet fallback contains invented package labels, the mattress has a physically implausible measuring device, the coffee image presents fictional appliances like assessed products, and the robot and cordless vacuum images resemble current product designs. Each now has zero public references.
4. **Some restored-guide images still decorate rather than explain.** The dryer image shows the product category but omits the installation differences central to the guide. Robot and cordless vacuum now use neutral room fallbacks pending purpose-built replacements.
5. **Most social cards repeat the same weak sources.** Nine category Open Graph cards still embed a logo and headline beside generic fallback photography. The Pets social image is now a clean 1200 × 630 crop of the approved temporary source.
6. **Alt text has been adapted to the article while the image has not.** The same fallback receives many different descriptions, including details that are not visible.
7. **Wide hero crops require deliberate focal positions.** Fridge and dishwasher are now repaired; other 3:2 sources still need safe-area checks when reused.

## Strongest and weakest areas

### Strongest

- **Garage storage:** the dedicated double-garage photograph and working-clearance diagram explain access and measurement well.
- **Outdoor storage:** the brick-courtyard image is plausible, recognisably Australian in scale and directly related to weather and access.
- **Planning diagrams:** garage, home-office and pantry SVGs are the most consistently useful visual assets.
- **Before-and-after sets:** bedroom, living-room and pet-essentials pairs demonstrate the planning change without relying on decorative styling.
- **Bathroom vanity detail:** the shallow U-shaped drawer image clearly shows the plumbing constraint and usable drawer geometry.
- **Queenslander laundry:** a distinct, practical image with top-loader lid clearance and a working path visible.

### Weakest

- **Pets:** the defective high-reach fallback is removed from public use. The category now has a safe temporary source, but it still needs the purpose-built Phase 1 asset.
- **Kitchen and laundry:** each generic room is used by ten guides plus index and category contexts, despite very different subjects.
- **Nursery and children:** one nursery scene is used for baby care, monitors, outings, cots, toy storage and older-child planning.
- **Bedroom, bathroom, living room and home office:** attractive but generic display-room photography has been asked to support guide-specific claims it cannot show.
- **Restored commercial guides:** the defective coffee and mattress files are no longer public; robot vacuum, cordless vacuum and dryer remain stylistically weak and need more useful concepts.

## Perceptual duplication

There are no byte-for-byte duplicate files. Three pairs meet the perceptual near-duplicate threshold:

| Pair | Hash distance | Decision |
| --- | ---: | --- |
| `header-title.png` and `header-title.webp` | 0 | Intentional alternate formats of the wordmark. Keep while both are referenced. |
| `guides/pet-essentials-before-scattered-supplies.webp` and `guides/pet-essentials-home-zones.webp` | 6 | Intentional before-and-after pair. Keep. |
| `guides/living-room-storage-before-cluttered-zones.webp` and `guides/living-room-storage-everyday-zones.webp` | 8 | Intentional before-and-after pair. Keep. |

Category fallback reuse is more important than near-duplicate files: the same binary file is intentionally referenced by many unrelated guides.

## First public repair phase

Completed:

1. Removed all public references to the three urgent defective files without deleting them.
2. Installed safe temporary local sources for Pets and Mattress Sizes.
3. Converted Coffee Machine Types to a text-only header and featured card.
4. Regenerated the Pets social image from the approved AI-generated source supplied to the project.
5. Completed route-specific fridge and dishwasher focal-position repairs.
6. Reviewed robot vacuum, cordless stick vacuum and dryer for urgent defects.
7. Created `phase-1-replacement-assets.md` for the six true replacement files.

Still required:

1. Produce and approve the six assets in the Phase 1 manifest.
2. Replace the kitchen, laundry, bathroom, bedroom, nursery, living-room, home-office and outdoor category fallbacks with a planned, varied set.
3. Create guide-specific imagery for the highest-value guides still using those fallbacks.
4. Regenerate the remaining category social images after their final photography is approved.

## Baseline top 25 replacement priorities and current disposition

The ranking is retained so the original audit decision remains traceable. Phase 1 changed the public disposition of priorities 1, 2, 3 and 19; it did not pretend that the defective repository files had been repaired.

### 1. Pet category fallback

- **File:** `public/images/pet.webp`
- **Current routes for this file:** None. The file remains in the repository.
- **Temporary public source:** `public/images/guides/pet-essentials-home-zones.webp` on the Pets category, cards and 10 guide heroes.
- **Reason:** Urgent. At baseline, invented package labels, an artificial cat/aquarium/dog showroom and heavy timber styling were visible on 14 public routes.
- **New concept:** A contemporary, realistic Australian home pet-care zone with a clearly visible companion bird, practical closed storage and a clear household walking route.
- **Show:** A companion bird on a safe perch or beside a coherent cage or stand, closed supply storage, grooming items or toys, easy-clean flooring and a clear walkway. Non-living cues such as a dog bed, lead, bowls or general toy storage may represent broader pet ownership.
- **Avoid:** Dog-only or cat-only framing, a cat tree, crowded live animals, bowls blocking circulation, fake packaging or branding, recognisable retail products, all-timber showroom styling and malformed bird, cage or storage geometry.
- **Suggested alt:** `A practical pet-care zone with a companion bird, closed supply storage, grooming items and a clear household walkway.`

### 2. Mattress sizes guide

- **File:** `public/images/guides/mattress-sizes-australia.webp`
- **Current routes for this file:** None. The file remains in the repository.
- **Temporary public source:** `public/images/guides/bedroom-storage-clear-walkway.webp` on the article and featured card.
- **Reason:** Urgent. A measuring strip and black device appear fused into the mattress; the product and saturated room look generated.
- **New concept:** A modest bedroom showing the bed footprint and useful floor clearances.
- **Show:** Bed edges, bedside tables, wardrobe, doorway, clear floor gaps and a normal tape measure on the floor.
- **Avoid:** Tape fused into bedding, invented labels, floating furniture, luxury-suite proportions and forced cobalt-and-terracotta styling.
- **Suggested alt:** `A bedroom showing the bed footprint and walking clearances to the wardrobe, wall and doorway.`

### 3. Coffee machine types guide

- **File:** `public/images/guides/coffee-machine-types-australia.webp`
- **Current routes for this file:** None. The file remains in the repository.
- **Temporary public treatment:** Text-only article header and featured card, with the safe Kitchen social image retained for metadata.
- **Reason:** Urgent. It presents fictional, recognisable machine types as a retail lineup with invented controls.
- **New concept:** Three unbranded preparation workflows in one believable kitchen.
- **Show:** Pod storage, manual portafilter workflow, bean hopper, cups, water access, bench depth and landing space.
- **Avoid:** Logos, fake labels, recognisable branded silhouettes, impossible controls and catalogue-style product lineups.
- **Suggested alt:** `Three unbranded coffee preparation setups showing pod, manual espresso and automatic workflows on a kitchen bench.`

### 4. Robot vacuum guide

- **File:** `public/images/guides/robot-vacuum-buying-guide-australia.webp`
- **Route:** `/guides/robot-vacuum-buying-guide-australia/`
- **Reason:** The current file has no tethering cord, but the empty cobalt-and-orange room looks generated and omits loose obstacles.
- **New concept:** A robot moving through a credible living area with several navigation constraints visible.
- **Show:** Correctly powered dock, rug transition, chair legs, low furniture, one loose cable or pet toy and realistic floor changes.
- **Avoid:** A lead attached to the robot, floating dock, recognisable branded lidar design, impossible reflections and empty showroom styling.
- **Suggested alt:** `An unbranded robot vacuum navigating a rug edge, furniture legs and loose obstacles near its charging dock.`

### 5. Cordless stick vacuum guide

- **File:** `public/images/guides/cordless-stick-vacuums-australia.webp`
- **Route:** `/guides/cordless-stick-vacuums-australia/`
- **Reason:** The pose is plausible, but the product resembles a branded design and the theatrical palette shows use rather than storage and charging.
- **New concept:** An unbranded vacuum being returned to a proper wall dock in a utility cupboard.
- **Show:** Stable dock, correctly routed charging lead to the dock, nearby power point, attachments and door clearance.
- **Avoid:** A lead attached to the vacuum body, floating dock, malformed grip or floor head, branded silhouette and colour-blocked showroom.
- **Suggested alt:** `An unbranded cordless stick vacuum beside a wall-mounted charging dock and organised attachments in a utility cupboard.`

### 6. Kitchen category fallback

- **File:** `public/images/kitchen.webp`
- **Routes:** `/categories/kitchen/` and 10 guide heroes.
- **Reason:** The most reused content fallback is a generic beige and timber display kitchen and does not show the varied appliance, pantry and workflow issues claimed.
- **New concept:** A practical kitchen with a readable work aisle, appliance landing area and pantry or drawer access.
- **Show:** Fridge cavity, sink, cooktop, landing space, open storage and realistic aisle width.
- **Avoid:** Pale timber throughout, oversized island, sterile styling, impossible clearances and decorative props hiding work surfaces.
- **Suggested alt:** `A practical kitchen showing appliance landing space, pantry access, drawers and a clear working aisle.`

### 7. Laundry category fallback

- **File:** `public/images/laundry.webp`
- **Routes:** `/categories/laundry/` and 10 guide heroes.
- **Reason:** One polished grey laundry is used for top-loader, renter, drying, hamper, linen and small-room topics it cannot illustrate.
- **New concept:** A modest laundry with appliance access, work surface, hamper, drying option and circulation.
- **Show:** Appliance cavity, services, door or lid swing, hamper, drying rail or outdoor access and working clearance.
- **Avoid:** Display-home scale, concealed services, unsafe stacking, all-grey cabinetry and props hiding clearances.
- **Suggested alt:** `A compact laundry showing appliance space, bench, hamper, drying area and clear working access.`

### 8. Bathroom category fallback

- **File:** `public/images/bathroom.webp`
- **Routes:** `/categories/bathroom/` and 9 guide heroes.
- **Reason:** A beige luxury bathroom cannot show the specific vanity, shower, towel and under-sink storage issues named across the guides.
- **New concept:** A compact bathroom with several practical storage zones visible.
- **Show:** Vanity drawers, under-sink plumbing, towel hooks, shower caddy and circulation.
- **Avoid:** Spa styling, beige-on-beige finishes, oversized proportions and decorative objects hiding storage.
- **Suggested alt:** `A compact bathroom showing vanity, shower and towel storage zones with clear floor space.`

### 9. Bedroom category fallback

- **File:** `public/images/bedroom.webp`
- **Routes:** `/categories/bedroom/` and 8 guide heroes.
- **Reason:** A generic neutral bedroom is described as though it contains dressers, under-bed storage, wardrobe organisation and lighting details that are not consistently visible.
- **New concept:** A modest bedroom with the bed footprint, bedside zone and wardrobe access readable.
- **Show:** Bed, bedside table, lamp, wardrobe doors, under-bed gap and walking path.
- **Avoid:** Hotel styling, beige-on-beige bedding, oversized proportions and concealed storage.
- **Suggested alt:** `A modest bedroom showing bedside storage, wardrobe access and clear walking space around the bed.`

### 10. Nursery and children category fallback

- **File:** `public/images/Nursery-kids.webp`
- **Routes:** `/categories/nursery-kids/` and 9 guide heroes.
- **Reason:** One beige nursery represents babies, outings, monitors, cots, toys, older children and furniture safety.
- **New concept:** A compact age-specific room with safe furniture placement and reachable storage.
- **Show:** Cot or bed, anchored storage, toy zone, doorway and clear adult circulation.
- **Avoid:** Unanchored tall furniture, unsafe cot objects, beige-only palette, impossible overhead view and luxury styling.
- **Suggested alt:** `A compact child’s room showing reachable storage, safe furniture placement and clear floor access.`

### 11. Living-room category fallback

- **File:** `public/images/living-room.webp`
- **Routes:** `/categories/living-spaces/` and 9 guide heroes.
- **Reason:** A beige display room does not explain TV position, cables, toy storage, rug sizing or seating paths.
- **New concept:** An ordinary living room with a readable media wall, storage and circulation.
- **Show:** Sofa, TV or media unit, cable route, mixed storage, doorway path and rug edge.
- **Avoid:** Luxury showroom, beige-only styling, fireplace as the default focal point, impossible TV height and hidden circulation.
- **Suggested alt:** `A living room showing TV placement, practical storage and a clear path around the seating area.`

### 12. Home-office category fallback

- **File:** `public/images/home-office.webp`
- **Routes:** `/categories/home-office/` and 8 guide heroes.
- **Reason:** A generic timber desk does not show storage access, cable control, lighting or ergonomic clearance.
- **New concept:** A compact working office with chair clearance, storage, light and cable route visible.
- **Show:** Desk depth, adjustable chair, accessible storage, power point, cable tray and glare control.
- **Avoid:** Decorative laptop-only desk, hidden cables, unreadable screen text, all-timber palette and executive-office scale.
- **Suggested alt:** `A compact home office showing chair clearance, accessible storage, task lighting and managed cables.`

### 13. Outdoor and garden category fallback

- **File:** `public/images/outdoor-garden.webp`
- **Routes:** `/categories/outdoor-garden/` and 9 guide heroes.
- **Reason:** A warm-graded courtyard does not show the varied sheds, balconies, tools, shade, weather or renter constraints.
- **New concept:** A small courtyard or balcony with weather exposure, drainage, storage and access visible.
- **Show:** Storage box or cabinet, door threshold, covered and exposed zones, drainage and compact seating.
- **Avoid:** Resort styling, orange cast, dense planting that hides access and American-scale yards.
- **Suggested alt:** `A small outdoor area showing weather-exposed storage, drainage and clear access from the house.`

### 14. Dryer types guide

- **File:** `public/images/guides/dryer-types-australia.webp`
- **Route:** `/guides/heat-pump-vs-condenser-vs-vented-dryers/`
- **Reason:** The open door is useful, but the image does not explain the three dryer systems or show a ventilation path.
- **New concept:** A wide, credible comparison of installation consequences rather than branded products.
- **Show:** Vent route, condensate drain or tank access, washer relationship, door swing and walkway.
- **Avoid:** Unsafe flexible ducting, a sealed vented-dryer cupboard, impossible hoses, logos and three identical fictional machines.
- **Suggested alt:** `Laundry layouts showing dryer door clearance, a vent route and condensate drainage considerations.`

### 15. Homepage lifestyle hero

- **File:** `public/images/home-lifestyle-hero.jpg`
- **Route:** `/`
- **Reason:** A sound but generic beige, pale-timber and muted-green interior sets the repetitive visual tone for the whole publication.
- **New concept:** A contemporary Australian home with useful zones, varied materials and an indoor-outdoor connection.
- **Show:** Everyday furniture, practical storage, daylight, a veranda or garden glimpse and materials beyond timber.
- **Avoid:** Luxury display home, beige-on-beige palette, empty styling, American proportions and decorative clutter.
- **Suggested alt:** `A contemporary Australian living area with practical storage, natural light and an indoor-outdoor connection.`

### 16. Home-office cable-management guide

- **File:** `public/images/guides/home-office-desktop-storage-cable-management.webp`
- **Route:** `/guides/home-office-cable-management-what-to-plan-before-buying-organisers/`
- **Reason:** The cable-management subject is barely visible and the dark display-office styling is not useful evidence.
- **New concept:** A three-quarter desk view exposing safe cable routing.
- **Show:** Mounted power board, cable tray, monitor lead, laptop charger, accessible power point and leg clearance.
- **Avoid:** Hidden cables, overloaded adaptors, loose leads across feet, sterile styling and unreadable screens.
- **Suggested alt:** `A home-office desk showing a mounted power board, cable tray and clear leg space.`

### 17. Kitchen social image

- **File:** `public/images/social/kitchen.jpg`
- **Routes:** Open Graph image on 15 routes.
- **Reason:** The correct 1200 by 630 file repeats the beige kitchen and embeds a logo and category headline.
- **New concept:** A clean social crop derived from the approved kitchen workflow image.
- **Show:** Work aisle, pantry or drawer access and appliance landing space in the central safe area.
- **Avoid:** Embedded title, logo lockup, oversized island and pale timber throughout.
- **Suggested alt:** `A practical kitchen showing pantry access and a clear working aisle.`

### 18. Laundry social image

- **File:** `public/images/social/laundry.jpg`
- **Routes:** Open Graph image on 12 routes.
- **Reason:** The template repeats a generic grey laundry and text treatment across a large category.
- **New concept:** A clean social crop of a compact working laundry.
- **Show:** Appliance access, work surface and circulation inside the central safe area.
- **Avoid:** Embedded title, logo lockup, all-grey cabinetry and display-home scale.
- **Suggested alt:** `A compact laundry showing appliance access and practical working space.`

### 19. Pets social image

- **File:** `public/images/social/pets.jpg`
- **Routes:** Open Graph image on 11 routes.
- **Phase 1 result:** Completed as a safe temporary fallback. The defective artwork was replaced with a deterministic 1200 × 630 derivative of the approved AI-generated `pet-essentials-home-zones.webp` source supplied to the project.
- **Remaining reason for future review:** Regenerate from the final pet category asset once that image is approved so social and category photography remain aligned.
- **New concept:** A clean social crop of the approved inclusive pet-care concept, with a clearly visible companion bird, closed supply storage and safe household circulation.
- **Show:** A companion bird on a safe perch or beside a coherent cage or stand, closed supply storage, grooming items and a clear walkway, with optional non-living cues to broader pet ownership.
- **Avoid:** Embedded title, logo lockup, fake packaging or branding, a cat tree, dog-only or cat-only framing, crowded live animals, malformed bird or cage geometry and bowls blocking circulation.
- **Suggested alt:** `A practical pet-care zone with a companion bird, closed supply storage, grooming items and a clear household walkway.`

### 20. Living-spaces social image

- **File:** `public/images/social/living-spaces.jpg`
- **Routes:** Open Graph image on 11 routes.
- **Reason:** The text template and beige room extend the publication-wide repetition.
- **New concept:** A clean social crop showing media storage and a seating path.
- **Show:** Sofa edge, media storage and open circulation.
- **Avoid:** Embedded title, logo lockup, luxury styling and fireplace-only focus.
- **Suggested alt:** `A living area showing practical media storage and a clear seating path.`

### 21. Bathroom social image

- **File:** `public/images/social/bathroom.jpg`
- **Routes:** Open Graph image on 10 routes.
- **Reason:** The text template repeats the same generic beige bathroom.
- **New concept:** A crop derived from the approved practical bathroom scene.
- **Show:** Vanity, shower storage and circulation in the crop-safe area.
- **Avoid:** Embedded title, logo lockup, low-contrast beige crop and spa styling.
- **Suggested alt:** `A compact bathroom showing practical vanity and shower storage.`

### 22. Nursery and children social image

- **File:** `public/images/social/nursery-kids.jpg`
- **Routes:** Open Graph image on 10 routes.
- **Reason:** One beige nursery crop is used across unrelated age groups and subjects.
- **New concept:** A clean crop of a safe, compact, age-specific room.
- **Show:** Bed or cot edge, anchored storage and open floor path.
- **Avoid:** Embedded title, logo lockup, unsafe cot objects and beige-only styling.
- **Suggested alt:** `A compact child’s room with reachable storage and clear floor access.`

### 23. Bedroom social image

- **File:** `public/images/social/bedroom.jpg`
- **Routes:** Open Graph image on 10 routes.
- **Reason:** The template repeats the neutral bedroom used across the category.
- **New concept:** A clean crop with bed and wardrobe access in the central safe area.
- **Show:** Bed edge, wardrobe opening and clear walking space.
- **Avoid:** Embedded title, logo lockup, hotel styling and beige-only crop.
- **Suggested alt:** `A bedroom showing clear access around the bed and wardrobe.`

### 24. Outdoor and garden social image

- **File:** `public/images/social/outdoor-garden.jpg`
- **Routes:** Open Graph image on 10 routes.
- **Reason:** The template repeats the warm-graded courtyard and does not represent the category’s range.
- **New concept:** A clean social crop showing storage and weather exposure.
- **Show:** Door threshold, outdoor cabinet or box, and exposed and sheltered zones.
- **Avoid:** Embedded title, logo lockup, orange cast and resort styling.
- **Suggested alt:** `A small courtyard showing outdoor storage and weather-exposed access.`

### 25. Home-office social image

- **File:** `public/images/social/home-office.jpg`
- **Routes:** Open Graph image on 9 routes.
- **Reason:** The embedded template repeats the generic timber desk.
- **New concept:** A clean crop of a compact working desk with storage and managed cables.
- **Show:** Desk, chair, accessible storage and one visible cable route.
- **Avoid:** Embedded title, logo lockup, decorative laptop-only setup and all-timber styling.
- **Suggested alt:** `A compact home office with accessible storage and managed cables.`

Priority 26 is `public/images/social/garage-storage.jpg`. Priority 27 is the apparently unused `public/images/Media Room.webp`. Both are specified in `image-assessments.json` but sit outside the first 25.

## Top 10 recrop opportunities

The first two repairs are complete. The remaining entries are strong sources whose useful details should be protected whenever a hero, card or social crop is prepared.

| Rank | File | Opportunity |
| ---: | --- | --- |
| 1 | `guides/dishwasher-sizes-australia.webp` | Completed: article header set to `center 62%` to retain the open door and cabinetry relationship. |
| 2 | `guides/fridge-dimensions-australia.webp` | Completed: article header set to `42% 28%`; Guides card set to `42% center` to retain cavity, open door and island gap. |
| 3 | `garage.webp` | Protect the wall-storage run and clear floor zone when making a wider category crop. |
| 4 | `guides/pantry-storage-navy-walk-in.webp` | Keep both opposing shelf runs and the central access path; avoid cropping to a decorative shelf detail. |
| 5 | `guides/nursery-storage-compact-room.webp` | Retain cot, change area and the floor path together. |
| 6 | `guides/outdoor-storage-brick-courtyard.webp` | Retain the door threshold, storage and exposed courtyard surface. |
| 7 | `guides/queenslander-laundry-working-clearance.webp` | Keep the open top-loader lid and working path visible in the same crop. |
| 8 | `guides/shallow-u-shaped-vanity-drawer.webp` | Protect the U-shaped plumbing cut-out and both usable drawer wings. |
| 9 | `guides/garage-storage-double-garage-access.webp` | Keep vehicle edge, storage and walking path in the central safe band. |
| 10 | `pet2.webp` | If deliberately reused, crop around the dog bed and floor access without turning it into a generic dog portrait. |

## Urgent defects

| File | Defect | Current public state |
| --- | --- | --- |
| `public/images/pet.webp` | Invented package labels, implausible multi-species showroom and obvious generated staging. | 0 references. File retained; temporary pet source installed. |
| `public/images/guides/mattress-sizes-australia.webp` | Measuring strip and device appear physically fused into the mattress. | 0 references. File retained; safe bedroom-clearance source installed. |
| `public/images/guides/coffee-machine-types-australia.webp` | Fictional appliances with invented controls presented like assessed retail products. | 0 references. File retained; article and featured card are text-only. |
| `public/images/guides/robot-vacuum-buying-guide-australia.webp` | Current-product resemblance and heavily themed generated styling. | 0 references. File retained; approved neutral living-room fallback installed. |
| `public/images/guides/cordless-stick-vacuums-australia.webp` | Premium-vacuum resemblance and heavily themed generated styling. | 0 references. File retained; approved neutral living-room fallback installed and featured card made text-only. |

The robot and cordless-vacuum files were checked at full resolution before removal. Neither has the previously suspected cable or geometry defect, but both are now withheld because of endorsement risk and repetitive styling. The dryer has coherent doors and installation geometry and no visible branding; its replacement status remains based on weak editorial explanation rather than an emergency safety defect.

## Images reused across unrelated guides

### Hero and card photography

| File | Public routes | Guide heroes | Comment |
| --- | ---: | ---: | --- |
| `bathroom.webp` | 13 | 9 | Same room used for vanity, shower, towel and under-sink subjects. |
| `bedroom.webp` | 12 | 8 | Same room used for bedding, wardrobe, drawers, lighting and under-bed storage. |
| `garage.webp` | 11 | 8 | Reuse is less harmful because the subjects are all closely related garage-storage tasks. |
| `home-office.webp` | 11 | 8 | Same desk used for seating, lighting, cables, storage and video-call planning. |
| `kitchen.webp` | 14 | 10 | Same kitchen used for pantry, drawers, containers, appliances and under-sink storage. |
| `laundry.webp` | 14 | 10 | Same front-loader room used for top-loader, renter, drying, hamper and small-laundry guides. |
| `living-room.webp` | 12 | 9 | Same room used for TV, cables, rugs, lighting, seating, tables and toy storage. |
| `Nursery-kids.webp` | 13 | 9 | Same nursery used for infants, outings, monitoring, cots, toys and children’s storage. |
| `outdoor-garden.webp` | 13 | 9 | Same courtyard used for shade, barbecues, dining, tools, balconies and storage. |
| `guides/pet-essentials-home-zones.webp` | 14 | 10 | Safe temporary pet fallback. The same general dog zone is still being reused across specialist pet guides until the true category asset is approved. |

### Open Graph reuse

- `social-sharing.png` — 34 routes.
- `social/kitchen.jpg` — 15 routes.
- `social/laundry.jpg` — 12 routes.
- `social/living-spaces.jpg` — 11 routes.
- `social/pets.jpg` — 11 routes.
- `social/bathroom.jpg` — 10 routes.
- `social/bedroom.jpg` — 10 routes.
- `social/nursery-kids.jpg` — 10 routes.
- `social/outdoor-garden.jpg` — 10 routes.
- `social/home-office.jpg` — 9 routes.
- `social/garage-storage.jpg` — 8 routes.

The two wordmark files appear on all 140 routes and are intentional publication chrome, not reused editorial photography. Six restored-guide heroes appear on both their article and the Guides Index; that is appropriate reuse rather than unrelated-guide reuse.

## Guides still using generic category images

The 90 routes below use one of the ten category fallback files as their hero.

### `public/images/bathroom.webp` — 9 guides

- `/guides/bathroom-essentials-australian-homes/`
- `/guides/bathroom-product-storage-what-to-sort-before-buying-organisers/`
- `/guides/bathroom-storage-what-to-measure-and-check-before-you-buy/`
- `/guides/bathroom-vanity-storage-what-to-sort-before-buying-organisers/`
- `/guides/renter-friendly-bathroom-storage-what-to-check-before-you-buy/`
- `/guides/shower-storage-what-to-check-before-buying-caddies-or-shelves/`
- `/guides/small-bathroom-storage-what-to-check-before-buying-shelves-or-caddies/`
- `/guides/towel-storage-what-to-measure-before-buying-rails-hooks-or-shelves/`
- `/guides/under-sink-bathroom-storage-what-to-check-before-buying-organisers/`

### `public/images/bedroom.webp` — 8 guides

- `/guides/bedding-and-linen-basics-for-australian-bedrooms/`
- `/guides/bedroom-drawers-tallboys-and-dressers-what-to-check-before-you-buy/`
- `/guides/bedroom-essentials-for-a-more-comfortable-home/`
- `/guides/bedroom-lighting-and-window-coverings-what-to-compare-before-you-buy/`
- `/guides/bedroom-storage-ideas-small-australian-rooms/`
- `/guides/bedroom-wardrobe-organisation-what-to-sort-before-buying-storage/`
- `/guides/bedside-table-setup-what-to-check-before-you-buy/`
- `/guides/under-bed-storage-what-to-measure-before-you-buy/`

### `public/images/garage.webp` — 8 guides

- `/guides/garage-shelving-what-to-measure-before-buying-storage-units/`
- `/guides/garage-storage-tubs-what-to-sort-before-buying-more-containers/`
- `/guides/garage-storage-what-to-measure-and-check-before-you-buy/`
- `/guides/garage-tool-storage-what-to-sort-before-buying-cabinets-or-pegboards/`
- `/guides/garage-wall-storage-what-to-check-before-buying-hooks-rails-or-panels/`
- `/guides/renter-friendly-garage-storage-what-to-check-before-you-buy/`
- `/guides/small-garage-storage-what-to-check-before-buying-shelves-or-racks/`
- `/guides/sports-gear-storage-what-to-check-before-buying-hooks-racks-or-bins/`

### `public/images/home-office.webp` — 8 guides

- `/guides/home-office-cable-management-what-to-plan-before-buying-organisers/`
- `/guides/home-office-chair-and-seating-what-to-check-before-you-buy/`
- `/guides/home-office-desk-setup-what-to-measure-before-you-buy/`
- `/guides/home-office-lighting-what-to-compare-before-you-buy/`
- `/guides/home-office-setup-ideas-small-spaces/`
- `/guides/home-office-storage-for-paperwork-tech-and-supplies-what-to-plan-before-buying/`
- `/guides/home-office-video-call-background-and-desk-zone-setup-what-to-plan-before-buying/`
- `/guides/shared-home-office-spaces-how-to-set-up-without-taking-over-the-room/`

### `public/images/kitchen.webp` — 10 guides

- `/guides/best-kitchen-storage-ideas-small-australian-homes/`
- `/guides/everyday-kitchen-essentials-australian-homes/`
- `/guides/kitchen-bench-space-what-to-clear-before-buying-more-storage/`
- `/guides/kitchen-container-storage-what-to-sort-before-buying-more-containers/`
- `/guides/kitchen-drawer-storage-what-to-measure-before-buying-organisers/`
- `/guides/pantry-storage-ideas-australian-kitchens/`
- `/guides/pantry-storage-what-to-measure-before-buying-organisers/`
- `/guides/renter-friendly-kitchen-storage-what-to-check-before-you-buy/`
- `/guides/small-kitchen-appliances-what-to-check-before-you-buy/`
- `/guides/under-sink-kitchen-storage-what-to-check-before-you-buy/`

### `public/images/laundry.webp` — 10 guides

- `/guides/cleaning-product-storage-what-to-check-before-buying-cabinets-or-caddies/`
- `/guides/laundry-basket-storage-what-to-sort-before-buying-hampers-or-sorters/`
- `/guides/laundry-drying-space-what-to-measure-before-buying-airers-or-racks/`
- `/guides/laundry-essentials-australian-homes/`
- `/guides/laundry-storage-what-to-measure-and-check-before-you-buy/`
- `/guides/laundry-tub-storage-what-to-check-before-buying-under-sink-organisers/`
- `/guides/lower-waste-laundry-essentials/`
- `/guides/renter-friendly-laundry-storage-what-to-check-before-you-buy/`
- `/guides/small-laundry-storage-what-to-check-before-buying-organisers/`
- `/guides/washing-machine-and-dryer-space-what-to-measure-before-buying-storage/`

### `public/images/living-room.webp` — 9 guides

- `/guides/australian-made-gift-ideas-under-100/`
- `/guides/living-room-cable-management-what-to-plan-before-buying-organisers/`
- `/guides/living-room-lighting-ideas-for-australian-homes/`
- `/guides/living-room-rug-size-and-placement-what-to-check-before-you-buy/`
- `/guides/living-room-storage-ideas-everyday-australian-homes/`
- `/guides/side-tables-coffee-tables-and-console-tables-what-to-compare-before-you-buy/`
- `/guides/sofa-and-seating-layout-what-to-measure-before-buying-furniture/`
- `/guides/toy-blanket-and-everyday-clutter-control-for-living-rooms/`
- `/guides/tv-unit-and-media-storage-what-to-measure-before-you-buy/`

### `public/images/Nursery-kids.webp` — 9 guides

- `/guides/baby-bath-time-essentials/`
- `/guides/baby-monitors-australia/`
- `/guides/baby-outing-essentials-what-to-pack-before-leaving-the-house/`
- `/guides/bassinet-vs-cot/`
- `/guides/kids-play-and-toy-storage-what-to-plan-before-buying/`
- `/guides/nappy-change-station-checklist/`
- `/guides/newborn-essentials/`
- `/guides/nursery-essentials-for-australian-homes/`
- `/guides/nursery-storage-small-rooms/`

### `public/images/outdoor-garden.webp` — 9 guides

- `/guides/balcony-and-courtyard-garden-setup-what-to-plan-before-buying-pots-and-planters/`
- `/guides/barbecue-area-setup-what-to-measure-before-buying-outdoor-cooking-gear/`
- `/guides/garden-tool-care-and-seasonal-outdoor-reset/`
- `/guides/outdoor-dining-area-setup-what-to-measure-before-buying-furniture/`
- `/guides/outdoor-entertaining-area-setup-what-to-plan-before-buying-extra-furniture-and-accessories/`
- `/guides/outdoor-lounge-area-setup-what-to-measure-before-buying-seating/`
- `/guides/outdoor-shade-setup-for-patios-and-backyards-what-to-check-before-buying/`
- `/guides/outdoor-storage-for-small-australian-backyards-what-to-plan-before-buying/`
- `/guides/outdoor-storage-ideas-australian-patios-balconies-gardens/`

### `public/images/guides/pet-essentials-home-zones.webp` — 10 guides

- `/guides/cat-litter-tray-setup-what-to-plan-before-you-buy/`
- `/guides/how-to-choose-the-right-dog-bed-for-your-home/`
- `/guides/new-puppy-essentials/`
- `/guides/pet-cleaning-supplies-what-to-check-before-buying-cleaning-gear/`
- `/guides/pet-essentials-for-australian-homes/`
- `/guides/pet-feeding-station-ideas-for-australian-homes/`
- `/guides/pet-food-storage-what-to-check-before-buying-containers/`
- `/guides/pet-gates-barriers-and-room-separation-what-to-check-before-you-buy/`
- `/guides/pet-travel-essentials-what-to-check-before-buying-car-travel-gear/`
- `/guides/rental-friendly-pet-setup-what-to-check-before-buying-pet-gear/`

## Files that appear unused

The route and source scans found no current reference to:

- `public/images/guides/coffee-machine-types-australia.webp`
- `public/images/guides/mattress-sizes-australia.webp`
- `public/images/Media Room.webp`
- `public/images/nursery-home-hero.png`
- `public/images/pet.webp`
- `public/images/pet2.webp`
- `public/images/shane.webp`

Do not delete these files as part of this audit. The three defective files are retained so the audit does not falsely report them as deleted or repaired. The nursery source, dog-bed source and author portrait are credible enough to preserve. The media-room file should be replaced only if it is deliberately brought back into use.

## Alt-text inconsistencies

The inventory preserves every discovered alt value. The principal problem is semantic overreach rather than punctuation.

| File | Distinct alt values | Finding |
| --- | ---: | --- |
| `kitchen.webp` | 13 | Alt text claims pantry, drawer, container, appliance and under-sink details not consistently visible. |
| `living-room.webp` | 13 | Alt text changes between cables, rugs, lighting, tables, seating, toys and media storage. |
| `bathroom.webp` | 12 | Alt text claims shower, towel, vanity and under-sink details from one generic room. |
| `outdoor-garden.webp` | 12 | Alt text changes across shade, barbecue, dining, tools, storage and entertaining. |
| `bedroom.webp` | 12 | Alt text changes across drawers, wardrobe, under-bed storage, lighting and bedding. |
| `home-office.webp` | 11 | Alt text claims cable, chair, lighting, storage and video-call details from one desk. |
| `Nursery-kids.webp` | 7 | The same nursery is described for babies, cots, monitoring, outings, toys and older children. |
| `laundry.webp` | 5 | Several highly reused descriptions collapse to generic laundry wording, masking subject mismatch. |
| `garage.webp` | 4 | Mostly punctuation and cabinets-versus-shelves wording; the image is reasonably relevant to the group. |
| `guides/pet-essentials-home-zones.webp` | 2 | All temporary fallback uses now share one truthful general description; the original pet-essentials article retains its more specific before-and-after description. |
| `guides/bedroom-storage-clear-walkway.webp` | 2 | Mattress article and card use one clearance description; the original bedroom-storage article retains its specific after-image description. |
| `guides/pet-essentials-before-scattered-supplies.webp` | 2 | Companion usage differs only in presentation context; review punctuation when public alt text is next edited. |
| `guides/living-room-storage-before-cluttered-zones.webp` | 3 | Original living-room storage use plus the robot-vacuum hero and featured card; the shared wording stays truthful and emphasises floor-level obstacles. |
| `guides/living-room-storage-everyday-zones.webp` | 2 | Original living-room storage use plus the cordless-vacuum hero; both uses truthfully show floor surfaces, low furniture and a clear route. |
| `guides/fridge-dimensions-australia.webp` | 2 | Guide hero and Guides Index descriptions differ slightly. |
| `guides/cookware-materials-australia.webp` | 2 | Guide hero and Guides Index descriptions differ slightly. |

When imagery is repaired, each alt description should state what is actually visible and relevant in that specific file. It should not be rewritten to make a generic image sound guide-specific.

## Open Graph crop risks

All 11 Open Graph files are 1200 by 630 pixels, so there is no source aspect-ratio failure.

Risks are editorial:

- Nine category social cards place embedded branding and headline text on the left and a narrow crop of the generic category scene on the right.
- `social/pets.jpg` is now a clean, crop-safe 1200 × 630 photograph made from the approved local temporary source. It contains no embedded text, logo or defective pet artwork.
- Replacing only the right-hand photograph would preserve the repetitive template and its embedded text.
- Future social images should keep the useful subject in a central crop-safe area because platforms can trim edges or overlay interface elements.
- The publication-level `social-sharing.png` keeps its wordmark inside a safe central area and is suitable as the fallback.
- Social alt text should describe the image content, not repeat the visual headline.

## Eight restored guides

Scores are averages of topic relevance, realism, colour and visual interest, composition, technical quality and brand suitability.

### Fridge dimensions

- **Route:** `/guides/fridge-dimensions-australia/`
- **File:** `public/images/guides/fridge-dimensions-australia.webp`
- **Status and score:** RECROP COMPLETED — 4.00/5.
- **Recommendation:** Retain the source. The article uses `42% 28%`; the featured card uses `42% center`. These positions preserve the overhead cavity, open door and island gap without editing the source pixels.
- **Generation brief:** Photorealistic contemporary Australian kitchen, landscape 16:9 with all essential details inside a central 20:9 safe band. Show an unbranded freestanding fridge in a real cavity, one door open to about 90 degrees, overhead hinge clearance, side gaps, a nearby island or opposing bench and a believable route from a doorway. Use mixed painted cabinetry, stainless steel and stone or laminate rather than a pale-timber set. Natural daylight, ordinary home scale, controlled exposure. No logos, labels, invented controls, distorted shelves, impossible door swing, oversized kitchen or text. Suggested alt: `An open fridge in its cavity showing side clearance, overhead space and the gap to a nearby island.`

### Dryer types

- **Route:** `/guides/heat-pump-vs-condenser-vs-vented-dryers/`
- **File:** `public/images/guides/dryer-types-australia.webp`
- **Status and score:** REPLACEMENT ASSET PENDING — 3.33/5.
- **Recommendation:** Keep temporarily. Full-resolution review found no urgent brand, label, cable, installation or geometry defect. Replace because the image still does not explain the installation differences discussed.
- **Generation brief:** Wide editorial comparison in a realistic Australian laundry, composed as three physically credible installation zones without text labels or logos. One zone should show a short, safe vent route to an exterior wall; one should make condensate drainage or removable tank access legible; one should show the larger unvented appliance footprint and door clearance. Include a washer for scale, power and plumbing in sensible positions, and a clear working aisle. Use varied but restrained painted cabinetry and neutral daylight. Keep important details in a central 20:9 safe band. Do not connect one dryer to both a vent and condensate route, seal a vented dryer in a cupboard, invent hoses or controls, copy branded products or create catalogue-style identical machines. Suggested alt: `Laundry installation zones showing dryer door clearance, a vent route and condensate drainage considerations.`

### Dishwasher sizes

- **Route:** `/guides/dishwasher-sizes-australia/`
- **File:** `public/images/guides/dishwasher-sizes-australia.webp`
- **Status and score:** RECROP COMPLETED — 4.17/5.
- **Recommendation:** Keep. The article now uses `center 62%` to retain the open door, lower rack and adjacent cabinetry in the wide hero.
- **Generation brief:** If a replacement is later needed, create a photorealistic compact Australian kitchen at normal eye level, landscape 16:9 with a central 20:9 safe band. Show an unbranded dishwasher fully open, lower rack partly extended, neighbouring cabinet doors and handles, a nearby corner or island, toe-kick and a clear standing zone. The open door must sit square to the cabinet and not intersect a handle or walkway. Use natural light and a believable mix of painted cabinetry, stainless steel and tile. No logos, distorted rack wires, malformed hinges, impossible door thickness, blocked escape path or embedded measurements. Suggested alt: `An open dishwasher showing the door, lower rack and clearance from adjacent cabinets and handles.`

### Cookware materials

- **Route:** `/guides/cookware-materials-compared/`
- **File:** `public/images/guides/cookware-materials-australia.webp`
- **Status and score:** MINOR EDIT — 4.00/5.
- **Recommendation:** Keep the concept and make a modest colour and exposure edit. It already compares materials without visible branding.
- **Generation brief:** If diversified later, use a believable working Australian kitchen rather than a product flat lay. Landscape 16:9, with an unbranded stainless-steel saucepan, cast-iron pan, carbon-steel pan and coated pan placed in plausible active or cooling zones around a cooktop. Their material surfaces must look physically distinct. Include a trivet, tea towel and small amount of real food preparation for scale, leaving handles safely oriented. Use painted cabinetry, tile or terrazzo and controlled daylight so timber is not the dominant surface. No logos, labels, impossible reflections, duplicated handles, pristine retail lineup, unsafe handles over an aisle or embedded text. Suggested alt: `Unbranded stainless-steel, cast-iron, carbon-steel and coated cookware in a working kitchen.`

### Cordless stick vacuums

- **Route:** `/guides/cordless-stick-vacuums-australia/`
- **File:** `public/images/guides/cordless-stick-vacuums-australia.webp`
- **Status and score:** TEMPORARILY REMOVED FROM PUBLIC USE — 3.00/5.
- **Recommendation:** The dedicated file remains in the repository with zero public references. The article temporarily uses `living-room-storage-everyday-zones.webp`, while its featured Guides card is text-only to avoid placing two near-identical room cards side by side.
- **Generation brief:** Photorealistic Australian laundry or utility cupboard, landscape 16:9 with storage details inside a central 20:9 safe band. Show an unbranded cordless stick vacuum being placed into a stable wall-mounted charging dock, with the dock’s power lead routed neatly to a nearby Australian power point. Include two realistic attachments, door clearance and enough room to remove the vacuum. The person’s hand and grip must be anatomically correct. Use mixed painted and metal surfaces with natural daylight and one modest colour accent. The vacuum itself must remain cordless: no cable attached to its body while in use. No floating dock, malformed floor head, copied branded silhouette, fake labels, impossible charging contact, theatrical colour blocking or text. Suggested alt: `An unbranded cordless stick vacuum beside a wall-mounted charging dock and organised attachments in a utility cupboard.`

### Robot vacuum

- **Route:** `/guides/robot-vacuum-buying-guide-australia/`
- **File:** `public/images/guides/robot-vacuum-buying-guide-australia.webp`
- **Status and score:** TEMPORARILY REMOVED FROM PUBLIC USE — 3.33/5.
- **Recommendation:** The dedicated file remains in the repository with zero public references. The article and featured Guides card temporarily use `living-room-storage-before-cluttered-zones.webp`, which truthfully shows floor-level obstacles and room context without depicting a specific product.
- **Generation brief:** Photorealistic ordinary Australian living area, landscape 16:9 with all navigation details in a central 20:9 safe band. Show an unbranded robot vacuum away from its dock and approaching a low-pile rug edge. Include dining-chair legs, low sofa clearance, a threshold or floor-material change, one loose charging cable near but not attached to the robot, and one pet toy or sock as a realistic obstacle. The dock should be against a wall with its own lead correctly connected to a power point and clear approach space. Use balanced daylight, varied materials and natural colour rather than a cobalt-and-orange theme. No lead attached to the robot, floating dock, impossible reflections, malformed wheels, copied branded lidar housing, empty showroom or text. Suggested alt: `An unbranded robot vacuum navigating a rug edge, furniture legs and loose obstacles near its charging dock.`

### Coffee machine types

- **Route:** `/guides/coffee-machine-types-australia/`
- **File:** `public/images/guides/coffee-machine-types-australia.webp`
- **Status and score:** TEMPORARILY REMOVED FROM PUBLIC USE — 2.83/5.
- **Recommendation:** The defective file remains in the repository with zero public references. The article and featured card now use the existing text-only treatment. Produce the replacement specified in `phase-1-replacement-assets.md`.
- **Generation brief:** Photorealistic lived-in Australian kitchen bench, landscape 16:9 with three workflow zones inside a central 20:9 safe band. The left zone shows a small unbranded pod machine with a drawer of generic capsules; the centre shows a manual espresso setup with a separate grinder, portafilter and tamping mat; the right shows an unbranded automatic bean-to-cup machine with hopper and cup. Use water access, cups, beans and realistic bench depth to explain workflow rather than line products up like a catalogue. Each machine must have coherent controls, trays, spouts and proportions. Use natural light, painted cabinetry, stainless steel and tile with restrained colour. No logos, fake labels, copied brand silhouettes, unreadable displays, malformed steam wands, impossible reflections, forced cobalt-and-coral decor or embedded text. Suggested alt: `Three unbranded coffee preparation setups showing pod, manual espresso and automatic workflows on a kitchen bench.`

### Mattress sizes

- **Route:** `/guides/mattress-sizes-australia/`
- **File:** `public/images/guides/mattress-sizes-australia.webp`
- **Status and score:** TEMPORARILY REMOVED FROM PUBLIC USE — 2.67/5.
- **Recommendation:** The defective file remains in the repository with zero public references. The guide and featured card temporarily use `bedroom-storage-clear-walkway.webp`, which truthfully shows the bed footprint, wardrobe and walking clearance. Produce the replacement specified in `phase-1-replacement-assets.md`.
- **Generation brief:** Photorealistic modest Australian bedroom viewed from the doorway or foot of the bed, landscape 16:9 with the bed and all clearances inside a central 20:9 safe band. Show a normal queen-size bed footprint without labels, two ordinary bedside tables, a wardrobe or dresser, doorway and visible walking gaps on three sides. A real retractable tape measure may lie on the floor across one walking gap, with its case and tape physically correct and not touching or fusing into the mattress. Use natural daylight, painted walls, mixed textiles and one confident colour accent without a staged palette. No built-in measuring strip, fake mattress badge, floating frame, impossible legs, distorted wardrobe doors, luxury-suite scale, text or logos. Suggested alt: `A bedroom showing the bed footprint and walking clearances to the wardrobe, wall and doorway.`

## Phase 1 validation

The regenerated audit completes with:

- 52 inventoried files.
- 0 pending assessments.
- 0 exact binary duplicate groups.
- 3 perceptual near-duplicate pairs.
- all seven contact sheets rebuilt with current public-use status labels.

The public build remains at 140 pages. Source and built output contain no references to `pet.webp`, `guides/mattress-sizes-australia.webp`, `guides/coffee-machine-types-australia.webp`, `guides/robot-vacuum-buying-guide-australia.webp` or `guides/cordless-stick-vacuums-australia.webp`.
