import test from 'node:test';
import assert from 'node:assert/strict';
import { siteOrigin, changedUrls, validateUrls, sitemapUrls } from '../scripts/lib/indexnow.mjs';
const urls = ['/guides/dryer/', '/guides/fridge/', '/about/'].map(path => siteOrigin + path);
test('submissions reject other hosts and private query data', () => {
  for (const url of ['https://example.com/', siteOrigin + '/?token=secret', siteOrigin + '/#private', 'http://australianhomecollective.com.au/']) {
    assert.throws(() => validateUrls([url]));
  }
  assert.throws(() => validateUrls([]));
});
test('source edits select only sitemap routes, excluding redirect pages', () => {
  assert.deepEqual(changedUrls({ files: ['src/pages/guides/dryer/index.astro', 'src/pages/our-approach/index.astro'], urls }), [urls[0]]);
});
test('product additions, removals and changed comparison copy notify affected guides', () => {
  const old = [{ id: 'a', guidePath: '/guides/dryer/' }, { id: 'b', guidePath: '/guides/fridge/' }];
  assert.deepEqual(changedUrls({ files: ['src/data/commercial-products.json'], urls, previousProducts: old, products: [old[1]] }), [urls[0]]);
  assert.deepEqual(changedUrls({ files: ['src/data/appliance-buying-comparisons.json'], urls, previousProducts: old, products: old, previousComparisons: { b: { fit: 'old' } }, comparisons: { b: { fit: 'new' } } }), [urls[1]]);
});
test('shared presentation edits notify all indexable pages; evidence-only edits do not', () => {
  assert.deepEqual(changedUrls({ files: ['src/components/Header.astro'], urls }), urls);
  assert.deepEqual(changedUrls({ files: ['docs/research.md'], urls }), []);
  assert.deepEqual(sitemapUrls('<loc>' + urls[0] + '</loc><loc>' + urls[0] + '</loc>'), [urls[0]]);
});
