import { editorialDate } from './editorial-date.mjs';

export function manufacturerPriceErrors(price, today = editorialDate()) {
  if (price === undefined) return [];
  if (!price || typeof price !== 'object') return ['manufacturerPrice must be a verified price record'];
  const errors = [];
  if (price.kind !== 'manufacturer-direct' || price.currency !== 'AUD' || !Number.isFinite(price.amount) || price.amount <= 0) errors.push('only positive AUD manufacturer-direct selling prices are allowed');
  for (const field of ['manufacturer', 'evidence']) if (typeof price[field] !== 'string' || !price[field].trim()) errors.push(`${field} is required`);
  try { if (new URL(price.sourceUrl).protocol !== 'https:') throw Error(); } catch { errors.push('official HTTPS sourceUrl is required'); }
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(price.checkedOn) || price.checkedOn > today) errors.push('checkedOn must be a valid non-future date');
  if (!validDate(price.reviewDueOn) || !validDate(price.checkedOn) || price.reviewDueOn <= price.checkedOn || Date.parse(price.reviewDueOn) - Date.parse(price.checkedOn) > 31 * 86400000) errors.push('reviewDueOn must be within one month after verification');
  if (validDate(price.reviewDueOn) && today >= price.reviewDueOn) errors.push('manufacturer price is due for verification: correct or remove it');
  return errors;
}

export function getDisplayManufacturerPrice(product, today = editorialDate()) {
  return product.manufacturerPrice && manufacturerPriceErrors(product.manufacturerPrice, today).length === 0 ? product.manufacturerPrice : null;
}
