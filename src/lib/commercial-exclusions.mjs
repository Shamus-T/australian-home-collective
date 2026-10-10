// Publisher instruction: do not promote Kogan or its owned brands or retailers.
// Portfolio reference: Kogan FY2025 Annual Report, p20 (ASX announcement 3A677153).
// This is an ownership exclusion, not a product-quality judgement.
const excludedIdentity = /\b(?:kogan|dick[ -]?smith|matt[ -]?blatt|mighty[ -]?ape|brosa|ovela|fortis|vostok|komodo|ergolux)\b/i;

export function hasExcludedCommercialIdentity(product) {
  const offers = product.additionalRetailers ?? [];
  const identities = [product.id, product.name, product.merchant, product.destinationUrl,
    ...offers.flatMap(offer => [offer.merchant, offer.destinationUrl]),
    ...(product.sourceRecords ?? []).filter(source => source.sourceType === "seller-fulfilment")
      .flatMap(source => [source.publisher, source.supports, source.sourceUrl])];
  return identities.some(value => typeof value === "string" && excludedIdentity.test(value));
}
