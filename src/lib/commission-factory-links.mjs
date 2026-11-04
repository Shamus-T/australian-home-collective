// Verified in AHC's signed-in Text Links generator on 4 November 2026.
// Pure URL inspection: never fetch or resolve an affiliate URL.
export const commissionFactoryPublisher = '94708';
const pergoluxPaths = new Set([
  '/products/pergola', '/products/pergola-pro', '/products/pergola-pro-max',
]);

export function commissionFactoryDestination(value, merchant = 'Pergolux AU') {
  const url = new URL(value);
  if (merchant !== 'Pergolux AU' || url.protocol !== 'https:'
    || url.hostname !== 't.cfjump.com' || url.username || url.password || url.port
    || url.hash || url.pathname !== `/${commissionFactoryPublisher}/t/93696`) {
    throw new Error('Unapproved Commission Factory publisher, advertiser or tracking host');
  }
  const entries = [...url.searchParams];
  if (entries.length !== 1 || entries[0][0] !== 'Url') {
    throw new Error('Expected exactly one account-generated Url destination');
  }
  const destination = new URL(entries[0][1]);
  if (destination.protocol !== 'https:' || destination.hostname !== 'pergolux.au'
    || destination.username || destination.password || destination.port
    || destination.search || destination.hash || !pergoluxPaths.has(destination.pathname)) {
    throw new Error('Expected one of the three verified Pergolux Series 4 model pages');
  }
  return destination.href;
}

export function commissionFactoryLinkError(value, merchant) {
  try { commissionFactoryDestination(value, merchant); return null; }
  catch (error) { return error.message; }
}
