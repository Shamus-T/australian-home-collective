# Fridge Fit & Delivery Planner — Delivery Plan

| Field | Value |
| --- | --- |
| Version | 1.1 |
| Status | Parked; not an active priority |
| Document type | Internal delivery roadmap |
| Owner | Australian Home Collective |
| Version date | 19 July 2026 |

## Parking decision

This project was parked on 19 July 2026 before public release. The prototype was discarded and no public route exists.

The proposed planner asked readers to complete too much technical and delivery-assessment work for a narrow purchase decision. A fridge-specific feature is also a lower priority than improving existing content using actual search and visitor performance.

The remaining document is historical reference, not approved work. Do not resume implementation unless new evidence demonstrates a clear reader need, the scope can be materially simpler and the proposal passes the Editorial Decision Framework again.

## Original objective

Deliver a trustworthy, accessible first version of the Fridge Fit & Delivery Planner at `/planning-centre/fridge-fit-delivery-planner/` without introducing a product database, false delivery certainty or collection of household measurement data.

The delivery sequence follows the [Functional Specification](../tools/fridge-fit-delivery-planner-functional-spec.md), [Test Plan](../tools/fridge-fit-delivery-planner-test-plan.md) and [Tool Development Standard](../tools/tool-development-standard.md).

## Status when parked

| Area | Status |
| --- | --- |
| Reader problem and scope | Complete |
| Knowledge-base inputs | Complete for prototype |
| Functional logic | Specified |
| Result language | Specified; legal review still required for public launch |
| Test plan | Complete |
| Technical prototype | Not started |
| Accessibility review | Not started |
| Public route and Planning Centre | Not started |
| Launch and monitoring | Not started |

The phases below are preserved as historical planning only. Their individual status labels do not authorise implementation.

## Phase 0 — Foundation and release boundaries

**Status:** Complete.

Deliverables:

- tool decision record;
- shared Tool Development Standard;
- functional specification;
- test plan;
- current source register;
- privacy-minimised version 1 scope; and
- explicit public launch dependencies.

Exit criteria:

- no unresolved decision changes the core data model or result states;
- complex routes are excluded from automatic approval; and
- no product catalogue or server storage is required.

## Phase 1 — Calculation engine

**Status:** Ready.

Work:

1. Define plain-data ECMAScript modules with JSDoc contracts for dimensions, cavity, operating checks, route stages and results.
2. Implement unit conversion and numeric validation as pure functions.
3. Implement cavity and operating-clearance comparisons.
4. Implement front-first, side-first and height route comparisons.
5. Implement complex-route flags and result precedence.
6. Implement public result-message mapping separately from numeric logic.
7. Add automated tests for every unit, cavity, route and aggregation case in the test plan.
8. Add `npm run test:fridge-planner` to the publishing workflow before the production build.

Exit criteria:

- all domain tests pass without a browser;
- no calculation function reads or writes the DOM;
- no favourable state can be produced from incomplete or invalid data; and
- prohibited guarantee language is absent from message fixtures.

## Phase 2 — Accessible prototype interface

**Status:** Pending Phase 1.

Work:

1. Create the Astro route as `noindex,follow` and keep it out of the sitemap.
2. Publish server-rendered purpose, preparation and limitation content.
3. Build the six-step progressively enhanced form.
4. Add unit switching, error summaries and edit/reset flows.
5. Add ordered route-stage controls with a 12-stage limit.
6. Render structured results from the calculation engine.
7. Add A4 print styling and tool version details.
8. Add coarse analytics events with no measurement or note values.
9. Add relevant links to kitchen guides, public editorial policies and corrections reporting.

Exit criteria:

- prototype acceptance criteria pass in local and production builds;
- keyboard-only completion works;
- JavaScript failure leaves the introduction and static checklist available;
- no planner data appears in URLs, storage or analytics; and
- print output contains every required section.

## Phase 3 — Quality, accessibility and risk review

**Status:** Pending Phase 2.

Work:

1. Run the complete automated test plan.
2. Test the supported browser and responsive matrix.
3. Complete NVDA and VoiceOver paths.
4. Review result wording against current manufacturer and provider sources.
5. Inspect production analytics payloads.
6. Complete editorial review and obtain the required legal review of the tool-specific limitations and Terms of Use coverage.
7. Document the disable and rollback procedure.
8. Record known limitations and accepted low-risk defects.

Exit criteria:

- no release blocker remains;
- public wording is approved;
- live analytics are data-minimised;
- rollback is tested; and
- an owner and review trigger are recorded.

## Phase 4 — Controlled public release

**Status:** Pending Phase 3.

Work:

1. Remove `noindex` only after all gates pass.
2. Add the canonical route to the sitemap.
3. Add the tool to the Planning Centre and relevant kitchen pages.
4. Deploy and run the live smoke test.
5. Monitor browser errors, coarse completion events and reader feedback.
6. Record the released commit, tool version and source-review date.

Release posture:

- describe version 1 as a planning aid, not a beta that excuses inaccurate output;
- keep feedback and corrections easy to find;
- avoid paid promotion until live behaviour has been observed; and
- withdraw or disable the result if a material logic or privacy problem appears.

## Phase 5 — Review before expansion

Potential additions are considered only after version 1 is stable:

- local JSON download or browser-local save;
- printable blank route-measurement sheet;
- optional photos processed locally in the browser;
- retailer-specific handoff summaries;
- a maintained product-data source; or
- more advanced turn visualisation.

Each addition requires a new decision record. Uploads, accounts, cloud storage, product databases and geometric simulation require separate privacy, accuracy and maintenance assessment.

## Dependencies

| Dependency | Needed by | Owner/action |
| --- | --- | --- |
| Functional specification v1.0 | Phase 1 | Complete. |
| Test plan v1.0 | Phase 1 | Complete. |
| Tool-specific limitation review | Public release | Editorial plus appropriately qualified Australian legal review. |
| Terms of Use interactive-tool coverage | Public release | Legal review. |
| Planning Centre route and navigation | Phase 4 | Site implementation. |
| Accessibility test devices/software | Phase 3 | Confirm availability before prototype sign-off. |
| Disable/rollback mechanism | Phase 3 | Document and test in deployment workflow. |

## Risk register

| Risk | Effect | Control | Residual posture |
| --- | --- | --- | --- |
| User treats result as a fit guarantee | Failed purchase or delivery expectation | Bounded result states, repeated limitation, no `pass` label. | Monitor feedback and wording. |
| Generic clearance used for a specific model | Performance or installation issue | No defaults; require current model values or mark unknown. | Source review remains necessary. |
| Simple doorway maths misses a turn | Misleading route result | Complex-route flag always requires provider confirmation. | No 3D claim in version 1. |
| Packaged dimensions are unavailable | Route result incomplete | Make packaging basis explicit and request provider confirmation. | Accept incomplete result rather than guess. |
| Removal of doors/handles is assumed | Damage, delay or service conflict | Reduced configuration ignored until manufacturer and provider confirmations are recorded. | Provider remains controlling. |
| Measurement error or uneven surfaces | Margin overstated | Show exact entered margin and explain measurement limitations; no unexplained tolerance. | User remains responsible for accurate measurement. |
| Raw household data reaches analytics | Privacy breach | Browser-only processing and coarse event allow-list. | Inspect deployed network traffic. |
| Dynamic form is inaccessible | Users cannot complete or understand the tool | Native controls, WCAG 2.2 AA target, manual screen-reader tests. | Retest shared UI changes. |
| Logic regression after release | Incorrect results | Pure functions, fixture coverage, CI and full regression triggers. | Disable/rollback path required. |
| Source or provider practice changes | Outdated prompts | Source register and event-based review. | Do not imply provider universality. |

## Review triggers

Review the specification, tests and public tool when:

- a manufacturer or delivery provider materially changes relevant guidance;
- reader feedback identifies a missing common route or cavity issue;
- a calculation or wording correction is made;
- analytics, storage or third-party scripts change;
- browser support or accessibility standards change materially;
- the tool is connected to product or retailer data; or
- 12 months have passed since the last substantive review.

Dates must not be advanced without a genuine review.

## Definition of done

Version 1 is done only when it is:

- useful without commercial links;
- accurate within its explicitly limited comparisons;
- understandable without technical knowledge;
- operable by keyboard and supported screen readers;
- private by default;
- printable;
- tested in the live environment;
- reversible if a material issue appears; and
- owned for ongoing correction and review.

## Version history

| Version | Date | Summary |
| --- | --- | --- |
| 1.0 | 18 July 2026 | Initial phased delivery plan, dependencies and risk controls. |
