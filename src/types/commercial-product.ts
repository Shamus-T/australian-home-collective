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
  | "commission-factory"
  | "direct"
  | "other";

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

export interface AffiliateProgramConfig {
  trackingParameter: string;
  trackingValue: string;
  allowedHosts: string[];
}

export interface CommercialProduct {
  id: string;
  guidePath: string;
  name: string;
  productType: string;
  summary: string;
  merchant: string;
  destinationUrl: string;
  linkLabel: string;
  affiliate: boolean;
  affiliateNetwork: AffiliateNetwork | null;
  editorialStatus: CommercialEditorialStatus;
  researchOutcome: ProductResearchOutcome | null;
  evidenceConfidence: EvidenceConfidence | null;
  recallSafetyStatus: RecallSafetyStatus;
  lastReviewedOn: string | null;
  approvedForAffiliateUse: boolean;
  testingStatus: ProductTestingStatus;
  testingNotes: string;
  drawbacks: string[];
  suitability: ProductSuitability;
  sourceRecords: ProductSourceRecord[];
}

export interface CommercialProductCatalogue {
  $schema: string;
  version: 2;
  updatedOn: string;
  reviewIntervalDays: number;
  affiliatePrograms: Partial<Record<AffiliateNetwork, AffiliateProgramConfig>>;
  enabledGuidePaths: string[];
  products: CommercialProduct[];
}
