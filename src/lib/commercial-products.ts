import catalogueData from "../data/commercial-products.json";
import type {
  CommercialProduct,
  CommercialProductCatalogue,
} from "../types/commercial-product";

const catalogue = catalogueData as CommercialProductCatalogue;

export function getApprovedProductsForGuide(guidePath: string): CommercialProduct[] {
  if (!catalogue.enabledGuidePaths.includes(guidePath)) {
    return [];
  }

  return catalogue.products.filter(
    (product) =>
      product.guidePath === guidePath &&
      product.status === "approved" &&
      product.destinationUrl.length > 0,
  );
}
