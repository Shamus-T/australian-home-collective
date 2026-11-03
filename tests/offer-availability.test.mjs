import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
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
const bnd='https://www.bedsndreams.com.au/products/example-mattress?variant=123';
const bndListing=(delivery,variant='123',schemaStock='InStock',url=bnd)=>{
 const values=['selectedVariant',{'_0':2},'gid://shopify/ProductVariant/'+variant];
 return `<title>Example mattress</title><script type="application/ld+json">${JSON.stringify({'@type':'Product',name:'Example mattress',url:url.split('?')[0],offers:[{url,availability:'https://schema.org/'+schemaStock}]})}</script><h1>Example mattress</h1>Delivering from Queensland Change Delivery ${delivery} Try in store<script>streamController.enqueue(${JSON.stringify(JSON.stringify(values))})</script>`;
};
test('cloud identity report never counts foreign-region stock as available; local mode flags it',t=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'ahc-bnd-scope-'));
 assert.ok(path.resolve(folder).startsWith(path.resolve(os.tmpdir())+path.sep));
 t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const offers=selectOffers(JSON.parse(fs.readFileSync('src/data/commercial-products.json','utf8')),'Beds n Dreams');
 const requests=offers.map((o,index)=>({url:o.url,index,status:200}));
 for(const o of requests)fs.writeFileSync(path.join(folder,o.index+'.html'),bndListing('GET IT NOW',new URL(o.url).searchParams.get('variant'),'InStock',o.url).replace('Queensland','OR'));
 fs.writeFileSync(path.join(folder,'requests.json'),JSON.stringify(requests));
 const output=path.join(folder,'report.json');
 const args=['scripts/monitor-offer-availability.mjs','--merchant=Beds n Dreams','--snapshots='+folder,'--output='+output];
 assert.equal(spawnSync(process.execPath,[...args,'--identity-only'],{encoding:'utf8'}).status,0);
 let report=JSON.parse(fs.readFileSync(output));assert.equal(report.counts.available,undefined);assert.equal(report.counts['identity-verified'],offers.length);assert.match(report.scope,/Stock remains unverified/);
 assert.equal(spawnSync(process.execPath,args,{encoding:'utf8'}).status,1);
 report=JSON.parse(fs.readFileSync(output));assert.equal(report.faults.length,offers.length);assert.equal(report.counts.unverified,offers.length);
});
test('Beds n Dreams requires selected variant and regional delivery, not aggregate schema stock',()=>{
 assert.equal(inspectProduct(bnd,{status:200,html:bndListing('GET IT NOW')}).status,'available');
 assert.equal(inspectProduct(bnd,{status:200,html:bndListing('Out of stock')}).status,'unavailable');
 assert.equal(inspectProduct(bnd,{status:200,html:bndListing('Available in 8 weeks')}).status,'unverified');
 assert.equal(inspectProduct(bnd,{status:200,html:bndListing('GET IT NOW','999')}).status,'identity-mismatch');
 assert.equal(inspectProduct(bnd,{status:200,html:bndListing('GET IT NOW','123','OutOfStock')}).status,'unverified');
 assert.equal(inspectProduct(bnd,{status:200,html:bndListing('GET IT NOW').replace('Delivering from','Region hidden')}).status,'unverified');
 assert.equal(inspectProduct(bnd,{status:200,html:bndListing('GET IT NOW').replace('Queensland','OR')}).status,'unverified');
 assert.equal(inspectProduct(bnd,{status:200,html:bndListing('GET IT NOW').replace('streamController.enqueue','doNotExecute')}).status,'identity-mismatch');
});
test('Beds n Dreams availability fetch rejects commission redirects and preserves safe variant',async()=>{
 let calls=0;
 const mock=async(url,options)=>{calls++;assert.equal(url,bnd);assert.equal(options.redirect,'manual');assert.equal(options.credentials,'omit');return {status:302};};
 await assert.rejects(()=>fetchProduct('https://bnd.prf.hn/click/camref:1110lSAJY/destination:'+encodeURIComponent(bnd),mock));
 assert.equal(calls,0);assert.equal((await fetchProduct(bnd,mock)).status,302);assert.equal(calls,1);
});
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
