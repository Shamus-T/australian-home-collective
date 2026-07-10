export type CommercialProductStatus = "draft" | "approved" | "paused";

export type AffiliateNetwork = "commission-factory" | "direct" | "other";

export interface ProductEvidence {
  claim: string;
  sourceUrl: string;
  checkedOn: string;
}

export interface CommercialProduct {
  id: string;
  status: CommercialProductStatus;
  guidePath: string;
  name: string;
  productType: string;
  summary: string;
  merchant: string;
  destinationUrl: string;
  linkLabel: string;
  affiliate: boolean;
  affiliateNetwork: AffiliateNetwork | null;
  advertiserId: string;
  verifiedOn: string;
  reviewDueOn: string;
  evidence: ProductEvidence[];
}

export interface CommercialProductCatalogue {
  version: 1;
  updatedOn: string;
  enabledGuidePaths: string[];
  products: CommercialProduct[];
}
