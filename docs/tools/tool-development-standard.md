# Australian Home Collective Tool Development Standard

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Active foundation |
| Document type | Internal product and publishing standard |
| Owner | Australian Home Collective |
| Version date | 18 July 2026 |

## Purpose

This standard governs interactive planning tools published by Australian Home Collective (AHC). It converts the publication's editorial commitments into requirements for product design, calculations, result language, accessibility, testing, release and maintenance.

It applies to calculators, planners, visualisers, decision aids and interactive checklists. A tool-specific functional specification and test plan may add stricter requirements but must not weaken this standard.

## Governing principle

> **AHC tools assist decisions; they do not replace professional judgement, current manufacturer requirements or site-specific assessment.**

A tool must reduce uncertainty without disguising uncertainty. It must not present an estimate as a measurement, a simple comparison as a complete assessment, or an assessment as an approval, guarantee, certification or professional service.

## Product approval

Before development begins, the proposal must pass the [Editorial Decision Framework](../governance/editorial-decision-framework.md). The decision record must confirm that the tool:

- solves a genuine Australian home-planning or buying problem;
- provides value beyond a static checklist;
- can explain its inputs, assumptions and limitations;
- has a realistic maintenance owner;
- can be tested without fabricated expertise; and
- does not require a level of legal, safety or technical assurance AHC cannot provide.

## Required documents

Every public tool requires:

1. a controlled functional specification;
2. a versioned test plan;
3. a delivery and maintenance plan;
4. a source register for material factual or technical assumptions;
5. approved tool-specific limitation wording;
6. a release record identifying the tested version; and
7. an incident, correction and withdrawal path.

## Scope and limitations

The opening section of a tool must state:

- the decision the tool helps with;
- what the tool assesses;
- what it does not assess;
- what the user needs before starting; and
- when the user should confirm details with a manufacturer, retailer, delivery provider, installer or appropriately qualified professional.

Limitations must be visible before data entry and repeated in context where a result could otherwise be misunderstood. A footer disclaimer alone is insufficient.

## Inputs

### Input quality

Each material input must have:

- a visible label;
- an expected unit or choice;
- concise instructions or an example;
- an explanation where the reason is not obvious;
- validation against missing, negative, zero, malformed or implausible values; and
- a clear way to mark information as unknown rather than encouraging a guess.

Inputs must distinguish among:

- a user measurement;
- a manufacturer specification;
- a provider requirement;
- a tool assumption; and
- an optional note.

The interface must not prefill a technical requirement with a generic value when the correct value is model-specific or provider-specific.

### Units and conversion

The tool must display the unit beside every measurement field. Unit conversion must be deterministic, tested and performed before calculations. The stored calculation unit must be documented in the functional specification.

Changing units must not silently reinterpret an existing value. The interface must either convert the value visibly or require confirmation before clearing it.

### Unknown and not applicable

`Unknown` and `not applicable` are different states. Unknown information must remain visible in the result as an unresolved check. `Not applicable` must only be available where the user can reasonably establish that the input does not apply.

## Calculations and decision logic

### Transparent logic

Material calculations must be:

- defined in the functional specification;
- isolated from presentation code;
- covered by automated tests;
- expressed in the result using understandable labels; and
- reviewable without reverse-engineering the interface.

Where useful, show the values and formula used. Do not add decimal precision beyond the precision of the inputs.

### Comparison language

Prefer neutral, bounded statements such as:

- `The entered requirement is 12 mm greater than the measured space.`
- `No conflict was found in this simple comparison.`
- `This information is still needed.`
- `This route needs confirmation because it includes a turn.`

Avoid:

- `It fits.`
- `Delivery will be successful.`
- `Safe to install.`
- `Approved.`
- `Guaranteed.`
- `Perfect fit.`

### No false precision

Do not introduce an unexplained safety factor, tolerance or pass threshold. If an allowance is required, identify whether it comes from a current manufacturer instruction, a provider requirement or a user-selected planning allowance.

### Severity and precedence

A tool-specific specification must define its result states and their precedence. A favourable summary must never hide a conflict, unknown input or manual check. Colour must not be the only signal.

## Result design

Results must:

- lead with the most important unresolved issue;
- separate definite arithmetic conflicts from unknowns and manual checks;
- show the measurements used;
- explain why an issue matters;
- give a practical next action;
- preserve the user's entered information when they return to edit it;
- include the tool version and assessment date in printed or saved summaries; and
- repeat the tool-specific limitations.

Where the result is broadly favourable, use `No conflict found in the checks completed` or similarly bounded wording. This is not a guarantee.

## Accessibility

Tools must target WCAG 2.2 Level AA and use native HTML before custom interaction patterns.

At minimum:

- every control has a programmatic label;
- related inputs use `fieldset` and `legend` where appropriate;
- instructions and errors are associated with their controls;
- errors are identified in text and include a correction suggestion where known;
- keyboard users can complete, review, edit, print and reset the tool;
- focus remains visible and moves predictably after validation or step changes;
- dynamic summaries are announced without repeatedly interrupting the user;
- status is communicated with text and structure, not colour alone;
- controls remain usable at 200% zoom and on narrow mobile screens;
- touch targets meet the site's accessibility target;
- motion is not required to understand a result; and
- printed output retains headings, values, warnings and URLs.

Do not request the same information twice in one session when it can be retained safely.

## Privacy and analytics

Collect the minimum information required for the calculation.

Unless a functional specification and reviewed privacy notice explicitly permit otherwise:

- process measurements in the browser;
- do not transmit raw measurements, addresses, room notes or model notes;
- do not place entered data in a shareable URL;
- do not persist entries after the user closes the page;
- do not require an account, email address or phone number; and
- restrict analytics to coarse events that cannot reconstruct the user's inputs.

Any save, upload, image, account or cloud-sync feature requires a separate privacy and security review.

## Security and resilience

- Treat all user text as untrusted and render it as text, not HTML.
- Do not use `eval`, dynamically generated code or third-party scripts for core calculations.
- Keep calculation code available when analytics or other optional services fail.
- Fail safely: preserve inputs, explain the problem and avoid producing a partial favourable result.
- Dependencies must be justified, pinned through the project lockfile and reviewed for known vulnerabilities.

## Performance and compatibility

The core tool must work without an account and on the site's supported mobile and desktop browsers. The functional specification must name the test matrix.

Prefer progressive enhancement. Introductory content and limitations must remain available if client-side code fails. Avoid a framework or dependency when native Astro, HTML, CSS and small testable modules are sufficient.

## Testing

Every tool must have automated and manual coverage for:

- unit conversion;
- each material formula and result state;
- boundary, exact-match and conflicting values;
- missing and invalid inputs;
- unknown and not-applicable states;
- severity precedence;
- editing after a result;
- reset behaviour;
- keyboard and screen-reader operation;
- mobile, desktop, zoom and print layouts;
- failure of optional analytics or storage; and
- the exact public limitation and result wording.

Test fixtures must not be presented as real customer, delivery or installation outcomes.

## Release gates

A tool may be published only when:

- the functional specification and test plan are approved;
- all automated tests pass in the publishing workflow;
- the current site build and output audits pass;
- a keyboard and screen-reader review is complete;
- mobile, desktop and print output have been visually checked;
- material source links and review dates are current;
- limitation and risk wording has received the required editorial and legal review;
- analytics have been checked for data minimisation;
- a rollback or disable path is documented; and
- an owner and next review trigger are recorded.

## Monitoring, correction and withdrawal

Material tool issues follow the public [Corrections & Content Review Policy](../editorial/corrections-content-review-policy.md).

AHC must be able to disable a result or withdraw the complete tool without taking unrelated site content offline. Reports of incorrect calculations, misleading language, data exposure or inaccessible operation must be triaged promptly. A corrected version must be retested against the full affected test set, not only the reported example.

## Version history

| Version | Date | Summary |
| --- | --- | --- |
| 1.0 | 18 July 2026 | Initial shared standard for AHC planning tools. |
