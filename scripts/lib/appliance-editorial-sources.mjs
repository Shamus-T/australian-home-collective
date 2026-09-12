// Exact manufacturer references reviewed for the appliance measurement guides.
// Evidence: docs/editorial/appliance-fit-sources-2026-09-10-*.md
// docs/editorial/fridge-fit-sources-2026-09-11-*.md, and
// docs/editorial/rangehood-guide-sources-2026-09-12.md.
// This does not approve other store pages or any tracking parameters.
const reviewedSourceUrls = new Set([
  "https://www.bosch-home.com.au/products/cooking-baking/rangehoods/buying-guide",
  "https://www.fisherpaykel.com/on/demandware.static/-/Sites-fpa-master-catalog/default/dwfb349ef1/InstallationManuals-FisherPaykelUS/FP-InstallGuide-en-HC24DCXB4-HC30DCXB4-HC36DCXB4-BoxWallRangeHood-0-106075B-US-CA.pdf",
  "https://www.schweigen.com.au/get-inspired-3/silent-rangehood-buying-guide",
  "https://www.chefappliances.com.au/rangehoods/canopy/crc612sb/",
  "https://dam.fisherpaykel.com/KZ3PKN00/at/5bh7cbrwb7qqwj4tf8m574m/FP-InstallGuide-en-WH8060J5-WH9060J-WH8060P-WH9060P-WH1060P-WH1260P-WH9060D5-WH1060D5-WH1260D5-WH1260R5-WH1260MZB5-WH1260T5-WH1260H5-WH1260YZB5-Washer-0-432972A-NZ-AU.pdf",
  "https://dam.fisherpaykel.com/KZ3PKN00/at/79xxgf3js7vvp9t95gwpm6q/FP-InstallGuide-en-DD60ST4-DD60ST4HNX9-DD60SDFHTX9-DD60SC-DD60SAX9-DishDrawer-0-431375C-NZ-AU-UK-IE-SG.pdf",
  "https://dam.fisherpaykel.com/KZ3PKN00/at/rm2q4txk7xjxkb68qzqtfx8x/FP-InstallGuide-en-RF730QZUVB1-RF730QNUVX1-RF730QNUVB1-FreestandingQuadDoorRefrigeratorFreezer-0-431084B-NZ-AU.pdf",
  "https://dam.fisherpaykel.com/KZ3PKN00/at/wkszjk8rhbtz76qn6frjsvsq/FP-PlanningGuide-en-WH1260H5-WH1260HG5-WH1260T5-WH1260TG5-DH1060H5-DH1060HG5-DH1060HL5-DH1060HLG5-DH1060T5-DH1060TG5-0-90004467H-AU-NZ.pdf",
  "https://dam.fisherpaykel.com/KZ3PKN00/at/xx8mxcjtxpw6xpftwb5qr69/FP-InstallGuide-en-WL8058G1-WL9058G1-WL1064G1-WL1064P1-WL1264P1-TopLoadWashingMachine-0-431197C-NZ-AU.pdf",
  "https://media.miele.com/downloads/40/16/00_C7F1383883351EDEB78F4E75869F4016.pdf",
  "https://media.miele.com/downloads/82/b0/00_C7F13838347D1EDFADF32AAD961B82B0.pdf",
  "https://media3.bsh-group.com/Documents/9001875574_C.pdf",
  "https://media3.bsh-group.com/Documents/9002017246_A.pdf",
  "https://media3.bsh-group.com/Documents/9002022827_A.pdf",
  "https://media3.bsh-group.com/Documents/specsheet/en-AU/KGN36VI3AA.pdf",
  "https://media3.bsh-group.com/Documents/specsheet/en-AU/SMS6HCI02A.pdf",
  "https://media3.bsh-group.com/Documents/specsheet/en-AU/WGG244A1AU.pdf",
  "https://shop.miele.com.au/en/kitchen/dishwashers/fully-integrated-dishwashers/g-5263-scvi-bk-active-plus-fully-integrated-dishwasher-zid11587640/",
  "https://www.bosch-home.com.au/en/mkt-product/fridges-freezers/fridge-freezers/freestanding-bottom-mount-fridge-freezer/KGN36VI3AA",
  "https://www.bosch-home.com.au/en/mkt-product/washers-dryers/washing-machines/front-load-washing-machines/WGG244A1AU",
  "https://www.bosch-home.com.au/en/product/dishwashers/freestanding-dishwashers/dishwasher-60-cm-wide/SMS6HCI02A",
  "https://www.fisherpaykel.com/au/cooling/freestanding/690l-series-7-quad-door-refrigerator-freezer-ice-and-water-rf730qnuvx1-26615.html",
  "https://www.fisherpaykel.com/au/dishwashing/built-under/series-7-contemporary-single-dishdrawer-dishwasher-dd60scx9-82316.html",
  "https://www.fisherpaykel.com/au/laundry/washing-machines/front-load/12kg-series-11-contemporary-front-loader-washer-flexidose-wh1260h5-92318.html",
  "https://www.fisherpaykel.com/au/laundry/washing-machines/top-load/8kg-series-5-top-loader-washer-uv-sanitise-wl8058g1-92298.html",
  "https://www.westinghouse.com.au/documenthandler.ashx?file=aHR0cHM6Ly9yZXNvdXJjZS5lbGVjdHJvbHV4LmNvbS5hdS9QdWJsaWMvRmlsZS8_SWQ9NjM0Mjk1&lang=",
  "https://www.westinghouse.com.au/documenthandler.ashx?file=aHR0cHM6Ly9yZXNvdXJjZS5lbGVjdHJvbHV4LmNvbS5hdS9QdWJsaWMvRmlsZS8_SWQ9NjMxNzY1&lang=",
  "https://www.westinghouse.com.au/fridges-and-freezers/fridges/wtm4302wd-r/"
]);

export function isReviewedApplianceSource(urlValue) {
  try {
    const url = new URL(urlValue);
    // Page fragments let readers open the cited PDF diagram directly.
    url.hash = '';
    return reviewedSourceUrls.has(url.href);
  } catch {
    return false;
  }
}
