# Phase 2 merge audit: laundry and bathroom

Updated 10 July 2026 after the Phase 1 editorial pass.

This audit compares the first two merge candidates without changing routes,
deleting pages or adding redirects. A redirect and canonical decision should be
approved before any route is retired.

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

## Safe next implementation step

1. Confirm these two canonical routes.
2. Draft a content merge map section by section, keeping the canonical page's
   strongest wording and removing repeated sections rather than concatenating
   both articles.
3. Update category cards, related-guide arrays and inline links together.
4. Add redirects only through the site's approved hosting/configuration path.
5. Build, inspect generated routes and check canonical/sitemap output before
   publishing.

## Implementation update

The laundry and bathroom recommendations have now been applied:

- Category cards, the guides index and related-guide links point to the two canonical routes.
- The two retiring routes remain available as `noindex,follow` moved pages with immediate refresh
  links, so existing bookmarks have a path to the canonical guide.
- The canonical articles remain the source pages; no duplicate article content is maintained.
- The Astro build and generated route list must be checked before this implementation is published.
