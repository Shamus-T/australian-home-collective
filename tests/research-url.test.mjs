import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { researchUrl } from '../scripts/research-url.mjs';
import { getRegisteredRetailers } from '../src/lib/commercial-retailers.mjs';

test('removes attribution from Amazon product links without opening them', () => {
  assert.equal(researchUrl('https://www.amazon.com.au/name/dp/B000WJQGMU/ref=abc?tag=ahc07-22&linkCode=ll1#x'), 'https://www.amazon.com.au/dp/B000WJQGMU');
  assert.equal(researchUrl('https://amazon.com.au/gp/product/B000WJQGMU?tag=anything'), 'https://www.amazon.com.au/dp/B000WJQGMU');
});

test('extracts the direct Partnerize destination offline and removes its query', () => {
  assert.equal(researchUrl('https://prf.hn/click/camref:1100l6vaUc/destination:https%3A%2F%2Fwww.thegoodguys.com.au%2Felectrolux-dryer-edv705h3wc%3Futm_source%3Daffiliate'), 'https://www.thegoodguys.com.au/electrolux-dryer-edv705h3wc');
});

test('fails closed for short links, unknown redirects, credentials and lookalike hosts', () => {
  for (const url of ['https://amzn.to/abc', 'https://prf.hn/click/camref:1100l6vaUc', 'https://amazon.com.au.evil.example/dp/B000WJQGMU', 'https://user@amazon.com.au/dp/B000WJQGMU', 'http://amazon.com.au/dp/B000WJQGMU', 'https://www.amazon.com.au/gp/slredirect/picassoRedirect.html?url=example', 'https://www.thegoodguys.com.au/redirect?url=anything']) {
    assert.throws(() => researchUrl(url));
  }
});

test('all currently approved catalogue offers have an offline research destination', () => {
  const catalogue = JSON.parse(readFileSync(new URL('../src/data/commercial-products.json', import.meta.url), 'utf8'));
  let checked = 0;
  for (const product of catalogue.products) {
    for (const offer of getRegisteredRetailers(product).filter(offer => offer.affiliate && offer.approvedForAffiliateUse)) {
      const clean = researchUrl(offer.destinationUrl);
      assert.ok(!clean.includes('?') && !clean.includes('prf.hn'));
      checked++;
    }
  }
  assert.ok(checked > 0);
});
