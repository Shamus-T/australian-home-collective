# Pagefind article-body indexing audit

Audit date: 30 July 2026  
Pagefind version: 1.5.2

## Conclusion

Pagefind indexes the complete intended searchable content of all 114 active guides and all
10 intended category pages. No layout, indexing-boundary or exclusion change is required.

The CLI message `Indexed 5,139 words` is not a count of prose word occurrences. In
Pagefind 1.5.2:

1. the CLI reports each built language index's `index.word_count`;
2. the language index assigns `word_count = word_map.len()`;
3. `word_map` is the merged index-key map built from page body word data and Pagefind
   metadata word data;
4. each input word is punctuation-stripped, lowercased, diacritic-normalised where
   applicable and stemmed for the language before becoming an index key;
5. compound parts and emoji may create additional index keys.

The figure is therefore the number of distinct normalised/stemmed index keys across the
English-language index, including searchable Pagefind metadata. It is not a per-page or
site-wide occurrence count, and Pagefind does not apply a stop-word removal list in this
code path.

Supporting Pagefind 1.5.2 implementation:

- [`pagefind/src/lib.rs` lines 249–279](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind/src/lib.rs#L249-L279)
  prints and totals `index.word_count`.
- [`pagefind/src/index/mod.rs` lines 215–255](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind/src/index/mod.rs#L215-L255)
  adds Pagefind metadata terms to the same per-page word map.
- [`pagefind/src/index/mod.rs` lines 324–346 and 462–464](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind/src/index/mod.rs#L324-L346)
  merges the page maps and sets the reported count to `word_map.len()`.
- [`pagefind/src/fossick/splitting.rs` lines 19–109](https://github.com/Pagefind/pagefind/blob/v1.5.2/pagefind/src/fossick/splitting.rs#L19-L109)
  defines term normalisation, stemming, compound-part and emoji handling.

## Independent counts

The audit parses clean generated HTML independently of Pagefind. It starts at the one
`main[data-pagefind-body]` on each approved page; removes the selectors in
`pagefind.yml`; removes Pagefind's built-in non-content elements such as `script`,
`style`, `nav`, `footer`, `form`, `svg`, `iframe` and `template`; ignores hidden and
`aria-hidden="true"` descendants; decodes HTML entities; and counts Unicode letter or
number tokens with internal apostrophes, full stops or hyphens.

For the distinct comparison, tokens are Unicode NFKD-normalised, combining marks are
removed, case is folded using the Australian English locale, and typographic apostrophes
and dashes are canonicalised. This deliberately does not reproduce Pagefind stemming.

| Scope | Word occurrences |
| --- | ---: |
| Guide searchable `main` elements, including the searchable article headers | 187,684 |
| Guide `article.content` elements only | 184,254 |
| Intended category searchable content | 4,281 |
| Combined intended searchable content | 191,965 |
| Distinct independently normalised vocabulary | 7,333 |

## Generated-HTML boundary result

All 114 generated active guides have:

- exactly one `main[data-pagefind-body]`;
- one complete article header and one complete `article.content` inside that main;
- all substantive paragraphs, tables, lists, checklists and FAQ blocks inside the
  Pagefind body;
- no `data-pagefind-ignore` covering substantive content;
- non-empty `title`, `description`, `category`, `content_type`, `image` and `image_alt`
  Pagefind metadata.

The configured exclusions cover only breadcrumbs, article publication metadata,
related-guide links, previous/next guide navigation, category guide collections and
nearby-category navigation. No `.content`, article slot, table, list, safety note or FAQ
is covered by an exclusion.

## Real-index proof

`scripts/audit-pagefind-content.mjs` starts a loopback static server for the completed
`dist`, imports the generated `dist/pagefind/pagefind.js`, creates a no-worker Pagefind
instance against the generated binary index, and searches that real index.

For every active guide, the test:

- derives visible substantive prose from generated `article.content`;
- divides its word positions into opening, middle and final thirds;
- selects a unique one-to-five-word phrase that is absent from every result metadata
  field;
- searches the phrase through Pagefind;
- requires the correct route, loadable result data and the phrase in indexed result
  content;
- compares expected and indexed word volume, headings, FAQ inclusion and a dense set of
  content checkpoints.

The completed run executed:

- 114 opening guide probes;
- 114 middle guide probes;
- 114 final guide probes;
- 10 category prose probes;
- 36 fixed deep-phrase contracts across 12 manually reviewed guides.

All 388 API probes passed. The fixed set covers Kitchen, Laundry, Bathroom, Bedroom,
Living Spaces, Home Office, Pets, Nursery & Kids, Garage Storage, Outdoor & Garden, a
winter seasonal guide and the Australian Made Home Gift Ideas guide.

## Twelve-guide indexed-content comparison

The independently counted intended Pagefind body and Pagefind result `content` are nearly
identical. Small count differences are caused by Pagefind's sentence and table-cell
serialisation, not missing sections.

| Representative guide | Intended words | Indexed words | Non-contiguous checkpoints | FAQ |
| --- | ---: | ---: | ---: | --- |
| Fridge Dimensions Australia | 946 | 943 | 1 / 104 | Indexed |
| Heat Pump vs Condenser vs Vented Dryers | 1,043 | 1,039 | 2 / 97 | Indexed |
| Bathroom Storage: What to Measure | 1,503 | 1,499 | 0 / 148 | Indexed |
| Mattress Sizes Australia | 1,137 | 1,135 | 2 / 97 | Indexed |
| Sofa and Seating Layout | 939 | 939 | 0 / 71 | Indexed |
| Home Office Desk Setup | 3,157 | 3,157 | 0 / 236 | Indexed |
| Pet Feeding Station Ideas | 1,294 | 1,294 | 0 / 105 | Indexed |
| Nursery Storage for Small Rooms | 1,421 | 1,418 | 1 / 168 | Indexed |
| Garage Storage: What to Measure | 1,554 | 1,552 | 0 / 138 | Indexed |
| Outdoor Shade Setup | 2,552 | 2,552 | 0 / 334 | Indexed |
| Condensation and Mould During Winter | 2,418 | 2,415 | 0 / 303 | No FAQ on page |
| Australian Made Home Gift Ideas | 860 | 860 | 0 / 75 | Indexed |

Across the full guide set, all 98 rendered FAQ blocks are indexed. FAQs should remain
searchable: they contain direct natural-language answers that complement the main guide,
while the existing exclusions already prevent repetitive navigation from polluting
results.

## Ranking and snippets

The realistic-query contracts cover fridge delivery access, winter condensation and
mould, induction cookware bases, cordless-vacuum runtime, mattress dimensions, fixed
wiring and electricians, outdoor shade, nursery storage, garage clearances and pet
feeding zones.

Every intended guide ranked first in the clean-index run. Guide results remained ahead of
category pages; category pages did not dominate any top five; body-only terms retrieved
the correct guides; and snippets came from relevant article passages. No ranking change
is justified.

## Permanent regression gate

Run the focused test after Pagefind indexing:

```text
npm run audit:search:content
```

The normal production build now runs it immediately after `npm run index:search`.
The test fails for missing generated routes or metadata, incorrect body boundaries,
substantive exclusions, absent third-of-article probes, metadata-only matches, wrong
result URLs, unloaded result data, missing FAQs or headings, material expected/indexed
coverage divergence, failed fixed contracts, or demonstrated ranking regressions.
