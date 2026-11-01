export const JOURNEY_VERSION = 'appliance-2026-11-01-v1';
export const JOURNEY_GUIDES = {
  '/guides/fridge-dimensions-australia/': ['westinghouse-wtm3100wl-x-good-guys', 'westinghouse-wtm4302wd-r-good-guys', 'lg-gb-b400ps-fridge-fit-good-guys', 'tgg-gap-haier-hrf510fhs'],
  '/guides/washing-machine-and-dryer-space-what-to-measure-before-buying-storage/': ['bosch-wgg244a1au-good-guys', 'lg-wx3-1208w-good-guys', 'lg-wtx3-09g-good-guys', 'bosch-wtz11400-good-guys', 'bosch-wqg24201au-laundry-fit-good-guys'],
  '/guides/dishwasher-sizes-australia/': ['westinghouse-wsf6602xc-good-guys', 'bosch-sms6hci02a-good-guys', 'bosch-sps6iki01a-good-guys', 'tgg-gap-integrated-smv4htx01a'],
};
export const JOURNEY_STAGES = ['guide_view', 'engaged_10s', 'comparison_view', 'product_view', 'retailer_click'];
export const JOURNEY_SOURCES = ['google', 'bing', 'yahoo', 'duckduckgo', 'facebook', 'instagram', 'chatgpt', 'email', 'direct', 'internal_unknown', 'other_referral', 'other_campaign'];
export const JOURNEY_MEDIA = ['organic', 'referral', 'social', 'email', 'paid', 'none', 'unknown'];

// Deliberately store categories only, never raw referrer URLs or arbitrary UTM values.
export function classifyJourneySource(href, referrer = '') {
  const url = new URL(href);
  const source = (url.searchParams.get('utm_source') || '').toLowerCase();
  const medium = (url.searchParams.get('utm_medium') || '').toLowerCase();
  if (source || medium) return {
    source: JOURNEY_SOURCES.includes(source) && !['direct', 'internal_unknown'].includes(source) ? source : 'other_campaign',
    medium: /^(cpc|ppc|paid|paid_social|display)$/.test(medium) ? 'paid' : JOURNEY_MEDIA.includes(medium) ? medium : 'unknown',
  };
  if (!referrer) return { source: 'direct', medium: 'none' };
  let host;
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { return { source: 'other_referral', medium: 'unknown' }; }
  if (host === url.hostname || /^(www\.)?australianhomecollective\.com\.au$/.test(host)) return { source: 'internal_unknown', medium: 'unknown' };
  const matches = (domain) => host === domain || host.endsWith('.' + domain);
  if (/^(www\.)?google\.(com|com\.au|co\.uk|co\.nz)$/.test(host)) return { source: 'google', medium: 'organic' };
  for (const domain of ['bing.com', 'duckduckgo.com']) if (matches(domain)) return { source: domain.split('.')[0], medium: 'organic' };
  if (matches('yahoo.com')) return { source: 'yahoo', medium: 'referral' };
  for (const domain of ['facebook.com', 'instagram.com']) if (matches(domain)) return { source: domain.split('.')[0], medium: 'social' };
  if (matches('chatgpt.com')) return { source: 'chatgpt', medium: 'referral' };
  if (host === 'mail.google.com' || host === 'outlook.live.com') return { source: 'email', medium: 'email' };
  return { source: 'other_referral', medium: 'referral' };
}
