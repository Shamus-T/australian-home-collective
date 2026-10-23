import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchProduct,inspectProduct,reconcileFeed,selectOffers} from '../scripts/lib/offer-availability.mjs';
const amazon='https://www.amazon.com.au/dp/B000000001';
const listing=(stock,asin='B000000001')=>`<title>Product</title><input id="ASIN" value="${asin}"><span id="productTitle">Exact product</span><div id="availability">${stock}</div><input id="add-to-cart-button"><div>Recommendations currently unavailable</div>`;
test('availability comes from the exact ASIN purchase section, not recommendations',()=>{
 assert.equal(inspectProduct(amazon,{status:200,html:listing('In stock')}).status,'available');
 assert.equal(inspectProduct(amazon,{status:200,html:listing('Only 2 left in stock')}).status,'low-stock');
 assert.equal(inspectProduct(amazon,{status:200,html:listing('Currently unavailable')}).status,'unavailable');
 assert.equal(inspectProduct(amazon,{status:200,html:listing('In stock','B000000002')}).status,'identity-mismatch');
 assert.equal(inspectProduct(amazon,{status:200,html:'<title>Robot Check</title>'+listing('In stock')}).status,'unverified');
 assert.equal(inspectProduct(amazon,{status:503,html:listing('In stock')}).status,'unverified');
 assert.equal(inspectProduct(amazon,{status:200,html:listing('')}).status,'unverified');
});
test('research refuses tagged URLs and never follows redirects or sends cookies',async()=>{
 let calls=0;
 const mock=async(url,options)=>{calls++;assert.equal(url,amazon);assert.equal(options.redirect,'manual');assert.equal(options.credentials,'omit');assert.equal(options.headers.Cookie,undefined);assert.equal(options.headers.Referer,undefined);return {status:302};};
 await assert.rejects(()=>fetchProduct(amazon+'?tag=ahc07-22',mock));
 await assert.rejects(()=>fetchProduct('https://prf.hn/click/camref/example',mock));
 assert.equal(calls,0);
 assert.equal((await fetchProduct(amazon,mock)).status,302);assert.equal(calls,1);
});
const gg='https://www.thegoodguys.com.au/exact-model-abc';
const ggListing=body=>`<title>Exact Product</title><script type="application/ld+json">${JSON.stringify({'@type':'Product',model:'ABC',offers:{url:gg,availability:'https://schema.org/InStock'}})}</script><h1>Exact Product</h1>${body}`;
test('Good Guys discontinued status overrides stale structured stock; supplier order is distinct',()=>{
 assert.equal(inspectProduct(gg,{status:200,html:ggListing('NOT AVAILABLE This product is no longer available')}).status,'unavailable');
 assert.equal(inspectProduct(gg,{status:200,html:ggListing('Ordered from supplier on purchase ADD TO CART')}).status,'supplier-order');
 assert.equal(inspectProduct(gg,{status:200,html:ggListing('ADD TO CART')}).status,'available');
});
test('only a fresh matching supplier-order page explains feed Stock=No',()=>{
 const fault={url:gg,sku:'ABC',reason:'Feed flags out of stock'};
 const page={url:gg,identity:'ABC',status:'supplier-order'};
 assert.deepEqual(reconcileFeed({selectedOffers:1,faults:[fault]},[page]),[]);
 for(const bad of [{...page,identity:'OTHER'},{...page,status:'unverified'},{...page,url:amazon}]) assert.equal(reconcileFeed({selectedOffers:1,faults:[fault]},[bad]).length,1);
 assert.equal(reconcileFeed({selectedOffers:1,faults:[{...fault,reason:'Product missing from feed'}]},[page]).length,1);
 assert.equal(reconcileFeed(null,[page])[0].status,'monitor-error');
});
test('additional approved retailers are included and duplicates are checked once',()=>{
 const p={id:'one',name:'Product',guidePath:'/guides/test/',editorialStatus:'approved',merchant:'Amazon AU',affiliate:true,approvedForAffiliateUse:true,destinationUrl:amazon+'?tag=ahc07-22',additionalRetailers:[{merchant:'The Good Guys',affiliate:true,approvedForAffiliateUse:true,destinationUrl:gg}]};
 assert.equal(selectOffers({products:[p,{...p,id:'two'}]}).length,2);
 assert.equal(selectOffers({products:[p]},'The Good Guys').length,1);
});
