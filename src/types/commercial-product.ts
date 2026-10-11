export type CommercialEditorialStatus =
  | "draft"
  | "in-review"
  | "approved"
  | "paused"
  | "rejected";

export type ProductResearchOutcome =
  | "research-supported"
  | "promising-limited-evidence"
  | "mixed-not-promoted"
  | "does-not-meet-standard";

export type EvidenceConfidence = "high" | "moderate" | "low";

export type RecallSafetyStatus =
  | "clear"
  | "check-required"
  | "active-recall"
  | "unresolved-safety-concern";

export type ProductTestingStatus = "research-only" | "hands-on-tested";

export type ProductSourceType =
  | "manufacturer-specification"
  | "manufacturer-warranty"
  | "independent-expert-review"
  | "technical-review"
  | "owner-feedback"
  | "australian-availability-support"
  | "regulator-recall-check"
  | "seller-fulfilment";

export type AffiliateNetwork =
  | "amazon-australia"
  | "partnerize"
  | "commission-factory"
  | "direct"
  | "other";

export type AffiliateDestinationStatus = "reachable" | "unreachable";

export type AffiliateProductIdentityStatus = "verified" | "mismatch" | "unverified";

export type AffiliateAustralianAvailabilityStatus =
  | "in-stock"
  | "available-to-order"
  | "temporarily-unavailable"
  | "unavailable"
  | "unknown";

export type AffiliateListingStatus =
  | "baseline-recorded"
  | "unchanged"
  | "materially-changed"
  | "unverified";

export type AffiliateSpecificationStatus = "matched" | "mismatch" | "unverified";

export type AffiliateSafetyComplianceStatus =
  | "matched"
  | "not-applicable"
  | "mismatch"
  | "unverified";

export type AffiliateTrackingStatus = "verified" | "invalid" | "unverified";

export interface ProductSourceRecord {
  sourceType: ProductSourceType;
  title: string;
  publisher: string;
  sourceUrl: string;
  supports: string;
  checkedOn: string;
}

export interface ProductSuitability {
  suits: string[];
  mayNotSuit: string[];
}

export interface AffiliateProductValidation {
  checkedOn: string;
  destinationStatus: AffiliateDestinationStatus;
  productIdentityStatus: AffiliateProductIdentityStatus;
  australianAvailabilityStatus: AffiliateAustralianAvailabilityStatus;
  listingStatus: AffiliateListingStatus;
  specificationsStatus: AffiliateSpecificationStatus;
  safetyComplianceStatus: AffiliateSafetyComplianceStatus;
  trackingStatus: AffiliateTrackingStatus;
}

export interface AffiliateProgramConfig {
  trackingParameter: string;
  trackingValue: string;
  allowedHosts: string[];
}

export interface RetailerCommission {
  ratePercent: number;
  checkedOn: string;
  validUntil: string;
  sourceUrl: string;
  applicability: string;
}

export interface CommercialRetailerOffer {
  merchant: string;
  destinationUrl: string;
  affiliate: boolean;
  affiliateNetwork: AffiliateNetwork | null;
  approvedForAffiliateUse: boolean;
  affiliateValidation: AffiliateProductValidation | null;
  sourceRecords: ProductSourceRecord[];
  commission?: RetailerCommission;
}

export interface CommercialProduct extends CommercialRetailerOffer {
  id: string;
  guidePath: string;
  name: string;
  productType: string;
  summary: string;
  image?: {
    src: string;
    srcSet: string;
    alt: string;
    width: number;
    height: number;
    credit: string;
    sourceUrl: string;
    suppliedVia: string;
    checkedOn: string;
  };
  manufacturerPrice?: { amount: number; currency: "AUD"; kind: "manufacturer-direct"; manufacturer: string; sourceUrl: string; checkedOn: string; reviewDueOn: string; evidence: string; };
  linkLabel: string;
  additionalRetailers?: CommercialRetailerOffer[];
  editorialStatus: CommercialEditorialStatus;
  researchOutcome: ProductResearchOutcome | null;
  evidenceConfidence: EvidenceConfidence | null;
  recallSafetyStatus: RecallSafetyStatus;
  lastReviewedOn: string | null;
  testingStatus: ProductTestingStatus;
  testingNotes: string;
  drawbacks: string[];
  suitability: ProductSuitability;
}

export interface CommercialProductCatalogue {
  $schema: string;
  version: 3;
  updatedOn: string;
  reviewIntervalDays: number;
  affiliatePrograms: Partial<Record<AffiliateNetwork, AffiliateProgramConfig>>;
  enabledGuidePaths: string[];
  products: CommercialProduct[];
}
