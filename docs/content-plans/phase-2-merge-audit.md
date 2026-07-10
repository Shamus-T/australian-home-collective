# Phase 2 merge and coverage audit

Completed 10 July 2026 after the Phase 1 editorial pass.

This audit records the canonical decisions, content merges, moved-page handoffs,
coverage additions and final validation completed during Phase 2.

## Laundry

### Recommended canonical

Keep `/guides/laundry-storage-what-to-measure-and-check-before-you-buy/` as the
canonical general laundry-storage guide.

Reasons:

- It is the longer, measurement-led guide and covers the room, routine,
  storage types, household constraints and the point at which buying can wait.
- The laundry category hub already leads with this route.
- Related guides already use it as the main cross-link target.
- It has a clear job: plan the space around wash-day bottlenecks before buying.

### Merge candidate

`/guides/laundry-organisation-ideas-that-save-space/` overlaps on vertical
storage, trolleys, grouped products, drying space, baskets, hooks, pet laundry,
cleaning-product safety and overflow control. Keep its strongest routine-led
sections as material for the canonical page, then redirect the old route only
after checking all inbound links and the sitemap.

The small-laundry guide should remain separate. Its promise is constrained
rooms and clearances, not general laundry organisation.

### Link impact before a redirect

The organisation route is referenced from the laundry hub and several related
guides, while the measurement route is referenced more broadly. Update those
references to the canonical route in the same change as any redirect; do not
leave a live page and a redirect competing in navigation.

## Bathroom

### Recommended canonical

Keep `/guides/bathroom-storage-what-to-measure-and-check-before-you-buy/` as the
canonical general bathroom-storage guide.

Reasons:

- It is the longer, measurement-led guide and covers daily routines, vanity,
  walls, shower, towels, moisture, cleaning access, safety and rental limits.
- The bathroom category hub already leads with this route.
- The surrounding bathroom guides already link back to it as the general guide.
- It has a distinct planning promise rather than a product list.

### Merge candidate

`/guides/bathroom-storage-products-worth-considering/` repeats the same product
areas: vanity storage, drawer dividers, shower caddies, wall storage,
over-toilet storage, towel hooks, cleaning products, clear containers and
overflow baskets. Preserve any concise product-type examples that improve the
canonical guide, then redirect the old route only after reviewing its inbound
links and sitemap entry.

The small-bathroom, shower, towel, vanity, under-sink and renter guides should
remain separate because each has a narrower room or use-case promise.

### Link impact before a redirect

The products route appears in the bathroom hub and a small number of related
guides. Replace those references with the canonical route in the same change as
any redirect so the hub and related-guide blocks do not point at a retiring URL.

## Nursery change area

### Recommended canonical

Keep `/guides/nappy-change-station-checklist/` as the canonical change-area guide.

Reasons:

- Its title and shorter route match the reader's immediate task.
- It already has the broader set of inbound links from nursery and baby-routine guides.
- The longer setup article's useful surface, height, stability, night-time and shared-room
  material can be incorporated without maintaining two near-identical checklists.

### Merge implementation

The canonical checklist now includes the stronger room-planning and safety material. Category
cards, the guide index and related links point to it. The retiring baby-change-setup route remains
available as a `noindex,follow` moved page, while its URL is removed from the sitemap.

## Garage storage

### Recommended canonical

Keep `/guides/garage-storage-what-to-measure-and-check-before-you-buy/` as the canonical general
garage-storage guide.

Reasons:

- It is the more complete guide to sorting, measurement, vehicle clearance, loads, wall types,
  moisture, hazardous items and rental limits.
- The garage category hub already leads with this route.
- Most garage subtopic guides already use it as their general cross-link target.
- Its planning promise supports readers before they choose shelving, tubs, hooks or wall systems.

### Merge implementation

The canonical guide now includes the retiring article's strongest routine-led material: a hand-off
zone near the household entry, frequency-based placement and simpler sports and everyday-gear
resetting. Category cards, the guide index and related links point to the canonical route. The old
ideas route remains available as a `noindex,follow` moved page and is removed from the sitemap.

## Implementation process

1. Confirm the canonical route from article depth, intent and inbound links.
2. Merge the strongest distinct material into the canonical article without
   concatenating repeated sections.
3. Update category cards, the guides index, related-guide arrays and inline links together.
4. Keep the retiring route as a `noindex,follow` moved page with an immediate refresh link.
5. Remove the retiring URL from the sitemap, build and validate generated output before publishing.

## Coverage expansion

The three category gaps identified in the Phase 1 triage are now covered with focused guides:

- Nursery & Kids adds a play, toy, craft and school-item storage guide, extending the hub beyond
  infant equipment while linking current ACCC furniture-stability guidance.
- Outdoor & Garden adds garden-tool care and seasonal outdoor resetting before any further
  furniture or storage variant.
- Pets adds a cat litter-tray planning guide, balancing the dog-heavy set with RSPCA-sourced cat
  advice on tray number, placement, size, cleaning and multi-cat access.

## Implementation update

The laundry, bathroom, nursery and garage recommendations have been applied:

- Category cards, the guides index and related-guide links point to the four canonical routes.
- The four retiring routes remain available as `noindex,follow` moved pages with immediate refresh
  links, so existing bookmarks have a path to the canonical guide.
- The canonical articles remain the source pages; no duplicate article content is maintained.
- The final Astro build produces 131 pages.
- The generated-output audit checked 4,183 internal links with no broken targets.
- The sitemap contains 112 unique canonical URLs with no missing pages, canonical mismatches,
  `noindex` entries or duplicate canonical titles.
- All four retired routes pass their sitemap exclusion, `noindex,follow` and canonical-target checks.
