import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { siteOrigin, sitemapUrls, validateUrls, changedUrls } from './lib/indexnow.mjs';

const args = process.argv.slice(2);
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const config = readJson('scripts/indexnow-config.json');
// This is a publicly served site-ownership token, not an account/API credential.
const key = fs.readFileSync('public/' + config.keyFile, 'utf8').trim();
if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('Invalid IndexNow ownership token.');
const allowed = sitemapUrls(fs.readFileSync('public/sitemap.xml', 'utf8'));
let urls;
if (args.includes('--changed')) {
  const before = process.env.INDEXNOW_BEFORE;
  if (!/^[a-f0-9]{40}$/i.test(before ?? '') || /^0+$/.test(before)) {
    throw new Error('A valid prior commit is required; use explicit URLs for initial submission.');
  }
  // The researched product catalogue exceeds Node's default 1 MiB stdout limit.
  const git = argv => execFileSync('git', argv, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const previous = file => JSON.parse(git(['show', before + ':' + file]));
  urls = changedUrls({
    files: git(['diff', '--name-only', before, 'HEAD']).trim().split(/\r?\n/), urls: allowed,
    previousProducts: previous('src/data/commercial-products.json').products,
    products: readJson('src/data/commercial-products.json').products,
    previousComparisons: previous('src/data/appliance-buying-comparisons.json'),
    comparisons: readJson('src/data/appliance-buying-comparisons.json'),
  });
} else {
  urls = args.filter(arg => !arg.startsWith('--')).map(path => path.startsWith('/') ? siteOrigin + path : path);
}
if (!urls.length) { console.log('No changed indexable pages to submit.'); process.exit(0); }
urls = validateUrls(urls);
if (urls.some(url => !allowed.includes(url))) throw new Error('URL is absent from the public sitemap.');
if (args.includes('--dry-run')) { console.log(JSON.stringify({ urls }, null, 2)); process.exit(0); }

const headers = { 'Cache-Control': 'no-cache' };
const get = url => fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(20000) });
const expected = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
let deployed = false;
for (let attempt = 0; attempt < (process.env.CI ? 40 : 1); attempt++) {
  try {
    const response = await get(siteOrigin + '/indexnow-revision.json');
    deployed = response.ok && (await response.json()).revision === expected;
  } catch { /* Deployment may still be starting. */ }
  if (deployed) break;
  if (process.env.CI) await delay(15000);
}
if (!deployed) throw new Error('Expected revision is not live; no submission made.');
const ownership = await get(siteOrigin + '/' + config.keyFile);
if (!ownership.ok || (await ownership.text()).trim() !== key) throw new Error('Live ownership file mismatch.');
for (const url of urls) {
  const response = await get(url);
  if (!response.ok) throw new Error('Changed page is not reachable: ' + url);
  const html = await response.text();
  if (!html.includes('rel="canonical" href="' + url + '"') || /name="robots" content="[^\"]*noindex/.test(html)) {
    throw new Error('Changed page is not self-canonical and indexable: ' + url);
  }
}
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(siteOrigin).host, key, keyLocation: siteOrigin + '/' + config.keyFile, urlList: urls }),
  signal: AbortSignal.timeout(30000),
});
if (![200, 202].includes(response.status)) throw new Error('IndexNow submission returned HTTP ' + response.status);
console.log(JSON.stringify({ status: response.status, submittedUrls: urls, indexingGuaranteed: false }));
