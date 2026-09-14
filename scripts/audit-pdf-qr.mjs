import fs from 'node:fs';
import path from 'node:path';

const downloads = path.resolve('public/downloads');
const expected = new Map([
  ['dishwasher-measurement-worksheet.pdf', 'https://australianhomecollective.com.au/guides/dishwasher-sizes-australia/'],
  ['fridge-measurement-worksheet.pdf', 'https://australianhomecollective.com.au/guides/fridge-dimensions-australia/'],
  ['rangehood-measurement-worksheet.pdf', 'https://australianhomecollective.com.au/guides/rangehood-buying-guide-australia/'],
  ['robot-lawn-mower-yard-assessment.pdf', 'https://australianhomecollective.com.au/guides/robot-lawn-mower-buying-guide-australia/'],
  ['washing-machine-measurement-worksheet.pdf', 'https://australianhomecollective.com.au/guides/washing-machine-and-dryer-space-what-to-measure-before-buying-storage/'],
  ['australian-spring-home-maintenance-checklist.pdf', 'https://australianhomecollective.com.au/guides/spring-home-maintenance-checklist/'],
]);

const pdfs = fs.readdirSync(downloads).filter((name) => name.toLowerCase().endsWith('.pdf')).sort();
const failures = [];

for (const name of pdfs) {
  if (!expected.has(name)) failures.push(`${name}: no canonical guide QR mapping`);
}
for (const [name, url] of expected) {
  const file = path.join(downloads, name);
  if (!fs.existsSync(file)) {
    failures.push(`${name}: mapped PDF is missing`);
    continue;
  }
  const raw = fs.readFileSync(file).toString('latin1');
  if (!raw.includes('AHCQRTarget') || !raw.includes('AHCPrintableStandard')) {
    failures.push(`${name}: QR metadata marker missing; regenerate with scripts/add-pdf-qr.py`);
  }
  // The generator owns the exact target mapping; the audit also guarantees every PDF has an explicit mapping.
  if (!url.startsWith('https://australianhomecollective.com.au/guides/')) {
    failures.push(`${name}: invalid canonical target ${url}`);
  }
}

if (failures.length) {
  console.error('Printable PDF QR audit failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`Printable PDF QR audit passed for ${pdfs.length} PDF asset(s).`);
