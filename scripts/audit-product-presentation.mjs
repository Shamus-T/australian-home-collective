import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root=process.cwd();
const catalogue=JSON.parse(fs.readFileSync(path.join(root,'src/data/commercial-products.json'),'utf8'));
const products=catalogue.products.filter(p=>p.editorialStatus==='approved');
const knownGaps=JSON.parse(fs.readFileSync(path.join(root,'docs/editorial/product-image-follow-up.json'),'utf8'));
const errors=[];const warnings=[];
for(const p of products){
  if(!p.image){if(!knownGaps.products.some(x=>x.id===p.id))errors.push(`${p.id}: new product image gap`);else warnings.push(`${p.id}: exact-model image still needed`);continue;}
  for(const field of ['alt','credit','sourceUrl','suppliedVia','checkedOn'])if(!p.image[field])errors.push(`${p.id}: missing image ${field}`);
  const variants=p.image.srcSet.split(',').map(s=>s.trim().split(/\s+/));
  for(const [src,width]of variants){const local=path.join(root,'public',src);if(!fs.existsSync(local)){errors.push(`${p.id}: missing ${src}`);continue;}const meta=await sharp(local).metadata();if(meta.width!==Number(width.replace('w','')))errors.push(`${p.id}: incorrect srcset width ${src}`);}
  const local=path.join(root,'public',p.image.src);if(fs.existsSync(local)){const meta=await sharp(local).metadata();if(meta.width!==p.image.width||meta.height!==p.image.height)errors.push(`${p.id}: image dimensions disagree with file`);}else errors.push(`${p.id}: missing main image`);
}
const dist=path.join(root,'dist');const pages=[];const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.html'))pages.push(f);}};walk(dist);
let articleCount=0,commercialPages=0,buttons=0,cardCount=0;
for(const file of pages){const html=fs.readFileSync(file,'utf8');const article=html.match(/<article\b[^>]*class="content narrow"[^>]*>([\s\S]*)/);if(article)articleCount++;const cards=[...html.matchAll(/<article\b[^>]*data-commercial-product-card[^>]*>/g)];cardCount+=cards.length;if(cards.length){commercialPages++;if(!article||!/^\s*<p\b[^>]*class="commercial-product-shortcut"/.test(article[1]))errors.push(`${file}: jump link must begin the article`);const jump=html.match(/class="commercial-product-shortcut"[^>]*>\s*<a[^>]*href="#([^"]+)"/);if(!jump||!html.includes(`id="${jump[1]}"`))errors.push(`${file}: jump target missing`);}
  for(const a of html.matchAll(/<a\b([^>]*data-commercial-link[^>]*)>([\s\S]*?)<\/a>/g)){buttons++;const attrs=a[1];const label=attrs.match(/aria-label="([^"]+)"/)?.[1];if(!label||!attrs.includes('sponsored')||!attrs.includes('data-affiliate-trackable="true"'))errors.push(`${file}: retailer accessibility/tracking attributes missing`);if(/commercial-retailer-link--(?:amazon|good-guys)/.test(attrs)){const img=a[2].match(/<img\b([^>]+)>/);const src=img?.[1].match(/src="([^"]+)"/)?.[1];if(!src||!src.startsWith('/images/retailers/')||!fs.existsSync(path.join(dist,src)))errors.push(`${file}: retailer logo asset missing`);if(!img?.[1].includes('loading="eager"')||!/alt="[^"]+"/.test(img[1]))errors.push(`${file}: retailer logo must have eager loading and readable fallback`);}}
}
const result={pages:pages.length,articles:articleCount,commercialPages,cards:cardCount,retailerButtons:buttons,productsWithImages:products.filter(p=>p.image).length,productsMissingImages:products.filter(p=>!p.image).length,errors,warnings};
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));else{console.log(JSON.stringify({...result,errors:errors.length,warnings:warnings.length},null,2));warnings.forEach(w=>console.warn('FOLLOW-UP: '+w));errors.forEach(e=>console.error(e));}
if(errors.length)process.exitCode=1;

