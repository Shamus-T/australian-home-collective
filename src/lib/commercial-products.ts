import catalogueData from "../data/commercial-products.json";
import type {
  CommercialProduct,
  CommercialProductCatalogue,
  ProductResearchOutcome,
} from "../types/commercial-product";

const catalogue = catalogueData as CommercialProductCatalogue;

export const researchOutcomeLabels: Record<ProductResearchOutcome, string> = {
  "research-supported": "Research-supported option",
  "promising-limited-evidence": "Promising, but evidence is limited",
  "mixed-not-promoted": "Mixed evidence — not promoted",
  "does-not-meet-standard": "Does not meet our standard",
};

export function isCommercialGuide(guidePath: string): boolean {
  return catalogue.enabledGuidePaths.includes(guidePath);
}

function addDays(dateValue: string, days: number): Date {
  const date = new Date(dateValue + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function hasCurrentReview(product: CommercialProduct): boolean {
  if (!product.lastReviewedOn) return false;
  const dueOn = addDays(product.lastReviewedOn, catalogue.reviewIntervalDays)
    .toISOString()
    .slice(0, 10);
  return dueOn >= new Date().toISOString().slice(0, 10);
}

function canRenderProduct(product: CommercialProduct): boolean {
  if (product.editorialStatus !== "approved") return false;

  const blockers: string[] = [];
  if (product.researchOutcome !== "research-supported") blockers.push("research outcome");
  if (!product.evidenceConfidence || product.evidenceConfidence === "low") {
    blockers.push("evidence confidence");
  }
  if (product.recallSafetyStatus !== "clear") blockers.push("recall or safety status");
  if (!hasCurrentReview(product)) blockers.push("review date");
  if (product.affiliate && product.approvedForAffiliateUse !== true) {
    blockers.push("affiliate approval");
  }

  if (blockers.length > 0) {
    throw new Error(
      "Commercial product \"" + product.id
      + "\" is marked approved but cannot be rendered: " + blockers.join(", ") + ".",
    );
  }
  return true;
}

export function getApprovedProductsForGuide(guidePath: string): CommercialProduct[] {
  if (!isCommercialGuide(guidePath)) {
    throw new Error("Commercial product block used on a guide that is not enabled: " + guidePath);
  }

  return catalogue.products.filter(
    (product) => product.guidePath === guidePath && canRenderProduct(product),
  );
}
