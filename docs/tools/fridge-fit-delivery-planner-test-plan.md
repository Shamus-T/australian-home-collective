# Fridge Fit & Delivery Planner — Test Plan

| Field | Value |
| --- | --- |
| Version | 1.1 |
| Status | Parked reference; no implementation under test |
| Document type | Internal quality-assurance plan |
| Owner | Australian Home Collective |
| Version date | 19 July 2026 |
| Specification under test | [Parked Functional Specification v1.1](fridge-fit-delivery-planner-functional-spec.md) |

> **Parking note — 19 July 2026:** No fridge-planner implementation or automated test suite exists. This plan is retained only with the parked specification and must not be treated as an active release requirement.

## Purpose

This plan verifies the Fridge Fit & Delivery Planner's calculations, result precedence, safety boundaries, accessibility, privacy and presentation before public release and after material changes.

Passing examples demonstrate software behaviour only. They are not real delivery or installation approvals.

## Test levels

1. **Unit tests** — conversion, validation, comparisons and result aggregation.
2. **Component tests** — form state, step validation, route-stage controls and rendering.
3. **Built-output tests** — metadata, links, privacy markers and production assets.
4. **Manual accessibility tests** — keyboard, zoom, screen readers and print.
5. **Live smoke tests** — deployed page, client startup, analytics minimisation and rollback path.

Automated domain tests use Node's built-in test runner and live under `tests/fridge-planner/*.test.mjs`. The implementation adds `npm run test:fridge-planner` and runs it in the publishing workflow before the production build.

## Supported test matrix

At prototype sign-off, test the current stable versions available to AHC of:

- Chrome on Windows and Android;
- Edge on Windows;
- Firefox on Windows;
- Safari on macOS;
- Safari on iOS; and
- at least one Chromium-based Android browser.

Screen-reader paths:

- NVDA with Firefox or Chrome on Windows; and
- VoiceOver with Safari on iOS or macOS.

Responsive widths must include 320 px, 375 px, 768 px, 1024 px and a desktop viewport of at least 1280 px. Also test browser zoom at 200%.

## Canonical fixture

Use this fictional base fixture unless a test overrides it:

```text
product: 900 W × 1790 H × 700 D mm
clearances: 20 left, 20 right, 30 top, 50 rear mm
cavity: 960 W × 1840 H × 780 D mm
transport basis: packaged, confirmed
package: 940 W × 1870 H × 760 D mm
straight front door: 980 W × 2050 H mm
straight hallway: 1000 W × 2100 H mm
```

Expected cavity margins:

- width: 20 mm;
- height: 20 mm; and
- depth: 30 mm.

Fixture labels must remain visibly fictional in test reports.

## Unit and validation tests

| ID | Scenario | Expected result |
| --- | --- | --- |
| UNIT-001 | 90 cm converted to millimetres | 900 mm. |
| UNIT-002 | 900 mm converted to centimetres | 90 cm without changing the normalised value. |
| UNIT-003 | Switch units with populated fields | Values convert visibly; they are not reinterpreted. |
| VAL-001 | Blank required product width | Field error and no result calculation. |
| VAL-002 | Zero product, cavity or route-opening dimension | Text error explaining that the value must be greater than zero. |
| VAL-003 | Negative value | Text error; value excluded from calculations. |
| VAL-004 | Non-numeric text | Text error associated with the field. |
| VAL-005 | Infinite or non-finite programmatic value | Rejected by the domain layer. |
| VAL-006 | More than 10,000 mm | Implausible-value guard shown; no silent acceptance. |
| VAL-007 | Decimal centimetres | Converts deterministically to millimetres. |
| VAL-008 | Unknown clearance | Axis is incomplete and produces `More information needed`. |
| VAL-009 | `Not applicable` offered for a required ventilation clearance | Control must not permit it. |
| VAL-010 | Free-text note contains HTML or script text | Rendered as text; no execution or HTML injection. |

## Cavity calculation tests

| ID | Scenario | Expected result |
| --- | --- | --- |
| CAV-001 | Canonical fixture | Required values and positive margins match the fixture. |
| CAV-002 | Required width is 1 mm greater than cavity | Width conflict of 1 mm. |
| CAV-003 | Required width equals cavity | `No spare measurement margin`; not a guarantee. |
| CAV-004 | Width positive, height negative | Height conflict controls overall conflict status. |
| CAV-005 | Depth missing but width and height positive | Depth shown as incomplete; favourable overall state prohibited. |
| CAV-006 | Left and right clearances differ | Both are included separately in required width. |
| CAV-007 | All clearances entered as zero from a current source | Calculation accepts zero but records the source confirmation; no generic allowance added. |
| CAV-008 | Service projection is `unsure` | Manual check remains even when depth margin is positive. |
| CAV-009 | Unit mix converted before comparison | Same result as equivalent all-millimetre input. |
| CAV-010 | Edit product width after result | All affected margins and overall state update; unrelated route data remains. |

## Operating-clearance tests

| ID | Scenario | Expected result |
| --- | --- | --- |
| OPS-001 | Required left clearance 100 mm, available 120 mm | Positive margin of 20 mm, bounded language. |
| OPS-002 | Required front clearance 700 mm, available 650 mm | Conflict of 50 mm. |
| OPS-003 | Available value entered without model requirement | `More information needed`; no comparison. |
| OPS-004 | Manufacturer diagram not checked | Section cannot receive a complete favourable status. |
| OPS-005 | Internal bins not confirmed removable at planned angle | Specific next action displayed. |
| OPS-006 | Plumbing required | Qualified-provider action displayed; no plumbing instruction. |

## Delivery-basis tests

| ID | Scenario | Expected result |
| --- | --- | --- |
| BASIS-001 | Packaged basis and all packaged dimensions confirmed | Packaged dimensions used. |
| BASIS-002 | Packaged basis with packaged depth missing | Route assessment incomplete. |
| BASIS-003 | User selects unpackaged without provider confirmation | Main route assessment remains incomplete and asks for confirmation. |
| BASIS-004 | Reduced dimensions entered without manufacturer confirmation | Reduced set is ignored by the main result. |
| BASIS-005 | Manufacturer and provider confirmations both present | Reduced set may be compared but remains labelled as confirmed alternate configuration. |
| BASIS-006 | User changes the transport basis | Route results recalculate and the printed basis changes. |

## Straight-route calculation tests

| ID | Scenario | Expected result |
| --- | --- | --- |
| ROUTE-001 | Front-first width and height positive | No simple conflict for front-first orientation. |
| ROUTE-002 | Front-first fails, side-first passes | Both margins shown; no delivery guarantee. |
| ROUTE-003 | Both width orientations fail | Definite straight-opening conflict. |
| ROUTE-004 | Width passes but height fails | Definite conflict for both upright orientations. |
| ROUTE-005 | Width and height exactly equal | `No spare measurement margin`. |
| ROUTE-006 | Stage measured in centimetres | Correctly normalised before comparison. |
| ROUTE-007 | Estimated stage | Provider-check state remains even when numeric margins are positive. |
| ROUTE-008 | Unknown height | Incomplete stage; no favourable state. |
| ROUTE-009 | Turn required after a passing doorway | Provider-check state remains. |
| ROUTE-010 | Stage relies on removable security door | Provider-check state remains and names the dependency. |
| ROUTE-011 | Stairs with positive width and height | Provider-check state; no stair geometry claim. |
| ROUTE-012 | Lift with positive opening | Provider-check state; internal lift and provider rules remain unresolved. |
| ROUTE-013 | Twelve route stages | All retain order, unique labels and independent results. |
| ROUTE-014 | Attempt to add a thirteenth stage | Control explains the limit and does not corrupt state. |
| ROUTE-015 | Remove a middle stage | Remaining stages keep their data and are renumbered accessibly. |

## Result aggregation tests

| ID | Inputs | Expected overall state |
| --- | --- | --- |
| RESULT-001 | One conflict plus missing information | Conflict summary first; missing information still visible. |
| RESULT-002 | No conflict, one missing requirement | `More information is needed`. |
| RESULT-003 | Complete simple checks plus one turn | Delivery or installation confirmation required. |
| RESULT-004 | Complete simple checks, no complex flags | `No conflict was found in the simple checks completed.` |
| RESULT-005 | Invalid hidden step after later edits | Result is withdrawn until corrected. |
| RESULT-006 | All route stages removed | Delivery section incomplete, not favourable. |
| RESULT-007 | Exact margins only | No guarantee; exact-margin warnings remain prominent. |
| RESULT-008 | Client error during recalculation | No stale favourable summary remains visible. |

## Required-language tests

Search the rendered tool and result fixtures case-insensitively.

The following must not appear as an unqualified result:

- `will fit`;
- `safe to install`;
- `delivery approved`;
- `guaranteed`;
- `perfect fit`; or
- `delivery will succeed`.

Verify that every generated result contains the tool-specific limitation statement and a next action for each conflict, missing input or manual check.

## Form and state tests

- Step headings and progress are correct when moving forward and back.
- Browser back does not expose a stale result or discard state unexpectedly.
- Failed validation focuses the error summary and preserves valid values.
- Error-summary links focus the exact control.
- Editing from the result returns to the correct step.
- Reset requires confirmation, clears all entered values and returns to Step 0.
- Unit change preserves meaning across every dimension set and route stage.
- Adding and removing route stages does not duplicate element IDs.
- Refresh behaviour matches the documented non-persistence policy.
- The introductory content and limitations remain readable when JavaScript is disabled.

## Accessibility tests

### Keyboard

- Complete the planner without a pointer.
- Confirm visible focus for every interactive element.
- Confirm logical focus after step changes, validation, add/remove stage and result generation.
- Confirm no keyboard trap.
- Confirm print and reset are reachable and specifically named.

### Screen reader

- Page title, heading hierarchy and step indicator are meaningful.
- Every dimension announces its label, unit, requirement and error.
- Fieldsets announce the relevant group.
- Unknown choices are distinguishable from not applicable.
- Error summary and field errors are announced once and remain reviewable.
- Overall result is announced once; individual dynamic recalculations do not interrupt typing.
- Route stages have unique accessible names.
- Result states make sense without icons or colour.

### Visual and cognitive

- Text and controls remain usable at 200% zoom.
- No horizontal page scrolling at 320 CSS px, excluding intentionally scrollable data tables with an accessible alternative.
- Instructions are adjacent to the relevant inputs.
- Errors identify a correction, not only that something is wrong.
- The same information is not requested twice.
- Reduced motion does not remove information.

## Responsive and print tests

- Step layout works at every target width.
- Number inputs do not overflow on iOS or Android.
- Units remain visible beside values.
- Long model and route labels wrap without covering controls.
- Result cards preserve severity order on narrow screens.
- A4 portrait print includes every required summary section.
- Print never relies on background colour.
- Page breaks do not separate a result heading from its first measurement row where practical.
- Interactive controls and navigation are omitted from print.
- Tool version, assessment date and URL appear in print.

## Privacy and analytics tests

Inspect requests and analytics payloads in the built and deployed tool.

- Raw dimensions never leave the browser.
- Free-text notes and model identifiers never leave the browser.
- The URL never contains measurements or notes.
- Analytics contain only allowed coarse events.
- Analytics failure does not block calculation, editing, print or reset.
- Closing and reopening the page does not restore entries in version 1.
- No third-party script receives planner form values.

## Performance and resilience tests

- Core introductory content renders before client enhancement.
- Tool startup does not block the site's main navigation.
- Recalculation remains immediate with 12 route stages on a representative mid-range mobile device.
- Malformed persisted or programmatic state is rejected safely even though version 1 does not intentionally persist data.
- A calculation exception removes any stale favourable result and shows a recoverable error.
- The complete site remains usable if analytics are blocked.

## Built-output and publishing tests

- Production build succeeds.
- Existing site, commercial and dependency audits pass.
- The tool has a unique title, description, canonical URL and one H1.
- The tool appears in the sitemap only when approved for indexing.
- Draft or prototype routes use `noindex,follow` and are absent from the sitemap.
- Internal links to relevant kitchen guides and public policies resolve.
- Structured data describes only visible published content.
- The print stylesheet is loaded in production.
- No test fixture or debug text appears in public output.

## Live smoke test

After deployment:

1. Open the canonical tool URL in a fresh browser session.
2. Confirm the published version number.
3. Complete one positive-margin, one conflict and one complex-route fixture.
4. Confirm result precedence and exact limitation wording.
5. Edit one upstream value and confirm the result changes.
6. Print to PDF and inspect every page.
7. Inspect network requests for raw planner data.
8. Check browser errors on desktop and mobile.
9. Confirm the disable or rollback path can be executed by the maintainer.

## Release gate

Public release is blocked by any of the following:

- a failed calculation or severity test;
- any unqualified guarantee wording;
- missing manufacturer/provider source prompts;
- raw planner data in analytics, storage or URLs;
- an inaccessible required control or result;
- an unresolved critical or high-severity browser issue;
- failed site publishing checks;
- unapproved public limitation wording; or
- no documented owner and rollback path.

## Regression triggers

Run the full plan after changes to:

- units or validation;
- formulas or result precedence;
- public result or limitation wording;
- step structure or state management;
- route-stage behaviour;
- analytics, storage or printing;
- dependencies or browser support; or
- the site's shared form, layout or accessibility styles.

Content-only spelling corrections may use a targeted build and rendered-language check when they cannot affect logic or structure.

## Version history

| Version | Date | Summary |
| --- | --- | --- |
| 1.0 | 18 July 2026 | Initial calculation, accessibility, privacy and release test plan. |
