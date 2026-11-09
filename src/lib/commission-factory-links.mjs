export const commissionFactoryPublisher = '94708';

// Account-issued routes only. URL validation does not grant editorial approval.
// Placement approval is enforced separately by the commercial registry and audit.
const placements = new Map([
  ['92170', {
    merchant: 'Good Buyz',
    destinations: ['https://goodbuyz.com.au/products/locknlock-rice-case-w-cup-12l'],
  }],
  ['90706', {
    merchant: 'Braun Household',
    destinations: ['https://www.braunhousehold.com/en-au/p/multiquick-3-multiquick-3-hand-blender-mq-30202m-black/MQ30202MBK.html?pid=0X22111593'],
  }],
  ['78836', {
    merchant: 'ECOVACS',
    destinations: ['https://www.ecovacs.com/au/shop/goat-robotic-lawn-mower/goat-o600-rtk'],
  }],
  ['92873', {
    merchant: 'Lorraine Lea',
    destinations: ['https://lorrainelea.com.au/products/cooper-bath-towel-rust'],
  }],
  ['93696', {
    merchant: 'Pergolux AU',
    // Prepared research links remain paused until the full product review passes.
    destinations: [
      'https://pergolux.au/products/pergola',
      'https://pergolux.au/products/pergola-pro',
      'https://pergolux.au/products/pergola-pro-max',
    ],
  }],
  ['77799', {
    merchant: 'UpDown Desk',
    destinations: ['https://updowndesk.com.au/products/pro-plus-series-melamine-standing-desks?variant=46231092822185'],
  }],
  ['31577', {
    merchant: 'Cookware Brands',
    destinations: ['https://www.cookwarebrands.com.au/products/raco-eversteel-stainless-steel-induction-frypan-28cm'],
  }],
  ['92323', {
    merchant: 'MyHomeware',
    destinations: [
      'https://www.myhomeware.com.au/products/bathroom-shower-shelf-satin-stainless-steel',
      'https://www.myhomeware.com.au/products/single-robe-hook-stainless-steel-various-colour?variant=44701610148012',
    ],
  }],
  ['72641', {
    merchant: 'OneBed Mattress',
    destinations: ['https://onebed.com.au/products/onebed-essential-10?variant=43278119207021'],
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
  const destination = url.searchParams.get('Url');
  if (url.searchParams.size !== 1 || !placement.destinations.includes(destination)) {
    throw new Error('Destination does not match the reviewed product and variant.');
  }
  return destination;
}

export function commissionFactoryLinkError(value, merchant) {
  try {
    commissionFactoryDestination(value, merchant);
    return null;
  } catch (error) {
    return error.message;
  }
}
