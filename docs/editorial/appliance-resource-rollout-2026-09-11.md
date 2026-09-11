# Appliance resource rollout - 11 September 2026

## Published scope

- Worksheet descriptions on the existing homepage measurement cards and Kitchen/Laundry category cards.
- A direct PDF shortcut near the top of the washing-machine, dishwasher and fridge guides.
- Worksheet references in the existing laundry essentials, laundry storage and everyday kitchen essentials links.
- Three original fridge diagrams: opening and ventilation space, door movement beside a wall, and delivery access.
- Three Australian fridge examples checked on 11 September: Bosch KGN36VI3AA, Fisher & Paykel RF730QNUVX1 and Westinghouse WTM4302WD-R. Exact evidence is in the two fridge-fit source records alongside this note.
- One free, printable A4 fridge worksheet, with its source builder retained.

Titles and routes remain stable. Source links use the exact manufacturer documents; additional tracking parameters and unreviewed document destinations remain outside the approved source list. The editorial-link audit decodes HTML entities before comparing query-based manufacturer links.

## Download tracking verification

A fresh, isolated browser made one native click on the existing washing-machine worksheet at 2026-09-10T22:07:02.323Z. No manual download event was submitted and no Analytics settings or public tracking scripts were changed.

Observed automatic event:

- Event: file_download
- Measurement ID: G-NHVS6YBB8J
- File: /downloads/washing-machine-measurement-worksheet.pdf
- File extension: pdf
- File link: https://australianhomecollective.com.au/downloads/washing-machine-measurement-worksheet.pdf
- Google collection response: HTTP 204
- Actual PDF download: successful

This proves browser emission and collection-endpoint acceptance. It does **not** prove appearance in GA4 Realtime, Events or other processed reports. Both available browser automation sessions failed at initialisation with a Windows sandbox setup error. The repository's existing Google reporting connection uses a deployed service account, and no local Google credentials were available. Report-side confirmation remains pending.

The test used utm_source=ahc_qa, utm_medium=internal_test and utm_campaign=worksheet_tracking_verification. Exclude this controlled test from audience and partner-application evidence. Debug mode was requested but was not confirmed in the captured event parameters; do not assume the test was automatically filtered. A download event records a link click, not proof that the reader saved, printed or used the sheet.

Sanitised scratch evidence is in tmp/appliance-fit-qa/ga4-live-download-verification.json. It intentionally excludes client identifiers, cookies and authentication material.

## Verification and measurement follow-up

The PDF was reopened and rendered as one A4 page, with no clipping. All SVGs were parsed and visually inspected. Browser checks at 1365, 390 and 320 pixels confirmed the three shortcuts, expected figures and no horizontal page overflow. Desktop shortcut clicks downloaded the correct PDFs. A separate publication review checked Australian language, source meanings, corner access and plumbing wording.

The full production build, source and rendered audits must pass before release. Verify the live three guide shortcuts, homepage/category worksheet descriptions, exact fridge models and the hashes of the PDF and SVG files after deployment.

Use the saved traffic report ending 9 September as a historical baseline; it predates these resources. A first complete post-change window is 11 September-8 October 2026. Compare guide visits and download clicks in the same date window, retaining raw counts. Keep Google search results separate from Analytics event counts. No social posts or affiliate applications form part of this rollout.

## Worksheet revision plan

The original washing-machine and dishwasher PDFs are recorded as Revision 1. [Revision 2](appliance-worksheet-revisions.md) removes three recording boxes, increases the text size and adds labelled dimension diagrams, space for a reader sketch and an explicit instruction to measure the actual cavity rather than the old appliance.
