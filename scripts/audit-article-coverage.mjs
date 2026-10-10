import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {coverageStatus} from './lib/coverage-status.mjs';
const root=process.cwd();
const registry=JSON.parse(fs.readFileSync('src/data/article-commercial-coverage.json'));
const c=JSON.parse(fs.readFileSync('src/data/commercial-products.json'));
const errors=[];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const sources=walk('src/pages').filter(f=>f.endsWith('.astro')&&fs.readFileSync(f,'utf8').includes('<ArticleLayout'));
const route=f=>'/'+f.replaceAll('\\','/').replace(/^src\/pages\//,'').replace(/index\.astro$/,'').replace(/\.astro$/,'/');
const known=new Set();const rows=[];
for(const a of registry.articles){
 if(known.has(a.guidePath))errors.push('Duplicate coverage route '+a.guidePath);known.add(a.guidePath);
 const file=sources.find(f=>route(f)===a.guidePath);
 if(!file){errors.push('Coverage record has no article: '+a.guidePath);continue;}
 const source=fs.readFileSync(file,'utf8');
 if(createHash('sha256').update(source.replaceAll("\r\n", "\n")).digest('hex')!==a.reviewedSourceSha256)errors.push('Re-review article topic/placement after source changes: '+a.guidePath);
 const result=coverageStatus(a,c.products);errors.push(...result.issues.map(e=>a.guidePath+': '+e));
 const liveProducts=c.products.filter(p=>p.guidePath===a.guidePath&&p.editorialStatus==='approved');
 if(liveProducts.length&&!source.includes('<CommercialProductBlock'))errors.push('Product section absent: '+a.guidePath);
 if(process.argv.includes('--dist')){
  const html=fs.readFileSync(path.join('dist',a.guidePath,'index.html'),'utf8');
  for(const p of liveProducts){
   if(!html.includes('id="product-'+p.id+'"'))errors.push('Product card absent from output: '+p.id);
   if(!html.includes('data-commercial-product-id="'+p.id+'"'))errors.push('Retailer link absent from output: '+p.id);
  }
  const declared=(html.match(/data-accessory-product-ids="([^"]*)"/)?.[1]??'').split(/\s+/).filter(Boolean);
  for(const id of declared)if(!a.supportingProductIds.includes(id))errors.push('Rendered accessory counted as primary: '+id);
 }
 rows.push({...a,...result,reviewDates:[...new Set(liveProducts.map(p=>p.lastReviewedOn))].sort(),productNames:liveProducts.map(p=>p.name)});
}
for(const f of sources)if(!known.has(route(f)))errors.push('New article needs explicit product-coverage review: '+route(f));
const counts=Object.fromEntries(['primary-present','partial-primary','missing-primary','editorial'].map(s=>[s,rows.filter(r=>r.status===s).length]));
const summary={articles:rows.length,...counts,articlesWithImageGaps:rows.filter(r=>r.imageGaps.length).length,articlesWithIllustrativeProductImages:rows.filter(r=>r.illustrativeImages.length).length,errors:errors.length};
const report={updatedOn:registry.updatedOn,scope:'All published ArticleLayout pages: topic-to-product coverage, direct placements and known image gaps. Primary-present means researched options exist for the recorded categories, not exhaustive market coverage. Existing retailer checks retain their original review dates. Separate commercial and artwork audits validate destinations, tracking metadata, disclosures and approved logo bytes. This is not a fresh live stock check of every old listing.',summary,errors,articles:rows};
const output=process.argv.find(x=>x.startsWith('--report='))?.slice(9);
if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('Article coverage audit: '+JSON.stringify(summary));
console.log(`OPEN RESEARCH: ${counts['missing-primary']} articles lack primary options; ${counts['partial-primary']} have uncovered categories. These are not passed-off as complete by contextual links or accessories.`);
for(const e of errors)console.error(e);
if(errors.length)process.exitCode=1;
