# Phase 1 replacement asset manifest

This manifest defines the six production images still required after the first public visual repairs. It is an asset specification, not permission to publish an unreviewed image.

## Shared production standard

All six assets must meet these requirements:

- Output: 1920 × 1080 pixels, landscape 16:9, saved as WebP in sRGB.
- Compression: visually clean at the hero size, with no banding, ringing or smeared appliance detail.
- Crop safety: every essential object and planning detail must remain inside the central 1120 × 640 pixel intersection. Secondary room context may extend to the full frame.
- Hero crop: the central horizontal 1920 × 640 band must remain useful when the desktop article header removes the top and bottom of the source.
- Card crop: the central 1120 × 1080 column must remain useful when a near-square card removes the left and right edges.
- Mobile crop: the central subject must remain intelligible without relying on details at either outside edge.
- Style: contemporary, realistic Australian home; ordinary room scale; natural light; lived-in but uncluttered; editorial rather than retail.
- Colour: warm without being beige-dominated, with one or two restrained accents chosen for the room. The batch must not repeat one site-wide palette.
- No embedded text, logos, fake branding, watermarks or readable product packaging.
- No recognisable copy of a current branded product.
- Doors, hinges, handles, controls, cables, hoses, reflections, shadows, clearances and human or animal anatomy must be physically plausible.
- Reject any asset whose planning issue disappears at hero, card or mobile crop.

## 1. Pet category fallback

- **Destination filename:** `public/images/pet.webp`
- **Purpose:** A general Australian household pet-care image suitable for the Pets category, homepage and category cards, the Guides feature, and guides that temporarily rely on the category fallback.
- **Routes:** `/categories/pets/`, Pets cards on `/` and `/categories/`, the Pets feature on `/guides/`, and the guides that use the Pets category fallback.
- **Required dimensions:** 1920 × 1080.
- **Target aspect ratio:** 16:9.
- **Central crop-safe area:** 1120 × 640 centred in the frame.
- **Subject and composition:** Contemporary, realistic Australian home pet-care zone near an entry, utility area or similar transition. Include one clearly visible small companion bird, such as a cockatiel, on a safe perch or beside a suitable, well-kept cage or stand. Keep the bird clearly visible in the central crop-safe area. Maintain a clear household walking route through the scene.
- **Practical details:** Include practical closed storage for pet supplies and a small grooming basket, toys or similar general pet-care items. A dog bed, lead, general pet toy storage or feeding station may appear as a non-living secondary cue to broader pet ownership. A visible dog or cat is not required. Do not include a cat tree. Place food and water bowls against a wall or in a sensible protected position, not in a doorway or the main walkway. Use easy-clean flooring and believable household proportions.
- **Category inclusiveness:** The image must not suggest that Australian Home Collective’s Pets coverage is only for dogs and cats. The bird must be an intentional part of the scene, not a tiny decorative detail at the edge. Do not crowd the scene with several live animals. Different pet categories may be represented through non-living cues such as a bed, lead, bowls, toys or storage.
- **Decor direction:** Warm, editorial and lived-in rather than retail-showroom styling, with painted surfaces and restrained accents.
- **Colour variation:** Deep teal, olive, eucalyptus green, mustard or burgundy may be used as restrained accents.
- **Repetition restrictions:** Avoid beige-on-beige styling, the repeated cobalt-and-terracotta treatment and an all-timber pet showroom.
- **Brand restrictions:** No logos, readable packaging, invented labels, watermarks, recognisable retail products or fake specialist or veterinary equipment.
- **Plausibility checks:** Bird anatomy, feet, feathers, perch contact and scale must be realistic. Cage, door, perch and stand geometry must be coherent. Storage must sit correctly on the floor or wall. Bowls must not block circulation. Shadows, perspective and floor lines must agree. No objects may float or fuse together.
- **Crop considerations:** The bird, closed storage, general care items and clear household path must remain useful after hero, card and mobile cropping.
- **Final alt text:** `A practical pet-care zone with a companion bird, closed supply storage, grooming items and a clear household walkway.`
- **Reject if:** The bird is absent or cropped out; the scene is dog-only or cat-only; a cat tree is included; multiple live animals are crowded together unnaturally; pet bowls block the doorway or main walkway; fake packaging or branding is visible; the bird, cage, furniture or storage geometry is malformed; the room resembles a pet-store showroom; or the practical clear path disappears in any required crop.

## 2. Mattress Sizes

- **Destination filename:** `public/images/guides/mattress-sizes-australia.webp`
- **Route:** `/guides/mattress-sizes-australia/` and its featured Guides card.
- **Required dimensions:** 1920 × 1080.
- **Target aspect ratio:** 16:9.
- **Central crop-safe area:** 1120 × 640 centred in the frame.
- **Subject and composition:** Modest Australian bedroom viewed from the doorway or foot of the bed. Show the complete relationship between the bed edge, wardrobe and walking route rather than a mattress product close-up.
- **Practical details:** Ordinary queen-size bed footprint, two sensible bedside zones, hinged or sliding wardrobe, doorway, clear floor gaps on at least three sides and one normal retractable tape measure on the floor.
- **Decor direction:** Painted wardrobe or wall, mixed textiles, restrained furniture and ordinary ceiling height. The room should look occupied but tidy.
- **Colour variation:** Dusty blue, eucalyptus green, burgundy or mustard may be used as a single accent with warm white and natural materials.
- **Repetition restrictions:** No saturated cobalt bedding, aubergine-and-terracotta set, beige hotel room or all-grey display suite.
- **Brand restrictions:** No mattress badges, labels, product packaging or distinctive branded mattress construction.
- **Plausibility checks:** Tape case and blade are physically correct and lie on the floor; tape is not fused into the mattress; bed frame legs and floor contact are consistent; wardrobe doors can open; walking gaps are believable.
- **Crop considerations:** Bed edge, wardrobe relationship and one clear walkway must survive the card crop. Keep the tape and floor clearance inside the hero-safe band.
- **Final alt text:** `A bedroom showing the bed footprint and walking clearances to the wardrobe, wall and doorway.`
- **Reject if:** The measuring device is attached to the mattress; the room scale is luxurious or impossible; furniture floats; bed or wardrobe geometry is malformed; labels appear; or the useful floor gap is cropped out.

## 3. Coffee Machine Types

- **Destination filename:** `public/images/guides/coffee-machine-types-australia.webp`
- **Route:** `/guides/coffee-machine-types-australia/` and its featured Guides card.
- **Required dimensions:** 1920 × 1080.
- **Target aspect ratio:** 16:9.
- **Central crop-safe area:** 1120 × 640 centred in the frame.
- **Subject and composition:** One believable kitchen bench divided naturally into three workflow zones rather than a catalogue lineup. The central zone shows manual espresso preparation, with smaller pod and automatic workflows on either side.
- **Practical details:** Generic pod storage and cup; coherent manual machine, separate grinder, portafilter and tamping mat; coherent automatic machine with hopper and cup; water access, bench depth, usable landing space and cleaning clearance.
- **Decor direction:** Contemporary working kitchen with painted cabinetry, restrained tile and stainless steel. Keep the bench practical rather than styled as a showroom.
- **Colour variation:** Burgundy, forest green or clear painted cabinetry with warm white tile is acceptable. Use only one main accent.
- **Repetition restrictions:** No cobalt splashback with coral cabinets, red retail-counter styling, beige timber showroom or all-grey appliance wall.
- **Brand restrictions:** No logos, readable displays, fake labels, branded capsule shapes or recognisable copies of current machines.
- **Plausibility checks:** Controls, trays, spouts, steam wand, portafilter, hopper and water reservoir must be coherent; reflections and power leads must agree; no machine may merge with the bench or another appliance.
- **Crop considerations:** All three workflows must remain identifiable in the wide hero. The manual workflow and enough of both neighbouring types must survive the central card crop.
- **Final alt text:** `Three unbranded coffee preparation setups showing pod, manual espresso and automatic workflows on a kitchen bench.`
- **Reject if:** The machines appear as a retail lineup; any product resembles a named model; controls or accessories are invented or malformed; branding or unreadable text appears; or a card crop reduces the scene to one machine type.

## 4. Robot Vacuum

- **Destination filename:** `public/images/guides/robot-vacuum-buying-guide-australia.webp`
- **Route:** `/guides/robot-vacuum-buying-guide-australia/` and its featured Guides card.
- **Required dimensions:** 1920 × 1080.
- **Target aspect ratio:** 16:9.
- **Central crop-safe area:** 1120 × 640 centred in the frame.
- **Subject and composition:** Ordinary Australian living and dining transition with an unbranded robot vacuum moving away from its dock and approaching a rug edge. Use a low camera angle that clearly shows navigation constraints.
- **Practical details:** Correctly powered dock against a wall, clear approach space, low-pile rug transition, dining-chair legs, low sofa clearance, one threshold or floor-material change and one realistic loose obstacle such as a pet toy or charging cable.
- **Decor direction:** Lived-in contemporary room with mixed upholstery, painted surfaces and normal apartment or suburban-house scale.
- **Colour variation:** Teal, plum or clear green may be used on one textile or furniture item with warm neutral surroundings.
- **Repetition restrictions:** No cobalt feature wall, orange armchair and blue rug combination; no beige showroom; no all-grey display room.
- **Brand restrictions:** No copied lidar housing, logo, app screen, dock design or recognisable product silhouette.
- **Plausibility checks:** No lead is attached to the robot; the dock alone connects to wall power; wheels sit on the floor; reflections and shadows agree; chair gaps and rug height are navigable; dock is not floating.
- **Crop considerations:** Robot, rug edge, chair legs and dock must all remain in the central hero-safe band. Robot and at least two obstacle types must survive the card crop.
- **Final alt text:** `An unbranded robot vacuum navigating a rug edge, furniture legs and loose obstacles near its charging dock.`
- **Reject if:** A cable is attached to the robot; the dock is unpowered or floating; the product resembles a named model; floor or furniture geometry is impossible; loose obstacles disappear in crop; or the scene is nearly empty.

## 5. Cordless Stick Vacuum

- **Destination filename:** `public/images/guides/cordless-stick-vacuums-australia.webp`
- **Route:** `/guides/cordless-stick-vacuums-australia/` and its featured Guides card.
- **Required dimensions:** 1920 × 1080.
- **Target aspect ratio:** 16:9.
- **Central crop-safe area:** 1120 × 640 centred in the frame.
- **Subject and composition:** Australian laundry or utility cupboard with an unbranded cordless vacuum being returned to a wall-mounted dock. Frame the storage and charging relationship, not a decorative cleaning pose.
- **Practical details:** Secure dock, correctly routed dock power lead to an Australian power point, removable vacuum body, two distinct attachments, door clearance and enough hand space to lift the unit away.
- **Decor direction:** Painted utility cabinetry, durable floor, metal hardware and natural side light. Keep the cupboard ordinary and achievable.
- **Colour variation:** Plum, deep green or muted yellow may appear as one cabinet or storage accent.
- **Repetition restrictions:** No cobalt sofa, coral cushion, primary-colour rug, beige timber cupboard or all-grey utility wall.
- **Brand restrictions:** No copied handle, cyclone, battery, floor-head or dock silhouette; no logos or model labels.
- **Plausibility checks:** The vacuum body has no cable attached during use; only the dock connects to power; hand anatomy and grip are correct; tube, bin, battery and floor head connect coherently; dock bears the unit’s weight.
- **Crop considerations:** Vacuum body, dock, power route and attachments must remain visible in both hero and card crops. Do not place the power point at the outer edge.
- **Final alt text:** `An unbranded cordless stick vacuum beside a wall-mounted charging dock and organised attachments in a utility cupboard.`
- **Reject if:** A lead attaches to the vacuum body; dock or attachments float; the product copies a recognisable model; anatomy or product joints are malformed; the power point is impossible; or the card crop hides charging.

## 6. Dryer Types

- **Destination filename:** `public/images/guides/dryer-types-australia.webp`
- **Route:** `/guides/heat-pump-vs-condenser-vs-vented-dryers/`
- **Required dimensions:** 1920 × 1080.
- **Target aspect ratio:** 16:9.
- **Central crop-safe area:** 1120 × 640 centred in the frame.
- **Subject and composition:** Wide editorial comparison of three credible laundry installation consequences, arranged as adjacent zones rather than a retail product lineup. Each zone must read through physical context without text labels.
- **Practical details:** One short and safe exterior vent route; one visible condensate drain connection or removable tank access; one larger unvented appliance footprint; clear door swings, washer relationship, power access and working aisle.
- **Decor direction:** Modest Australian laundry with mixed painted cabinetry, tile and stainless steel. Use consistent room architecture while varying the relevant installation detail.
- **Colour variation:** Forest green, navy or warm yellow may be used sparingly in cabinetry, towel or basket. Appliances remain neutral and unbranded.
- **Repetition restrictions:** No beige timber laundry, all-grey display home, repeated cobalt-and-terracotta palette or luxury mudroom scale.
- **Brand restrictions:** No logos, model labels, copied control panels or recognisable appliance fronts.
- **Plausibility checks:** A vented dryer is not sealed in cabinetry; vent route terminates outside; hoses do not pass through impossible surfaces; doors clear neighbouring cabinets and the walkway; controls, drums, hinges and shadows are coherent.
- **Crop considerations:** The three installation consequences must survive the wide hero. If a future card uses the asset, the central zone and visible clues from both outer zones must remain in the 1120-pixel card-safe column.
- **Final alt text:** `Laundry installation zones showing dryer door clearance, a vent route and condensate drainage considerations.`
- **Reject if:** One machine is shown with contradictory vent and condensate connections; ducting is unsafe; doors or controls are malformed; products are copied or branded; the layout resembles a catalogue; or cropping removes an installation type.

## Approval gate

Before any asset replaces a current file:

1. Review the full-resolution source.
2. Review a 1920 × 640 hero crop.
3. Review an 1120 × 1080 card crop.
4. Review a mobile crop.
5. Check every rejection item above at 100% zoom.
6. Confirm the final alt text describes only visible content.
7. Compare the six approved assets together to ensure the batch is varied rather than another imposed decor palette.
