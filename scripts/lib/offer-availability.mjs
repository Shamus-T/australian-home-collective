import {parse, walkSync} from 'ultrahtml';
import {decode} from 'entities';
import {researchUrl} from '../research-url.mjs';

export function selectOffers(catalogue, merchant) {
  const selected = new Map();
  for (const product of catalogue.products.filter(p => p.editorialStatus === 'approved')) {
    for (const offer of [product, ...(product.additionalRetailers ?? [])]) {
      if (!offer.affiliate || !offer.approvedForAffiliateUse || (merchant && offer.merchant !== merchant)) continue;
      const url = researchUrl(offer.destinationUrl);
      const entry = selected.get(url) ?? {url, merchant:offer.merchant, names:[], productIds:[], guides:[]};
      for (const [key, value] of [['names',product.name],['productIds',product.id],['guides',product.guidePath]]) if (!entry[key].includes(value)) entry[key].push(value);
      selected.set(url, entry);
    }
  }
  if (!selected.size) throw new Error('No approved offers selected');
  return [...selected.values()];
}

// No cookies, Referer, script execution, subresources or redirect following.
// Even a clean retailer URL may redirect to tracking: every redirect stops for review.
export async function fetchProduct(url, fetchImpl = fetch) {
  if (researchUrl(url) !== url) throw new Error('Only canonical clean product URLs may be requested');
  const response = await fetchImpl(url, {redirect:'manual', credentials:'omit',
    headers:{'User-Agent':'AHC-Availability-Monitor/1.0', 'Accept-Language':'en-AU,en;q=0.8', 'Cache-Control':'no-cache'},
    signal:AbortSignal.timeout(30000)});
  if (response.status >= 300 && response.status < 400) return {status:response.status, html:''};
  if (response.status !== 200) return {status:response.status, html:''};
  const reader = response.body.getReader(); let size=0; const chunks=[];
  try { for (;;) { const {done,value}=await reader.read(); if(done)break; size+=value.length;
    if(size>12_000_000)throw new Error('Response exceeds size limit'); chunks.push(value); }
  } finally { await reader.cancel().catch(()=>{}); }
  return {status:response.status, html:Buffer.concat(chunks).toString('utf8')};
}

const clean = s => decode(s).replace(/\s+/g,' ').trim();
function text(node, scripts=false) {
  if (node.type===2) return node.value;
  if (!scripts && ['script','style','noscript'].includes(node.name)) return '';
  return (node.children??[]).map(n=>text(n,scripts)).join(' ');
}
export function inspectProduct(url, {status,html}) {
  const result = {status:'unverified', httpStatus:status, title:'', reason:'No clear exact-product availability evidence'};
  if (status===404 || status===410) return {...result,status:'unavailable',reason:'Product URL returns '+status};
  if (status>=300 && status<400) return {...result,reason:'Redirect requires review; not followed'};
  if (status!==200) return {...result,reason:'Retailer access failed: HTTP '+status};
  const tree=parse(html),nodes=[];walkSync(tree,n=>{if(n.type===1)nodes.push(n);});
  const byId = id => nodes.find(n=>n.attributes.id===id);
  const pageTitle=clean(text(nodes.find(n=>n.name==='title')??{}));
  if (/robot check|captcha|access denied|sorry.*went wrong/i.test(pageTitle) || nodes.some(n=>/validateCaptcha|captcha/i.test(n.attributes.action??''))) {
    return {...result,reason:'Retailer bot/access challenge; no bypass attempted'};
  }
  if (new URL(url).hostname==='www.amazon.com.au') {
    const expected=url.split('/').at(-1),asin=byId('ASIN')?.attributes.value;
    result.title=clean(text(byId('productTitle')??{}));
    if (!asin || !result.title) return {...result,reason:'Primary ASIN/title missing; availability unverified'};
    if (asin.toUpperCase()!==expected) return {...result,status:'identity-mismatch',reason:'Selected ASIN differs from the approved ASIN'};
    result.identity=asin.toUpperCase();
    // Never scan recommendations or generic hidden error templates for stock phrases.
    const availability=clean(text(byId('availability')??byId('outOfStock')??{}));
    result.availability=availability.slice(0,500);
    const cart=byId('add-to-cart-button');
    const canOrder=cart && !('disabled' in cart.attributes) && cart.attributes['aria-disabled']!=='true';
    if (/currently unavailable|temporarily out of stock|out of stock|not available/i.test(availability)) {
      return {...result,status:'unavailable',reason:'Exact-ASIN availability states unavailable'};
    }
    if (canOrder && /only \d+ left|in stock|usually (?:dispatched|ships)|available to ship/i.test(availability)) {
      return {...result,status:/only \d+ left/i.test(availability)?'low-stock':/in stock/i.test(availability)?'available':'supplier-order',reason:'Exact ASIN with primary availability and order button'};
    }
    return result;
  }
  const ld=[];
  for (const n of nodes.filter(n=>n.name==='script'&&n.attributes.type==='application/ld+json')) {
    try {const v=JSON.parse(text(n,true));ld.push(...(Array.isArray(v)?v:v['@graph']??[v]));}catch{}
  }
  const p=ld.find(n=>n['@type']==='Product'),h1=nodes.find(n=>n.name==='h1');
  result.title=clean(text(h1??{}));
  if (!p?.model || !h1) return {...result,reason:'Exact retailer product identity missing'};
  const offers=Array.isArray(p.offers)?p.offers:[p.offers];
  const declared=p.url??offers.find(o=>o?.url)?.url;
  try {if(!declared||researchUrl(declared)!==url)return {...result,status:'identity-mismatch',reason:'Product metadata points to a different destination'};}catch{return {...result,status:'identity-mismatch',reason:'Unrecognised product metadata destination'};}
  result.identity=String(p.model);
  const body=clean(text(parse(html.slice(h1.loc[0].start))));
  const primary=body.slice(0,12000).split(/You May Also Like|Recommended for you|Add to Compare|Zoom In/i)[0];
  result.availability=primary.match(/.{0,40}(?:ordered from supplier on purchase|no longer available|NOT AVAILABLE|ADD TO CART).{0,100}/i)?.[0]??'';
  if (/no longer available|NOT AVAILABLE|out of stock/i.test(primary)) return {...result,status:'unavailable',reason:'Exact product purchase section says unavailable'};
  if (/ordered from supplier on purchase/i.test(primary)&&/add to cart/i.test(primary)) return {...result,status:'supplier-order',reason:'Retailer accepts supplier orders; delivery estimate required'};
  if (/add to cart/i.test(primary)&&offers.some(o=>/\/InStock$/.test(o?.availability??''))) return {...result,status:'available',reason:'Exact product offers InStock with purchase control; postcode not checked'};
  return result;
}

export function reconcileFeed(feed, pages) {
  if (!feed || !Array.isArray(feed.faults) || !Number.isInteger(feed.selectedOffers)) return [{status:'monitor-error',reason:'Feed report missing or invalid'}];
  const outstanding=[];
  for (const fault of feed.faults) {
    const page=pages.find(p=>p.url===fault.url);
    // A fresh, exact-product supplier-order observation may explain Stock=No.
    // Missing feed rows and identity/campaign faults can NEVER be waived by a live page.
    if (fault.reason==='Feed flags out of stock' && page?.status==='supplier-order' && page.identity===fault.sku) continue;
    outstanding.push({...fault,status:'feed-review'});
  }
  return outstanding;
}
