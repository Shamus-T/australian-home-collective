export const siteOrigin = 'https://australianhomecollective.com.au';

export function sitemapUrls(xml) {
  return [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]))];
}

export function validateUrls(urls) {
  if (!urls.length || urls.length > 10000) throw new Error('IndexNow requires 1–10,000 URLs.');
  for (const value of urls) {
    const url = new URL(value);
    if (url.origin !== siteOrigin || url.search || url.hash || url.username || url.password) {
      throw new Error('Only canonical public AHC URLs may be submitted.');
    }
  }
  return [...new Set(urls)];
}

export function changedUrls({ files, urls, previousProducts = [], products = [], previousComparisons = {}, comparisons = {} }) {
  const routes = new Set();
  // Shared presentation changes can affect every indexed page.
  if (files.some(file => /^src\/(components|layouts|styles|scripts)\//.test(file))) return validateUrls(urls);
  for (const file of files) {
    if (file === 'src/pages/index.astro') routes.add('/');
    const match = file.match(/^src\/pages\/(.+)\/index\.astro$/);
    if (match && !match[1].includes('[')) routes.add('/' + match[1] + '/');
  }
  if (files.includes('src/data/commercial-products.json') || files.includes('src/data/appliance-buying-comparisons.json')) {
    const old = new Map(previousProducts.map(product => [product.id, product]));
    const next = new Map(products.map(product => [product.id, product]));
    for (const id of new Set([...old.keys(), ...next.keys()])) {
      if (JSON.stringify(old.get(id)) !== JSON.stringify(next.get(id))
        || JSON.stringify(previousComparisons[id]) !== JSON.stringify(comparisons[id])) {
        if (old.get(id)) routes.add(old.get(id).guidePath);
        if (next.get(id)) routes.add(next.get(id).guidePath);
      }
    }
  }
  // The sitemap allowlist excludes redirects, account routes and non-indexable pages.
  return urls.filter(url => routes.has(new URL(url).pathname));
}
