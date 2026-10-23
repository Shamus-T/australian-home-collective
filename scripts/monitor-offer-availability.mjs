import fs from 'node:fs/promises';import path from 'node:path';
import {selectOffers,fetchProduct,inspectProduct,reconcileFeed} from './lib/offer-availability.mjs';
const arg=(key,fallback)=>process.argv.find(s=>s.startsWith('--'+key+'='))?.slice(key.length+3)??fallback;
const output=arg('output','.availability-monitor/report.json'),merchant=arg('merchant',null),fixture=arg('snapshots',null),previous=arg('previous',null),feedPath=arg('feed-report',null);
await fs.mkdir(path.dirname(output),{recursive:true});
const catalogue=JSON.parse(await fs.readFile('src/data/commercial-products.json','utf8'));
const offers=selectOffers(catalogue,merchant),results=[];
let old={};if(previous){try{old=JSON.parse(await fs.readFile(previous,'utf8'));}catch{}}
const snapshots=fixture?JSON.parse(await fs.readFile(fixture+'/requests.json','utf8')):null;
const baseline=new Map((old.results??[]).map(p=>[p.url,p]));
for (const offer of offers) {
  let observed;
  try {
    const saved=snapshots?.find(p=>p.url===offer.url);
    const response=fixture?{status:saved?.status??0,html:saved?.status===200?await fs.readFile(fixture+'/'+saved.index+'.html','utf8'):''}:await fetchProduct(offer.url);
    observed=inspectProduct(offer.url,response);
  } catch {observed={status:'unverified',reason:'Network/parser failure; no availability claim'};}
  const prior=baseline.get(offer.url);
  // Keep the reviewed identity across later failures so a changed title cannot clear itself.
  const baselineTitle=prior?.baselineTitle||prior?.title||observed.title;
  if (baselineTitle && observed.title && observed.title!==baselineTitle) observed={...observed,status:'identity-review',reason:'Listing title changed; verify exact model/variant'};
  const result={...offer,...observed,baselineTitle,checkedAt:new Date().toISOString()};results.push(result);
  console.log(`${results.length}/${offers.length}: ${result.status}: ${offer.names[0]}`);
  if(!fixture)await new Promise(r=>setTimeout(r,1500));
}
let feed=null;if(feedPath){try{feed=JSON.parse(await fs.readFile(feedPath,'utf8'));}catch{}}
const feedFaults=feedPath?reconcileFeed(feed,results):[];
const faults=[...results.filter(p=>!['available','supplier-order','low-stock'].includes(p.status)),...feedFaults];
const counts=Object.fromEntries([...new Set(results.map(p=>p.status))].map(s=>[s,results.filter(p=>p.status===s).length]));
const report={version:1,checkedAt:new Date().toISOString(),mode:fixture?'saved-evidence':'live',selectedOffers:offers.length,counts,results,feedFaults,faults,
  scope:'Clean anonymous product HTML only. No affiliate redirects, cookies, browser scripts, images, analytics or cart actions. Availability is an observation for retailer default delivery context, not postcode-specific stock or proof of commission attribution.'};
await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');
const summary=`## Affiliate availability\n\n${offers.length} offers checked. ${JSON.stringify(counts)}. ${faults.length} issues require attention.\n\n${report.scope}\n\n`+results.filter(p=>p.status!=='available').map(p=>`- ${p.names[0]}: **${p.status}** — ${p.availability||p.reason}`).join('\n')+'\n'+feedFaults.map(p=>`- Feed review: ${p.name??'monitor'} — ${p.reason}`).join('\n')+'\n';
if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
console.log(summary);if(faults.length)process.exitCode=1;
