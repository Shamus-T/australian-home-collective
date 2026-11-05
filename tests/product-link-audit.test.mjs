import assert from 'node:assert/strict';
import test from 'node:test';
import { productLinkErrors } from '../scripts/lib/product-link-audit.mjs';
import { commissionFactoryDestination } from '../src/lib/commission-factory-links.mjs';
import { researchUrl } from '../scripts/research-url.mjs';

test('Commission Factory product links keep the approved retailer and exact variant', () => {
  const desk = 'https://updowndesk.com.au/products/pro-plus-series-melamine-standing-desks?variant=46231092822185';
  const pan = 'https://www.cookwarebrands.com.au/products/raco-eversteel-stainless-steel-induction-frypan-28cm';
  const deskLink = 'https://t.cfjump.com/94708/t/77799?Url=' + encodeURIComponent(desk);
  const panLink = 'https://t.cfjump.com/94708/t/31577?Url=' + encodeURIComponent(pan);
  assert.equal(researchUrl(deskLink), desk);
  assert.equal(commissionFactoryDestination(panLink, 'Cookware Brands'), pan);
  assert.throws(() => commissionFactoryDestination(panLink, 'Raco'));
  for (const invalid of [deskLink.replace('94708', '1'), deskLink.replace('77799', '31577'),
    deskLink.replace('46231092822185', '123'), deskLink + '&Url=' + encodeURIComponent(desk),
    'https://prf.hn/click/camref:example/destination:' + encodeURIComponent(deskLink)]) {
    assert.throws(() => researchUrl(invalid));
  }
});

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
