import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { commissionFactoryDestination, commissionFactoryLinkError } from '../src/lib/commission-factory-links.mjs';
import { researchUrl } from '../scripts/research-url.mjs';

const prefix = 'https://t.cfjump.com/94708/t/93696?Url=';
test('only registered product feed IDs match their retailer and original destination', () => {
  const url = 'https://t.cfjump.com/94708/p/261410236';
  assert.equal(new URL(commissionFactoryDestination(url, "De'Longhi")).searchParams.get('pid'), '0151457015');
  for (const invalid of [url + '1', url + '?Url=https://example.com', url.replace('94708', '12345')]) {
    assert.throws(() => researchUrl(invalid));
  }
  assert.throws(() => commissionFactoryDestination(url, 'Kenwood'));
});
const manual = prefix + 'https%3a%2f%2fpergolux.au%2fproducts%2fpergola';
test('account-issued links decode offline to each exact model page', () => {
  for (const suffix of ['', '-pro', '-pro-max']) {
    const expected = 'https://pergolux.au/products/pergola' + suffix;
    assert.equal(commissionFactoryDestination(manual + suffix), expected);
    assert.equal(researchUrl(manual + suffix), expected);
  }
});

test('rejects wrong publishers, merchants, nested redirects and ambiguous destinations', () => {
  for (const value of [
    manual.replace('/94708/', '/12345/'), manual.replace('/93696?', '/80878?'),
    manual.replace('t.cfjump.com', 't.cfjump.com.example.org'),
    manual.replace('https:', 'http:'), manual.replace('t.cfjump.com', 'user@t.cfjump.com'),
    manual + '#fragment', manual + '&Url=https%3a%2f%2fpergolux.au%2fproducts%2fpergola-pro',
    manual + '&UniqueId=unverified', manual.replace('?Url=', '?url='),
    prefix + encodeURIComponent('https://pergolux.au.evil.example/products/pergola'),
    prefix + encodeURIComponent('https://pergolux.au/products/pergola?tag=affiliate'),
    prefix + encodeURIComponent('https://pergolux.au/products/awnings'),
    prefix + encodeURIComponent(manual),
  ]) {
    assert.ok(commissionFactoryLinkError(value, 'Pergolux AU'), value);
    assert.throws(() => researchUrl(value), undefined, value);
  }
  assert.ok(commissionFactoryLinkError(manual, 'Unapproved merchant'));
});

test('verified routing does not grant editorial or affiliate placement approval', () => {
  const catalogue = JSON.parse(readFileSync(new URL('../src/data/commercial-products.json', import.meta.url)));
  const products = catalogue.products.filter(p => p.merchant === 'Pergolux AU');
  assert.equal(products.length, 3);
  for (const product of products) {
    assert.equal(commissionFactoryLinkError(product.destinationUrl, product.merchant), null);
    assert.equal(product.editorialStatus, 'paused');
    assert.equal(product.approvedForAffiliateUse, false);
    assert.equal(product.affiliateValidation.safetyComplianceStatus, 'unverified');
    assert.ok(!catalogue.enabledGuidePaths.includes(product.guidePath));
  }
});
