import { parse } from 'ultrahtml';
import { decode } from 'entities';
import { getRegisteredRetailers } from '../../src/lib/commercial-retailers.mjs';

// Inspect every anchor in the buying areas, including anchors without tracking markers.
export function productLinkErrors(html, products) {
  const errors = [];
  const byId = new Map(products.map(product => [product.id, product]));
  function visit(node, inBuyingArea = false) {
    const attrs = node.attributes ?? {};
    const classes = (attrs.class ?? '').split(/\s+/);
    const protectedArea = inBuyingArea || 'data-commercial-product-card' in attrs
      || classes.includes('commercial-product-comparison');
    if (protectedArea && node.name === 'a') {
      const href = decode(attrs.href ?? '');
      const product = byId.get(attrs['data-commercial-product-id']);
      const offer = product && getRegisteredRetailers(product).find(candidate =>
        candidate.affiliate && candidate.approvedForAffiliateUse && candidate.destinationUrl === href);
      if (!offer || attrs['data-commercial-link'] !== 'affiliate'
        || attrs['data-affiliate-trackable'] !== 'true') {
        errors.push(`Product-area link must use an approved, tracked affiliate destination: ${href}`);
      }
    }
    for (const child of node.children ?? []) visit(child, protectedArea);
  }
  visit(parse(html));
  return errors;
}
