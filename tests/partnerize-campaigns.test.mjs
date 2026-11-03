import test from 'node:test';
import assert from 'node:assert/strict';
import {partnerizeLinkError} from '../src/lib/partnerize-campaigns.mjs';
import {researchUrl} from '../scripts/research-url.mjs';
const clean='https://www.bedsndreams.com.au/products/capri-bedside-table?variant=43488987086941';
const tracking='https://bnd.prf.hn/click/camref:1110lSAJY/destination:'+encodeURIComponent(clean);
test('Beds n Dreams campaign preserves exact product variant without requesting tracking',()=>{
 assert.equal(partnerizeLinkError(tracking,'Beds n Dreams'),null);
 assert.equal(researchUrl(tracking),clean);
 assert.equal(researchUrl(clean+'&utm_source=affiliate'),clean);
});
test('campaigns cannot be mixed and unapproved destinations fail closed',()=>{
 for(const url of [tracking.replace('1110lSAJY','1100l6vaUc'),tracking.replace('bnd.prf.hn','prf.hn'),tracking.replace('www.bedsndreams.com.au','evil.example'),tracking+'&tracking=bad',tracking.replace('products%2Fcapri-bedside-table','collections%2Fbeds')])assert.ok(partnerizeLinkError(url,'Beds n Dreams'));
 assert.ok(partnerizeLinkError(tracking,'The Good Guys'));
 for(const url of [clean+'&variant=2',clean.replace('43488987086941','bad')])assert.throws(()=>researchUrl(url));
});
