import test from 'node:test';
import assert from 'node:assert/strict';
import { manufacturerPriceErrors, getDisplayManufacturerPrice } from '../src/lib/manufacturer-price.mjs';
const price = {amount: 339, currency: 'AUD', kind: 'manufacturer-direct', manufacturer: 'Breville Australia', sourceUrl: 'https://www.breville.com/en-au/product/bpr680', checkedOn: '2026-10-11', reviewDueOn: '2026-11-01', evidence: 'Australian page offers Add to cart at $339.'};
test('verified manufacturer-direct price displays until its review date', () => {
  assert.equal(getDisplayManufacturerPrice({manufacturerPrice: price}, '2026-10-31'), price);
  assert.equal(getDisplayManufacturerPrice({manufacturerPrice: price}, '2026-11-01'), null);
  assert.equal(getDisplayManufacturerPrice({}, '2026-10-11'), null);
});
test('RRP, foreign currency, future dates and overlong review intervals fail', () => {
  for (const change of [{kind: 'rrp'}, {currency: 'USD'}, {checkedOn: '2026-10-12'}, {reviewDueOn: '2026-12-01'}, {checkedOn: '2026-02-30'}, {sourceUrl: 'http://example.com'}, {evidence: ''}]) assert.ok(manufacturerPriceErrors({...price, ...change}, '2026-10-11').length);
});
