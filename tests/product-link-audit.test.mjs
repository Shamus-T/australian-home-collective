import assert from 'node:assert/strict';
import test from 'node:test';
import { productLinkErrors } from '../scripts/lib/product-link-audit.mjs';

const product = { id: 'dryer', affiliate: true, approvedForAffiliateUse: true,
  destinationUrl: 'https://prf.hn/click/camref:approved/destination:retailer' };
const marked = `data-commercial-product-id="dryer" data-commercial-link="affiliate" data-affiliate-trackable="true"`;
const table = link => `<table class="commercial-product-comparison"><tr><th><img src="/dryer.webp">${link}</th></tr></table>`;
const card = link => `<article data-commercial-product-card><figure><img src="/dryer.webp"><figcaption>${link}</figcaption></figure></article>`;

test('approved affiliate destination works in product titles and captions', () => {
  const link = `<a ${marked} href="${product.destinationUrl}">Dryer</a>`;
  assert.deepEqual(productLinkErrors(table(link) + card(link), [product]), []);
});
test('unmarked direct links under images fail in both buying areas', () => {
  const link = '<a href="https://www.thegoodguys.com.au/dryer">Dryer</a>';
  assert.equal(productLinkErrors(table(link) + card(link), [product]).length, 2);
});
test('tracking markers cannot disguise an unregistered destination', () => {
  assert.equal(productLinkErrors(card(`<a ${marked} href="https://retailer.example/dryer">Dryer</a>`), [product]).length, 1);
});

test('specification comparison tables reject direct retailer links and require registered tracking', () => {
  const wrap = link => `<table data-commercial-comparison><tr><td>${link}</td></tr></table>`;
  assert.equal(productLinkErrors(wrap('<a href="https://www.thegoodguys.com.au/dryer">Buy</a>'), [product]).length, 1);
  assert.deepEqual(productLinkErrors(wrap(`<a ${marked} href="${product.destinationUrl}">Buy</a>`), [product]), []);
});
test('product-name jump links and affiliate links without click tracking fail', () => {
  assert.equal(productLinkErrors(table('<a href="#product-dryer">Dryer</a>'), [product]).length, 1);
  assert.equal(productLinkErrors(card(`<a href="${product.destinationUrl}">Dryer</a>`), [product]).length, 1);
});
test('plain credits and editorial sources outside buying areas remain valid', () => {
  assert.deepEqual(productLinkErrors(card('Image supplied by manufacturer.')
    + '<p><a href="https://manufacturer.example/manual.pdf">Installation manual</a></p>', [product]), []);
});
