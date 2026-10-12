import { editorialDate } from "./editorial-date.mjs";
/** @typedef {import('../types/commercial-product').CommercialProduct} CommercialProduct */
/** @typedef {import('../types/commercial-product').CommercialRetailerOffer} CommercialRetailerOffer */

const networks = new Set(['amazon-australia', 'partnerize', 'commission-factory', 'direct', 'other']);
const dayMilliseconds = 86_400_000;

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;
}

function isHttps(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function currentDate(value, today, interval) {
  return isDate(value) && value <= today
    && Date.parse(today) - Date.parse(value) <= interval * dayMilliseconds;
}

/** The original retailer fields remain the primary feed-monitor record.
 * @param {CommercialProduct} product
 * @returns {CommercialRetailerOffer[]}
 */
export function getRegisteredRetailers(product) {
  return [product, ...(Array.isArray(product.additionalRetailers) ? product.additionalRetailers : [])];
}

/** Additional listings must match the same product assessment, including its variant.
 * Commission evidence concerns the applicable product/category rate, never a headline maximum.
 * @param {CommercialProduct} product
 * @param {{today?: string, reviewIntervalDays?: number}} options
 */
export function getRetailerOfferErrors(product, {
  today = editorialDate(), reviewIntervalDays = 180,
} = {}) {
  const errors = [];
  if (product.additionalRetailers !== undefined && !Array.isArray(product.additionalRetailers)) {
    return ['additionalRetailers must be an array.'];
  }
  const offers = getRegisteredRetailers(product);
  const destinations = new Set();
  const merchants = new Set();
  offers.forEach((offer, index) => {
    const prefix = index === 0 ? 'primary retailer' : `additionalRetailers[${index - 1}]`;
    if (!offer || typeof offer !== 'object' || Array.isArray(offer)) {
      errors.push(`${prefix} must be a retailer record.`);
      return;
    }
    const merchant = typeof offer.merchant === 'string' ? offer.merchant.trim().toLowerCase() : '';
    if (index > 0) {
      if (!merchant || !isHttps(offer.destinationUrl)) errors.push(`${prefix} needs a retailer name and HTTPS destination.`);
      if (offer.affiliate !== true || offer.approvedForAffiliateUse !== true || !networks.has(offer.affiliateNetwork)) {
        errors.push(`${prefix} needs explicit affiliate approval and a configured network.`);
      }
      const validation = offer.affiliateValidation;
      if (!validation || !currentDate(validation.checkedOn, today, reviewIntervalDays)
        || validation.destinationStatus !== 'reachable'
        || validation.productIdentityStatus !== 'verified'
        || !['in-stock', 'available-to-order'].includes(validation.australianAvailabilityStatus)
        || !['baseline-recorded', 'unchanged'].includes(validation.listingStatus)
        || validation.specificationsStatus !== 'matched'
        || !['matched', 'not-applicable'].includes(validation.safetyComplianceStatus)
        || validation.trackingStatus !== 'verified') {
        errors.push(`${prefix} needs current verification of the exact model/variant, Australian availability, specifications, safety and tracking.`);
      }
      const sources = Array.isArray(offer.sourceRecords) ? offer.sourceRecords : [];
      if (sources.some((source) => !source || !isHttps(source.sourceUrl)
        || !currentDate(source.checkedOn, today, reviewIntervalDays)
        || ['title', 'publisher', 'supports'].some((field) => typeof source[field] !== 'string' || !source[field].trim()))) {
        errors.push(`${prefix} has incomplete or outdated evidence records.`);
      }
      if (!sources.some((source) => source?.sourceType === 'seller-fulfilment'
        && source.sourceUrl === offer.destinationUrl && source.checkedOn === validation?.checkedOn)
        || !sources.some((source) => source?.sourceType === 'australian-availability-support'
          && source.checkedOn === validation?.checkedOn)) {
        errors.push(`${prefix} needs current seller/fulfilment and Australian availability evidence for its own listing.`);
      }
    }
    if (destinations.has(offer.destinationUrl) || merchants.has(merchant)) {
      errors.push(`${prefix} duplicates a retailer or destination for this product.`);
    }
    destinations.add(offer.destinationUrl);
    merchants.add(merchant);

    const commission = offer.commission;
    if (offers.length > 1 && offer.affiliate && !commission) {
      errors.push(`${prefix} needs a verified product-specific commission rate before retailer ordering.`);
    }
    if (commission !== undefined) {
      if (!offer.affiliate || !commission || typeof commission !== 'object'
        || !Number.isFinite(commission.ratePercent) || commission.ratePercent < 0 || commission.ratePercent > 100
        || !currentDate(commission.checkedOn, today, 30)
        || !isDate(commission.validUntil) || commission.validUntil < today
        || !isHttps(commission.sourceUrl)
        || typeof commission.applicability !== 'string' || commission.applicability.trim().length < 20) {
        errors.push(`${prefix} commission must have a current applicable percentage, expiry, source and product/category exclusions check.`);
      }
    }
  });
  return errors;
}

/** Only retailer links are sorted; the product assessments keep their editorial order.
 * @param {CommercialProduct} product
 * @param {{today?: string, reviewIntervalDays?: number}} options
 * @returns {CommercialRetailerOffer[]}
 */
export function getOrderedRetailers(product, options = {}) {
  const errors = getRetailerOfferErrors(product, options);
  if (errors.length) throw new Error(`Commercial product "${product.id}": ${errors.join(' ')}`);
  return getRegisteredRetailers(product).sort((a, b) =>
    (b.commission?.ratePercent ?? 0) - (a.commission?.ratePercent ?? 0)
    || a.merchant.localeCompare(b.merchant, 'en-AU'));
}
