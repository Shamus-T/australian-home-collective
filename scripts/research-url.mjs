import { pathToFileURL } from 'node:url';

// Offline only. Never request a tracking URL to discover its destination.
export function researchUrl(input, depth = 0) {
  if (depth > 1) throw new Error('Nested tracking redirects are not permitted. Find a direct product URL.');
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    throw new Error('A plain HTTPS product URL is required.');
  }
  if (url.hostname === 'prf.hn') {
    const destination = url.pathname.match(/^\/click\/[^?]*\/destination:([^/]+)$/);
    if (!destination || url.search || url.hash) throw new Error('Cannot safely decode this tracking link offline. Find a direct product URL.');
    return researchUrl(decodeURIComponent(destination[1]), depth + 1);
  }
  if (['amazon.com.au', 'www.amazon.com.au'].includes(url.hostname)) {
    const asin = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i)?.[1];
    if (!asin) throw new Error('An exact Amazon product ASIN is required; search/redirect/short URLs are not permitted.');
    return `https://www.amazon.com.au/dp/${asin.toUpperCase()}`;
  }
  if (['thegoodguys.com.au', 'www.thegoodguys.com.au'].includes(url.hostname)) {
    if (!/^\/[a-z0-9]+(?:-[a-z0-9]+)+\/?$/.test(url.pathname)) {
      throw new Error('Expected a direct Good Guys product path.');
    }
    return `https://www.thegoodguys.com.au${url.pathname}`;
  }
  throw new Error('Unsupported research host. Obtain and inspect a direct manufacturer/retailer product URL; do not resolve a tracking or short link.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/research-url.mjs <product-or-affiliate-url> (offline conversion only)');
    console.log(researchUrl(process.argv[2]));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
