export const commissionFactoryPublisher = '94708';

// Only account-issued destinations that have passed the editorial review.
const placements = new Map([
  ['77799', {
    merchant: 'UpDown Desk',
    destination: 'https://updowndesk.com.au/products/pro-plus-series-melamine-standing-desks?variant=46231092822185',
  }],
  ['31577', {
    merchant: 'Cookware Brands',
    destination: 'https://www.cookwarebrands.com.au/products/raco-eversteel-stainless-steel-induction-frypan-28cm',
  }],
]);

export function commissionFactoryDestination(value, merchant) {
  const url = new URL(value);
  const path = url.pathname.split('/');
  const placement = placements.get(path[3]);
  if (url.origin !== 'https://t.cfjump.com' || url.username || url.password || url.hash
    || path.length !== 4 || path[1] !== commissionFactoryPublisher || path[2] !== 't' || !placement) {
    throw new Error('Expected an approved Commission Factory publisher and advertiser path.');
  }
  if (merchant !== undefined && merchant !== placement.merchant) {
    throw new Error('Advertiser does not match the selected retailer.');
  }
  if (url.searchParams.size !== 1 || url.searchParams.get('Url') !== placement.destination) {
    throw new Error('Destination does not match the reviewed product and variant.');
  }
  return placement.destination;
}

export function commissionFactoryLinkError(value, merchant) {
  try {
    commissionFactoryDestination(value, merchant);
    return null;
  } catch (error) {
    return error.message;
  }
}
