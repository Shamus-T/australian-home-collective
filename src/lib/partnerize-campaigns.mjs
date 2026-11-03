// Campaign-specific destinations verified in AHC's signed-in Partnerize account.
// Never resolve these links to test attribution.
export const partnerizeCampaigns = Object.freeze({
  'The Good Guys': { host: 'prf.hn', camref: '1100l6vaUc', destinationHost: 'www.thegoodguys.com.au', creative: '1011l64579' },
  'Beds n Dreams': { host: 'bnd.prf.hn', camref: '1110lSAJY', destinationHost: 'www.bedsndreams.com.au' },
});

export function partnerizeLinkError(value, merchant) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) return 'Expected a plain HTTPS tracking link';
    const campaign = merchant ? partnerizeCampaigns[merchant] : Object.values(partnerizeCampaigns).find(c => c.host === url.hostname);
    if (!campaign || url.hostname !== campaign.host) return 'Unapproved merchant or tracking host';
    const prefix = `/click/camref:${campaign.camref}/`;
    if (!url.pathname.startsWith(prefix)) return 'Wrong campaign reference';
    const tail = url.pathname.slice(prefix.length);
    const match = tail.match(/^(?:creativeref:([a-zA-Z0-9]+)\/)?destination:([^/]+)$/);
    if (!match || (match[1] && match[1] !== campaign.creative)) return 'Unapproved creative or missing encoded product destination';
    const destination = new URL(decodeURIComponent(match[2]));
    if (destination.protocol !== 'https:' || destination.hostname !== campaign.destinationHost || destination.username || destination.password || destination.port || destination.hash) return 'Wrong merchant destination';
    if (merchant === 'Beds n Dreams' || campaign.host === 'bnd.prf.hn') {
      if (!/^\/products\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(destination.pathname)) return 'Expected an exact Beds n Dreams product';
      if ([...destination.searchParams.keys()].some(k => k !== 'variant') || (destination.search && !/^\?variant=\d+$/.test(destination.search))) return 'Only an exact product variant may be specified';
    }
    return null;
  } catch { return 'Invalid affiliate URL'; }
}
