import test from 'node:test';
import assert from 'node:assert/strict';
import {coverageStatus} from '../scripts/lib/coverage-status.mjs';
const p={id:'seal',guidePath:'/guide/',editorialStatus:'approved',image:{credit:'Retailer photograph'}};
const a={guidePath:'/guide/',intent:'buying',supportingProductIds:['seal'],requiredProductTypes:[{label:'Portable air conditioner',productIds:[],gapReason:'No exact model cleared yet'}]};
test('a working accessory and contextual guide link cannot pass primary coverage',()=>{
 const r=coverageStatus({...a,contextualRoutes:['/cooling/']},[p]);assert.equal(r.status,'missing-primary');assert.equal(r.supportingProducts,1);
});
test('an accessory cannot be relabelled a primary recommendation',()=>{
 const r=coverageStatus({...a,requiredProductTypes:[{label:'Portable AC',productIds:['seal']}]},[p]);assert.match(r.issues.join(' '),/Accessory cannot/);assert.equal(r.status,'missing-primary');
});
test('removing or pausing a reviewed primary product requires attention',()=>{
 const r=coverageStatus({...a,supportingProductIds:[],requiredProductTypes:[{label:'AC',productIds:['ac']}]},[]);assert.match(r.issues.join(' '),/not approved/);
});
test('one covered format does not complete a multi-format comparison',()=>{
 const r=coverageStatus({...a,supportingProductIds:[],requiredProductTypes:[{label:'Heat pump',productIds:['seal']},{label:'Vented',productIds:[],gapReason:'Not cleared'}]},[p]);assert.equal(r.status,'partial-primary');
});
test('editorial exceptions and unresolved categories must be explained',()=>{
 assert.ok(coverageStatus({...a,intent:'editorial'},[]).issues.some(x=>x.includes('reason')));
 assert.ok(coverageStatus({...a,requiredProductTypes:[{label:'AC',productIds:[]}]},[p]).issues.some(x=>x.includes('explicit research gap')));
});
