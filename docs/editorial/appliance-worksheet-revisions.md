# Appliance worksheet revisions

Updated: 11 September 2026

## Current issue: Revision 2

| Worksheet | Published file | Revision |
| --- | --- | --- |
| Washing machine | `public/downloads/washing-machine-measurement-worksheet.pdf` | 2 |
| Dishwasher | `public/downloads/dishwasher-measurement-worksheet.pdf` | 2 |

Revision 2 implements the reader's requested changes:

- Removed the date measured / measured by, installation manual record and manual checked boxes. Retained the brand and full model code.
- Increased instructions and field labels to 10.5 points, from 8-9.1 points in Revision 1. Section headings are 12 points; diagram labels are 11 points.
- Added an original angled appliance line drawing in the style of the reader's reference: a front-loading washing machine on the washer sheet and a dishwasher on its sheet. Width sits above the front, height down the side and depth along the receding top edge. There are no example dimensions or branding. The nearby instruction explicitly says the diagram shows directions only and the blank fields are for the actual cavity, not the old appliance.
- Added a separate space to sketch the layout and mark taps, pipes, power points, trim and obstructions.
- Made the main instruction explicit: "Measure the actual cavity, not the old appliance."
- Kept home measurements separate from the new model's dimensions and manufacturer-required space, with a reminder to leave inaccessible areas unconfirmed.
- Retained checks for doors or lids, connections, installation and delivery access.
- Kept each worksheet to one A4 page and added the revision number and issue date to the footer. Download URLs remain stable.

The shared drawing helpers in `scripts/build-appliance-measurement-worksheets.py` remain available to the fridge worksheet. The new layout is in `scripts/lib/appliance-worksheet-revision2.py`; the diagram helper is in `scripts/lib/appliance-worksheet-diagram.py`.

## Revision 1 baseline

The original washing-machine and dishwasher PDFs, published on 10 September and retained in commit `701797b`, are Revision 1.

Both already asked readers to measure the finished opening at the front, middle and rear, record the smallest clear width and height, and measure usable depth to an obstruction. Product dimensions and manufacturer-required cavity dimensions had separate fields. Revision 1 used written fields without a diagram and did not explicitly distinguish measuring the cavity from measuring the old appliance.

## Verification before publication

Both PDFs were reopened and verified as one A4 page each. The three removed boxes are absent; field labels and body instructions are 10.5 points and diagram labels are 11 points. Full-page renders were inspected for clipping, overlap, usable writing space and correctly directed arrows. The washer prompt still asks for approved stacking models and kit. The production build and required site audits passed. Confirm that the published PDF bytes match these reviewed files after deployment.

## Fridge worksheet consistency

The fridge worksheet was added separately in the [11 September resource rollout](appliance-resource-rollout-2026-09-11.md). It also asks readers to measure the finished opening separately from the model's dimensions and required space. Apply the same explicit cavity instruction and space for annotated diagrams when it is next revised.
