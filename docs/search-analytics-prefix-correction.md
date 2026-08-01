# Search analytics prefix correction

Search tracking was corrected on 1 August 2026 so that the public search page
records a completed query after 1,200 milliseconds of inactivity, an Enter
submission, or a result click. Analytics queries are whitespace-normalised,
lowercased, and must contain at least three non-whitespace characters.

The raw `search_events` table is not rewritten or deleted. For dashboard
reporting before the correction boundary, a search row is hidden only when all
of these conditions identify it as a clear typing prefix:

- a longer query follows in the same anonymous browser session;
- it starts with the complete earlier query;
- it arrives within two seconds; and
- no result click was attributed to the earlier query before the longer query.

This reporting-only heuristic cannot prove whether an unclicked short query was
submitted deliberately before the reader continued typing. The two-second,
same-session, strict-prefix, and click-protection conditions keep the treatment
conservative. Historical raw data remains available for audit, and all events
at or after the correction boundary bypass the heuristic.
