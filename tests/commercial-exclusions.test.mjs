import test from 'node:test';
import assert from 'node:assert/strict';
import {hasExcludedCommercialIdentity} from '../src/lib/commercial-exclusions.mjs';

test('Westinghouse split exclusion recognises names, model codes and encoded offers',()=>{
  for(const p of [
    {name:'WESTINGHOUSE reverse-cycle split-system'},
    {id:'westinghouse-wsd27hwc'},
    {name:'Westinghouse air conditioner',productType:'Split system'},
    {name:'Air conditioner',destinationUrl:'https://example.com/destination:westinghouse%2Dsplit%2Dsystem'},
  ]) assert.equal(hasExcludedCommercialIdentity(p),true,JSON.stringify(p));
});
test('category exclusion preserves other Westinghouse appliances and other split brands',()=>{
  for(const name of ['Westinghouse WRF610SA rangehood','Westinghouse WTM4302WD-R refrigerator','Westinghouse portable air conditioner','Panasonic CS/CU-Z35AKR split system']) {
    assert.equal(hasExcludedCommercialIdentity({name}),false,name);
  }
});
