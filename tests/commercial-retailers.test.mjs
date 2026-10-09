import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrderedRetailers, getRetailerOfferErrors } from '../src/lib/commercial-retailers.mjs';

const today = '2026-10-10';
const options = { today, reviewIntervalDays: 180 };

function retailer(merchant, ratePercent) {
  const destinationUrl = `https://example.com/${merchant.toLowerCase().replaceAll(' ', '-')}`;
  return {
    merchant, destinationUrl, affiliate: true, affiliateNetwork: 'direct', approvedForAffiliateUse: true,
    affiliateValidation: {
      checkedOn: today, destinationStatus: 'reachable', productIdentityStatus: 'verified',
      australianAvailabilityStatus: 'in-stock', listingStatus: 'unchanged', specificationsStatus: 'matched',
      safetyComplianceStatus: 'matched', trackingStatus: 'verified',
    },
    sourceRecords: ['seller-fulfilment', 'australian-availability-support'].map((sourceType) => ({
      sourceType, sourceUrl: destinationUrl, title: 'Verified exact model and variant', publisher: merchant,
      supports: 'Matching product, Australian stock and seller/fulfilment checked.', checkedOn: today,
    })),
    commission: { ratePercent, checkedOn: today, validUntil: '2026-10-31', sourceUrl: 'https://example.com/terms',
      applicability: 'Fixture product-specific rate with category and promotion exclusions checked.' },
  };
}

function product() {
  return { id: 'fixture-model', name: 'Fixture model', ...retailer('Amazon', 2),
    additionalRetailers: [retailer('The Good Guys', 5), retailer('Appliances Online', 3)] };
}

test('retailer commission order leaves the product assessment and source order intact', () => {
  const input = product();
  const before = structuredClone(input);
  const offers = getOrderedRetailers(input, options);
  assert.deepEqual(offers.map((offer) => offer.merchant), ['The Good Guys', 'Appliances Online', 'Amazon']);
  assert.deepEqual(offers.map((offer) => offer.commission.ratePercent), [5, 3, 2]);
  assert.deepEqual(input, before);
  assert.equal(offers[2].name, 'Fixture model');
});

test('equal commission rates use a stable alphabetical order', () => {
  const input = product();
  input.commission.ratePercent = 3;
  input.additionalRetailers[0].commission.ratePercent = 3;
  assert.deepEqual(getOrderedRetailers(input, options).map((offer) => offer.merchant),
    ['Amazon', 'Appliances Online', 'The Good Guys']);
});

test('an existing single retailer does not require invented commission data', () => {
  const input = product();
  delete input.additionalRetailers;
  delete input.commission;
  assert.deepEqual(getOrderedRetailers(input, options), [input]);
});

test('multiple retailers cannot silently rank unknown, stale, expired or invalid commission', () => {
  for (const mutate of [
    (input) => { delete input.commission; },
    (input) => { delete input.additionalRetailers[0].commission; },
    (input) => { input.commission.checkedOn = '2026-09-01'; },
    (input) => { input.commission.checkedOn = '2026-10-11'; },
    (input) => { input.commission.validUntil = '2026-10-09'; },
    (input) => { input.commission.ratePercent = -1; },
    (input) => { input.commission.ratePercent = '5'; },
    (input) => { input.commission.ratePercent = 101; },
    (input) => { input.commission.applicability = ''; },
    (input) => { input.commission.sourceUrl = ''; },
  ]) {
    const input = product();
    mutate(input);
    assert.throws(() => getOrderedRetailers(input, options), /commission/);
  }
});

test('higher commission cannot override missing approval or an invalid product listing', () => {
  for (const [field, value] of [
    ['productIdentityStatus', 'mismatch'], ['australianAvailabilityStatus', 'unavailable'],
    ['listingStatus', 'materially-changed'], ['specificationsStatus', 'mismatch'],
    ['safetyComplianceStatus', 'unverified'], ['trackingStatus', 'invalid'], ['checkedOn', '2025-01-01'],
  ]) {
    const input = product();
    input.additionalRetailers[0].affiliateValidation[field] = value;
    assert.throws(() => getOrderedRetailers(input, options), /current verification/);
  }
  const input = product();
  input.additionalRetailers[0].approvedForAffiliateUse = false;
  assert.throws(() => getOrderedRetailers(input, options), /explicit affiliate approval/);
});

test('each additional retailer needs its own seller and availability evidence', () => {
  const input = product();
  input.additionalRetailers[0].sourceRecords[0].sourceUrl = input.destinationUrl;
  assert.throws(() => getOrderedRetailers(input, options), /own listing/);
  input.additionalRetailers[0].sourceRecords = [];
  assert.throws(() => getOrderedRetailers(input, options), /own listing/);
});

test('duplicate merchants, duplicate destinations and malformed offers fail closed', () => {
  const input = product();
  input.additionalRetailers[0].merchant = ' AMAZON ';
  assert.throws(() => getOrderedRetailers(input, options), /duplicates/);
  input.additionalRetailers[0] = retailer('Other retailer', 4);
  input.additionalRetailers[0].destinationUrl = input.destinationUrl;
  assert.throws(() => getOrderedRetailers(input, options), /duplicates/);
  input.additionalRetailers[0] = null;
  assert.throws(() => getOrderedRetailers(input, options), /retailer record/);
  input.additionalRetailers = {};
  assert.deepEqual(getRetailerOfferErrors(input, options), ['additionalRetailers must be an array.']);
});
