import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import { JOURNEY_VERSION, JOURNEY_GUIDES, classifyJourneySource } from '../src/lib/buying-journey.mjs';
import { validateJourney, onRequestPost } from '../functions/api/buying-journey.js';
import { shouldTrackAnalytics } from '../src/scripts/analytics-preference.js';
import { journeyQuery } from '../scripts/buying-journey-report.mjs';
const event={eventId:'550e8400-e29b-41d4-a716-446655440000',pageId:'550e8400-e29b-41d4-a716-446655440001',sessionId:'qa_journey_20261101',guidePath:Object.keys(JOURNEY_GUIDES)[0],version:JOURNEY_VERSION,stage:'guide_view',productId:'',placement:'',source:'google',medium:'organic',device:'mobile',elapsedMs:10};
test('source categories discard URL paths, search terms and arbitrary campaign data',()=>{
 assert.deepEqual(classifyJourneySource('https://australianhomecollective.com.au/', 'https://www.google.com/search?q=private'),{source:'google',medium:'organic'});
 assert.deepEqual(classifyJourneySource('https://australianhomecollective.com.au/?utm_source=person@example.com&utm_medium=secret'),{source:'other_campaign',medium:'unknown'});
 assert.equal(classifyJourneySource('https://australianhomecollective.com.au/','https://australianhomecollective.com.au/guides/').source,'internal_unknown');
 assert.equal(classifyJourneySource('https://australianhomecollective.com.au/','https://notgoogle.com/').source,'other_referral');
});
test('exact approved product membership, stage identity and bounded input enforced',()=>{
 assert.ok(validateJourney(event));
 for(const change of [{guidePath:'/guides/other/'},{source:'secret@example.com'},{stage:'purchase'},{elapsedMs:-1},{productId:'anything'},{version:'old'},{pageId:'bad'},{sessionId:''}])assert.equal(validateJourney({...event,...change}),false);
 assert.ok(validateJourney({...event,stage:'retailer_click',productId:JOURNEY_GUIDES[event.guidePath][0],placement:'comparison'}));
 assert.ok(validateJourney({...event,guidePath:'/guides/washing-machine-and-dryer-space-what-to-measure-before-buying-storage/',stage:'retailer_click',productId:'bosch-wtz11400-good-guys',placement:'stack'}));
 assert.equal(validateJourney({...event,stage:'retailer_click',productId:JOURNEY_GUIDES[event.guidePath][0],placement:'unknown-location'}),false);
 const catalogue=JSON.parse(fs.readFileSync('src/data/commercial-products.json'));
 for(const [path, ids] of Object.entries(JOURNEY_GUIDES))assert.deepEqual(ids.slice().sort(),catalogue.products.filter(p=>p.guidePath===path&&p.editorialStatus==='approved'&&p.presentation!=='comparison-only').map(p=>p.id).sort());
});
test('internal query, stored optout, labelled sessions and previews never track',()=>{
 const w={location:{href:'https://australianhomecollective.com.au/?ahc_internal=1',hostname:'australianhomecollective.com.au'}};
 assert.equal(shouldTrackAnalytics(w),false);
 for(const value of ['qa_abc1234','TEST_abc1234','internal_abc1234'])assert.equal(shouldTrackAnalytics({...w,location:{href:'https://australianhomecollective.com.au/',hostname:'australianhomecollective.com.au'},sessionStorage:{getItem:()=>value}}),false);
 assert.equal(shouldTrackAnalytics({...w,location:{href:'https://preview.pages.dev/',hostname:'preview.pages.dev'}}),false);
});
test('collector stores server country only, no IP or raw referrer, and keeps labelled QA auditable',async()=>{
 let values;const request=new Request('https://australianhomecollective.com.au/api/buying-journey',{method:'POST',headers:{Origin:'https://australianhomecollective.com.au','Content-Type':'application/json','CF-Connecting-IP':'203.0.113.99'},body:JSON.stringify({...event,country:'US',referrer:'https://example.com/private'})});
 Object.defineProperty(request,'cf',{value:{country:'AU'}});
 const env={AHC_ANALYTICS_DB:{prepare:()=>({bind:(...v)=>{values=v;return{run:async()=>({success:true})}}})}};
 assert.equal((await onRequestPost({request,env})).status,204);
 assert.equal(values[10],'AU');assert.equal(values[1],event.sessionId);assert.ok(!JSON.stringify(values).includes('203.0.113'));assert.ok(!JSON.stringify(values).includes('private'));
});
test('collector fails visibly for missing database or invalid origin',async()=>{
 const req=origin=>new Request('https://australianhomecollective.com.au/api/buying-journey',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(event)});
 assert.equal((await onRequestPost({request:req('https://other.com'),env:{}})).status,403);
 assert.equal((await onRequestPost({request:req('https://australianhomecollective.com.au'),env:{}})).status,503);
});
test('report uses Brisbane boundaries, known-test exclusions and ordered page cohorts',()=>{
 const q=journeyQuery('2026-11-02','2026-11-15');assert.match(q,/2026-11-01T14:00:00.000Z/);assert.match(q,/2026-11-15T14:00:00.000Z/);assert.match(q,/excluded_test_events/);assert.match(q,/elapsed_ms<=x.elapsed_ms/);assert.match(q,/unclassified_events_without_entry/);assert.throws(()=>journeyQuery('2026-11-31','2026-12-01'));
});
