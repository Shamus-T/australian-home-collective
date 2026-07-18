# Fridge Fit & Delivery Planner — Functional Specification

| Field | Value |
| --- | --- |
| Version | 1.1 |
| Status | Parked reference; no prototype or public route planned |
| Document type | Internal functional specification |
| Owner | Australian Home Collective |
| Version date | 19 July 2026 |
| Formerly proposed public route | `/planning-centre/fridge-fit-delivery-planner/` |

> **Parking note — 19 July 2026:** This specification is retained only as historical research. The prototype was discarded, the route was never published and implementation is not an active priority. A future proposal must be reconsidered from first principles rather than treating this specification as approved work.

## Original product summary

The Fridge Fit & Delivery Planner helps an Australian household compare a refrigerator's dimensions and model-specific clearances with the intended cavity and the measurable parts of the delivery route.

It identifies:

- definite conflicts in the measurements entered;
- missing product, clearance or access information;
- simple straight-opening comparisons;
- door, drawer, service and ventilation checks still requiring confirmation; and
- route features that need the retailer or delivery provider to assess.

The planner does **not** guarantee cavity fit, delivery, installation, safe handling, ventilation performance, service suitability or compliance with any provider policy.

## Decision record

| Criterion | Assessment |
| --- | --- |
| Solves a real problem | Yes — cavity-only measurement misses delivery and operating constraints. |
| Improves planning | Yes — it combines product, cavity, clearance and route checks in one report. |
| Builds trust | Yes, if results remain transparent and bounded. |
| Has lasting value | Yes — logic is brand-neutral and not tied to a product catalogue. |
| Commercially responsible | Yes — useful without retailer or affiliate links. |
| Meets editorial standards | Yes, subject to this specification and the Tool Development Standard. |
| Risks can be managed | Yes, by avoiding guarantees and escalating complex access. |
| Suitable for Australian readers | Yes — millimetres, Australian terminology and local delivery context. |
| Maintenance is realistic | Yes, with no model database in the first release. |

## Governing requirements

This tool must comply with:

- the [Tool Development Standard](tool-development-standard.md);
- the [Publishing Standards Manual](../governance/publishing-standards-manual.md);
- the [Retail Knowledge Base](../knowledge/retail-knowledge-base.md), especially RKB-001 to RKB-008 and RKB-903;
- the [Corrections & Content Review Policy](../editorial/corrections-content-review-policy.md); and
- the [Fridge Fit & Delivery Planner Test Plan](fridge-fit-delivery-planner-test-plan.md).

## Audience and primary use case

The primary user is comparing a specific refrigerator with a real kitchen and delivery route before ordering.

The user should have access to:

- the current model page, specification sheet or installation manual;
- product dimensions;
- model-specific ventilation and installation clearances;
- packaged dimensions if the route is restricted;
- a tape measure; and
- the retailer or delivery provider's current access requirements.

## Product principles

1. **Model-specific information wins.** The tool supplies no generic ventilation default.
2. **Unknown is a valid answer.** Missing information creates a next action, not a guessed value.
3. **Show the arithmetic.** Users can see what was compared and the remaining or missing space.
4. **Separate fit from delivery.** A favourable cavity comparison cannot override a route concern.
5. **Complex access stays complex.** Turns, stairs, lifts, landings, slopes and removal of appliance parts require manual confirmation.
6. **No favourable guarantee.** The strongest positive wording is `No conflict found in the simple checks completed.`
7. **No product catalogue in version 1.** Users enter current source values; AHC does not maintain model specifications.

## Out of scope for version 1

- product recommendations, prices, stock or affiliate links;
- automatic model lookup or scraping;
- photographic measurement or augmented reality;
- three-dimensional turn, stair or tilt simulation;
- weight, floor-load or manual-handling assessment;
- checking electrical, plumbing, water-pressure or cabinetry compliance;
- deciding whether doors, handles, hinges or packaging may be removed;
- booking delivery or sending details to a retailer;
- storing a home address or precise location;
- cloud accounts, saved projects or shareable result URLs; and
- professional installation or site approval.

## Experience outline

### Step 0 — Before you start

Display:

- the purpose and limitations;
- the information needed;
- a reminder to use current manufacturer and provider information; and
- a choice of millimetres or centimetres, with millimetres selected by default.

Primary action: `Start the planner`.

### Step 1 — Fridge measurements

Required:

- product width;
- product height; and
- product depth.

Recommended:

- brand and model reference as a private on-page note;
- source checked (`manufacturer page`, `installation manual`, `retailer listing`, `other`);
- date the source was checked; and
- confirmation that handles, hinges and other stated projections are included or separately accounted for.

Delivery configuration:

- `Packaged dimensions` — recommended where packaging must remain on;
- `Unpackaged dimensions` — only after provider confirmation; or
- `Manufacturer-confirmed reduced configuration` — only where current manufacturer information and the provider confirm removal or preparation.

For packaged or confirmed reduced configurations, collect width, height and depth separately. The user must actively confirm the basis; the tool must not infer it.

### Step 2 — Cavity and model clearances

Collect the narrowest measured:

- cavity width;
- cavity height; and
- maximum acceptable depth from the most restrictive rear projection to the chosen front limit.

Collect model-specific requirements:

- left clearance;
- right clearance;
- top clearance; and
- rear clearance.

Each clearance supports `I have not found this yet`. No generic value is prefilled.

Prompt the user to measure at more than one point and enter the narrowest value. Ask whether skirting, an uneven wall, a power point, plug, pipe, valve or water connection reduces the usable space. `Yes` or `unsure` creates a manual check even when the entered depth comparison is favourable.

### Step 3 — Everyday operation

Collect or confirm:

- adjacent wall or cabinet on the left: `yes`, `no`, `unsure`;
- adjacent wall or cabinet on the right: `yes`, `no`, `unsure`;
- island, bench or obstruction in front: `yes`, `no`, `unsure`;
- manufacturer door-opening diagram checked: `yes`, `not found`, `not yet`;
- stated left-side operating clearance and available clearance, when applicable;
- stated right-side operating clearance and available clearance, when applicable;
- stated front drawer/door clearance and available clearance, when applicable;
- internal shelves, crisper bins or freezer drawers can be removed at the planned opening angle: `confirmed`, `not confirmed`, `not applicable`; and
- plumbing or fixed electrical work required: `yes`, `no`, `unsure`.

The tool may compare a required operating clearance with an available measurement. It must not calculate a door arc from appliance width or assume that 90 degrees provides full internal access.

### Step 4 — Delivery basis and provider check

Ask:

- which dimension set the provider requires for the route;
- whether the provider has confirmed that packaging may be removed before the restricted section;
- whether appliance doors or handles may be removed;
- whether the appliance must remain upright; and
- whether difficult access has been disclosed to the provider.

If any answer is unknown, the result must contain a provider-confirmation action. A reduced configuration is never used in the main route comparison until it is explicitly confirmed.

### Step 5 — Delivery route

Allow 1 to 12 ordered route stages. Each stage has:

- a user label, for example `front security door` or `hallway to kitchen`;
- type: door/gate, straight hallway, lift, stairs, landing, turn/corner or other;
- narrowest clear width;
- lowest clear height;
- whether a turn or change of direction is required at or immediately after the stage;
- whether a door, gate, handrail or other confirmed removable obstruction affects the measurement;
- measurement confidence: `measured`, `estimated`, `unknown`; and
- an optional plain-text note.

For lifts, stairs, landings, turns and any estimated or unknown stage, the planner must require provider confirmation regardless of the numeric comparison.

Route measurements are clear openings, not nominal door sizes. The instruction should remind users to measure between the actual limiting surfaces, including handles, closers, frames, rails or other projections.

### Step 6 — Results and next actions

Results appear in this order:

1. overall summary;
2. conflicts found;
3. missing information;
4. provider or installer checks;
5. cavity calculation;
6. everyday-operation checks;
7. delivery-route stages;
8. measurement and source summary;
9. limitations; and
10. actions to edit, print or start again.

## Data contract

The implementation must preserve the difference between `unknown`, a confirmed numeric zero and `not applicable`. An absent optional property must not be converted to zero.

The plain planner state should follow this shape, with all normalised measurement values stored in millimetres:

```text
PlannerState
  displayUnit: mm | cm
  product
    modelNote?: string
    sourceType?: manufacturer | manual | retailer | other
    sourceCheckedDate?: date
    projectionsAccountedFor: yes | no | unsure
    productDimensions: Dimensions
    packagedDimensions?: Dimensions
    reducedDimensions?: Dimensions
    reducedManufacturerConfirmed: boolean
    reducedProviderConfirmed: boolean
  cavity
    available: Dimensions
    clearances
      left: number | unknown
      right: number | unknown
      top: number | unknown
      rear: number | unknown
    restrictiveProjection: no | yes | unsure
  operation
    leftObstruction: no | yes | unsure
    rightObstruction: no | yes | unsure
    frontObstruction: no | yes | unsure
    doorDiagram: checked | not-found | not-yet
    left?: ClearancePair
    right?: ClearancePair
    front?: ClearancePair
    internalAccess: confirmed | not-confirmed | not-applicable
    fixedTradeWork: no | yes | unsure
  delivery
    basis: packaged | unpackaged | reduced
    packagingRemovalConfirmed: boolean
    appliancePartRemovalConfirmed: boolean
    uprightRequirement: confirmed | not-confirmed
    difficultAccessDisclosed: yes | no | not-applicable
  routeStages: RouteStage[1..12]

Dimensions
  width: number
  height: number
  depth: number

ClearancePair
  required: number | unknown
  available: number | unknown

RouteStage
  id: stable local identifier
  label: string
  type: door-gate | straight-hallway | lift | stairs | landing | turn-corner | other
  clearWidth: number | unknown
  clearHeight: number | unknown
  turnRequired: boolean
  removableObstruction: no | yes | unsure
  confidence: measured | estimated | unknown
  note?: string
```

The calculation layer returns structured data rather than finished HTML:

```text
PlannerResult
  overallState: conflict | incomplete | manual-check | no-simple-conflict
  conflicts: Finding[]
  missingInformation: Finding[]
  manualChecks: Finding[]
  cavityComparisons: Comparison[]
  operatingComparisons: Comparison[]
  routeResults: RouteResult[]

Comparison
  state: conflict | exact | positive-margin | incomplete | not-applicable
  required?: number
  available?: number
  margin?: number
  unit: mm

Finding
  code: stable machine-readable identifier
  publicMessage: approved bounded wording
  nextAction: string
  sourceStep: integer
```

Stable finding codes support tests and coarse aggregate analytics. They must not encode entered values, model notes or route labels.

## Units and normalisation

- Default display unit: millimetres.
- Optional display unit: centimetres.
- Internal calculation unit: millimetres.
- Centimetres convert to millimetres by multiplying by 10.
- Results display no more precision than the entered values justify.
- Changing the display unit converts existing values visibly; it does not reinterpret them.

Product, cavity, operating-space and route-opening dimensions must be finite numbers greater than zero. A manufacturer-stated clearance may be zero, but the user must actively enter it from the current model information; the tool never assumes zero. A value greater than 10,000 mm receives an implausible-value error and must be corrected or explicitly re-entered after an explanatory prompt. This validation guard is not a statement about maximum product or building dimensions.

## Calculation rules

### Cavity body and ventilation comparison

Only calculate an axis when all values for that axis are known.

```text
required cavity width = product width + left clearance + right clearance
width margin = measured cavity width - required cavity width

required cavity height = product height + top clearance
height margin = measured cavity height - required cavity height

required cavity depth = product depth + rear clearance
depth margin = maximum acceptable depth - required cavity depth
```

Interpret each margin:

- less than 0: `Conflict in the entered measurements`;
- equal to 0: `No spare measurement margin`;
- greater than 0: show the remaining entered margin; or
- unable to calculate: `More information needed`.

No automatic tolerance or safety buffer is added. The result explains that measurement error, floors, walls, cabinetry and specification conventions can change the practical outcome.

### Operating-clearance comparison

Where a model-specific required value and an available value are both entered:

```text
operating margin = available operating clearance - required operating clearance
```

Use the same conflict, exact and positive-margin interpretation. If the manufacturer's diagram is not confirmed, the section remains `More information needed` even if one operating measurement is favourable.

### Straight-opening route comparison

Use the selected, confirmed transport dimension set.

While the appliance remains upright, calculate two simple orientations for each stage:

```text
front-first width margin = stage clear width - transport width
side-first width margin = stage clear width - transport depth
height margin = stage clear height - transport height
```

An orientation has no simple cross-section conflict only when its width margin and the height margin are both zero or positive.

The result must show both orientations where useful. It must not select an orientation as deliverable because approach room, turning room, weight, grip, packaging, projections and provider practices are not assessed.

If both upright orientations have a negative width or height margin, report a definite conflict in the entered straight-opening measurements.

### Complex-route rule

The following always create `Provider or installer check needed`:

- a turn or change of direction;
- stairs or a landing;
- a lift;
- a slope, uneven surface or restricted approach noted by the user;
- an estimated or unknown measurement;
- a route relying on removal of a door, gate, handrail, appliance part or packaging;
- an unconfirmed transport orientation; or
- any provider requirement that is unknown.

Numeric comparisons may still be shown, but they cannot remove the manual-check status.

## Result states and precedence

### Section states

1. `Conflict in the entered measurements`
2. `More information needed`
3. `Provider or installer check needed`
4. `No conflict found in this simple check`
5. `Not applicable`

### Overall state precedence

1. If any definite conflict exists: `One or more measurement conflicts need attention.`
2. Otherwise, if required information is missing: `More information is needed before you rely on these checks.`
3. Otherwise, if any complex or provider check exists: `The measurements entered show no simple conflict, but delivery or installation still needs confirmation.`
4. Otherwise: `No conflict was found in the simple checks completed.`

Every overall state is followed by:

> This is a planning check, not a delivery guarantee, installation approval or safety assessment. Confirm the current model requirements and any difficult access with the manufacturer, retailer or delivery provider before ordering.

## Required result language

### Conflict example

`The required width from the values entered is 934 mm. The narrowest cavity width entered is 920 mm, leaving a 14 mm conflict.`

### Missing-information example

`The model's rear clearance has not been entered, so the depth comparison is incomplete. Check the current installation instructions for the exact model.`

### Complex-route example

`The hallway-to-kitchen stage includes a turn. The straight width and height checks do not assess the turning space. Send the route measurements and photos requested by your delivery provider before ordering.`

### Favourable example

`No conflict was found in this straight-opening comparison using the dimensions entered. This does not confirm that the appliance can be manoeuvred through the complete route.`

## Validation and error handling

- Validate on step submission and after a user revisits an edited field.
- Do not show errors before the user has interacted with a step.
- Place an error summary at the start of the step and link each item to its field.
- Preserve valid entries when a field or step contains an error.
- Identify the field and the correction in text.
- Do not calculate a favourable overall state from partial or invalid data.
- If client-side code fails, show the introductory limitations and a static measurement checklist; do not show stale results.

## Accessibility requirements

- Target WCAG 2.2 Level AA.
- Use one visible `h1`, logical headings and an ordered step indicator.
- Use native number inputs with a text-compatible fallback where mobile decimal entry is unreliable.
- Keep the unit visible in the label and adjacent to the value.
- Use fieldsets for dimension groups and radio choices.
- Associate help and errors using `aria-describedby`.
- Move focus to the error summary after a failed step submission.
- Announce the overall result heading once through a polite live region.
- Do not announce every recalculation while the user types.
- Ensure add/remove/reorder route-stage controls are keyboard accessible and have specific names.
- Preserve a logical DOM order at every breakpoint.
- Ensure results, warnings and margins remain understandable without colour or icons.
- Support 200% zoom, narrow screens and print.

## Privacy and data handling

Version 1 processes all entries in the browser.

- No account, address, email or phone number is requested.
- No raw measurement, model note, route note or result is sent to AHC analytics.
- No input is placed in the URL.
- No entry is persisted after the tab is closed.
- Print uses the browser's print function.
- A future download or local-save feature requires a separate review.

Allowed analytics events are limited to:

- planner started;
- step completed, identified only by step number;
- result generated;
- coarse overall result category;
- print selected; and
- reset selected.

Analytics must not include dimension values, free text, model identifiers, route labels or combinations that could reconstruct them.

## Print summary

The A4 print view contains:

- AHC and tool name;
- tool version and assessment date;
- overall status and limitation statement;
- model note if the user entered one;
- selected dimension basis;
- cavity measurements and formulas;
- operating checks;
- route-stage table;
- missing information and next actions;
- source-check date entered by the user; and
- the live tool URL.

Navigation, step controls and analytics UI are omitted. Warnings must not depend on background colour.

## Technical design direction

The preferred version 1 implementation is:

- an Astro page with server-rendered introduction and limitations;
- progressively enhanced native HTML forms;
- small framework-free ECMAScript modules with JSDoc type contracts;
- pure calculation functions with no DOM access;
- immutable normalised planner state passed to the calculation layer;
- no external API or product database;
- no third-party runtime dependency for core calculations; and
- Node's built-in test runner, with no runtime or test-framework dependency; and
- a `test:fridge-planner` package script added to the publishing workflow before the site build.

Suggested module boundaries:

```text
src/lib/fridge-planner/units.mjs       unit conversion and numeric validation
src/lib/fridge-planner/cavity.mjs      cavity and operating comparisons
src/lib/fridge-planner/route.mjs       straight-opening comparisons and complex-route flags
src/lib/fridge-planner/results.mjs     severity aggregation and public result messages
src/lib/fridge-planner/state.mjs       browser-only form state and reset
src/lib/fridge-planner/print.mjs       print preparation only
tests/fridge-planner/*.test.mjs        Node unit and contract tests
```

The result engine must accept plain data and return plain structured results so the same fixtures can test calculations, interface rendering and printed summaries.

## Acceptance criteria

The prototype is complete when:

- all six steps can be completed by keyboard on mobile and desktop;
- dimensions can be entered in millimetres or centimetres and are normalised correctly;
- model-specific clearances have no generic defaults;
- cavity width, height and depth calculations show their inputs and margins;
- straight route stages show front-first, side-first and height comparisons;
- complex stages always retain a provider-check status;
- missing information cannot produce the favourable overall state;
- reduced or unpackaged dimensions cannot be used without explicit confirmation;
- no result says or implies that delivery, installation or safe fit is guaranteed;
- edit, reset and print flows work without losing unrelated entries;
- raw measurements and notes are absent from analytics and URLs;
- automated tests in the test plan pass;
- the complete site build and publishing audits pass; and
- public launch gates in the delivery plan are satisfied.

## Public launch dependencies

- approved tool-specific disclaimer wording;
- review of Terms of Use for interactive tools;
- accessibility review with at least one desktop and one mobile screen-reader path;
- final content and source verification;
- analytics inspection in the deployed environment;
- documented disable/rollback method; and
- named maintenance owner and review trigger.

## Source register

Sources were checked on 18 July 2026. They support the need for model-specific clearances, complete route measurement, door/drawer checks and provider confirmation; they do not supply universal planner defaults.

| Source | Relevance |
| --- | --- |
| [LG Australia — Fridge Freezer Installation Guide](https://www.lg.com/au/appliances/installation-guide/fridge-freezer/) | Model and pathway checks; manufacturer instructions remain controlling. |
| [Westinghouse Australia — Fridge Buying Guide](https://www.westinghouse.com.au/buying-guides/fridges-buying-guide/) | Cavity, ventilation, door direction and delivery-route considerations. |
| [Fisher & Paykel — Refrigeration Planning Guide](https://www.fisherpaykel.com/on/demandware.static/-/Sites-fpa-master-catalog/default/dw1041a120/DesignPlanning-FisherPaykelAU/FP-PlanningGuide-en-RS4621-RS6121-RS7621-RS9121-IntegratedRefrigeration-0-90003524F-AU-NZ-UK-IE-EU-CN-ASIA-SG.pdf) | Demonstrates model-specific door clearances, opening depths and limits of planning diagrams. |
| [Appliances Online — Fridge Buying Guide](https://www.appliancesonline.com.au/article/fridge-buying-guide-six-important-things-to-know/) | Cavity, ventilation, door swing and route-measurement prompts. |
| [Appliances Online — Delivery FAQ](https://www.appliancesonline.com.au/article/faq/) | Difficult access remains subject to the delivery team's site assessment. |
| [W3C — Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/) | Accessibility target, labels, errors, focus and input assistance. |
| [W3C WAI — Form Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/) | Accessible error and result messaging. |

## Version history

| Version | Date | Summary |
| --- | --- | --- |
| 1.0 | 18 July 2026 | Initial build-ready specification and bounded result model. |
