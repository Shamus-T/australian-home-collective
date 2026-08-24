import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadSeasonalGuideData } from "./lib/load-seasonal-guides.mjs";

const root = process.cwd();
const argumentValue = (name) => {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? path.resolve(root, argument.slice(prefix.length)) : null;
};

const coveragePath = argumentValue("coverage")
  ?? path.join(root, "src", "data", "seasonal-commercial-coverage.json");
const cataloguePath = argumentValue("catalogue")
  ?? path.join(root, "src", "data", "commercial-products.json");
const checkDist = process.argv.includes("--dist");
const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const { publishedSeasonalGuides } = await loadSeasonalGuideData(root);
const errors = [];

const allowedClassifications = new Set([
  "monetised-correctly",
  "legitimately-unmonetised",
]);
const allowedReasonCodes = new Set([
  "verified-product-set",
  "editorial-maintenance-or-source-control",
  "no-cohesive-two-product-decision",
  "bulky-or-custom-fit",
  "major-installed-appliance",
  "licensed-electrical-installation",
  "work-at-height-or-trade-safety",
  "health-or-remediation-boundary",
  "higher-risk-product-set-not-cleared",
]);
const approvedAvailability = new Set(["in-stock", "available-to-order"]);
const approvedListing = new Set(["baseline-recorded", "unchanged"]);
const requiredCurrentSourceTypes = new Set([
  "manufacturer-specification",
  "australian-availability-support",
  "regulator-recall-check",
  "seller-fulfilment",
]);

const addError = (message) => errors.push(message);
const countMatches = (value, pattern) => value.match(pattern)?.length ?? 0;
const sourcePathFor = (guidePath) => path.join(
  root,
  "src",
  "pages",
  guidePath.replace(/^\//, ""),
  "index.astro",
);
const distPathFor = (guidePath) => path.join(
  root,
  "dist",
  guidePath.replace(/^\//, ""),
  "index.html",
);

if (coverage.version !== 1) addError("Seasonal commercial coverage must use version 1.");
if (!/^\d{4}-\d{2}-\d{2}$/.test(coverage.updatedOn ?? "")) {
  addError("Seasonal commercial coverage updatedOn must be a YYYY-MM-DD date.");
}
if (!Array.isArray(coverage.decisions)) {
  addError("Seasonal commercial coverage must contain a decisions array.");
}

const seasonalPaths = publishedSeasonalGuides.map((guide) => guide.href);
const seasonalPathSet = new Set(seasonalPaths);
if (seasonalPathSet.size !== seasonalPaths.length) {
  addError("The seasonal hub contains a duplicate published guide route.");
}

const decisions = Array.isArray(coverage.decisions) ? coverage.decisions : [];
const decisionsByPath = new Map();
for (const decision of decisions) {
  if (!decision || typeof decision.guidePath !== "string") {
    addError("Every seasonal commercial decision must have a guidePath.");
    continue;
  }
  if (decisionsByPath.has(decision.guidePath)) {
    addError(`Duplicate seasonal commercial coverage decision for ${decision.guidePath}.`);
  }
  decisionsByPath.set(decision.guidePath, decision);
  if (!allowedClassifications.has(decision.classification)) {
    addError(`${decision.guidePath} has an invalid seasonal commercial classification.`);
  }
  if (!allowedReasonCodes.has(decision.reasonCode)) {
    addError(`${decision.guidePath} has an invalid seasonal commercial reasonCode.`);
  }
  if (typeof decision.reason !== "string" || decision.reason.trim().length < 40) {
    addError(`${decision.guidePath} must record a specific seasonal commercial reason.`);
  }
  if (!seasonalPathSet.has(decision.guidePath)) {
    addError(`Stale seasonal commercial coverage decision for ${decision.guidePath}; it is not published on the seasonal hub.`);
  }
}

for (const guidePath of seasonalPaths) {
  if (!decisionsByPath.has(guidePath)) {
    addError(`Missing seasonal commercial coverage decision for ${guidePath}.`);
  }
}

const enabledPaths = new Set(catalogue.enabledGuidePaths ?? []);
for (const guidePath of seasonalPaths) {
  const decision = decisionsByPath.get(guidePath);
  if (!decision) continue;

  const sourcePath = sourcePathFor(guidePath);
  if (!fs.existsSync(sourcePath)) {
    addError(`${guidePath} is published on the seasonal hub but its source page is missing.`);
    continue;
  }
  const source = fs.readFileSync(sourcePath, "utf8");
  if (!source.includes("<ArticleLayout")) {
    addError(`${guidePath} does not use the shared ArticleLayout.`);
  }

  const sourceBlockCount = countMatches(source, /<CommercialProductBlock\b/g);
  const products = (catalogue.products ?? []).filter((product) => product.guidePath === guidePath);
  const approvedProducts = products.filter((product) =>
    product.editorialStatus === "approved"
    && product.researchOutcome === "research-supported"
    && product.approvedForAffiliateUse === true
    && product.affiliate === true
  );

  if (decision.classification === "monetised-correctly") {
    if (decision.reasonCode !== "verified-product-set") {
      addError(`${guidePath} is monetised but does not use the verified-product-set reasonCode.`);
    }
    if (!enabledPaths.has(guidePath)) {
      addError(`${guidePath} is classified as monetised-correctly but is missing from enabledGuidePaths.`);
    }
    if (sourceBlockCount !== 1) {
      addError(`${guidePath} must contain exactly one CommercialProductBlock; found ${sourceBlockCount}.`);
    }
    const escapedGuidePath = guidePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`<CommercialProductBlock\\b[\\s\\S]*?guidePath=["']${escapedGuidePath}["']`).test(source)) {
      addError(`${guidePath} CommercialProductBlock must use its exact guide route.`);
    }
    const commercialIndex = source.indexOf("<CommercialProductBlock");
    const relatedIndex = source.indexOf("<RelatedGuidesBlock");
    if (commercialIndex !== -1 && relatedIndex !== -1 && commercialIndex > relatedIndex) {
      addError(`${guidePath} CommercialProductBlock must appear before related-guide navigation.`);
    }
    if (approvedProducts.length < 2) {
      addError(`${guidePath} is monetised but has ${approvedProducts.length} approved products; at least 2 are required.`);
    }
    if (products.length !== approvedProducts.length) {
      addError(`${guidePath} has seasonal catalogue products that are not currently approved research-supported affiliate products.`);
    }

    for (const product of approvedProducts) {
      if (!/^https:\/\/www\.amazon\.com\.au\/dp\/[A-Z0-9]{10}\?tag=ahc07-22$/.test(product.destinationUrl ?? "")) {
        addError(`${product.id} must use a canonical Amazon Australia /dp/ASIN?tag=ahc07-22 destination.`);
      }
      const validation = product.affiliateValidation ?? {};
      if (
        product.lastReviewedOn !== coverage.updatedOn
        || validation.checkedOn !== coverage.updatedOn
      ) {
        addError(`${product.id} must be reviewed and affiliate-validated on ${coverage.updatedOn}.`);
      }
      if (
        validation.destinationStatus !== "reachable"
        || validation.productIdentityStatus !== "verified"
        || !approvedAvailability.has(validation.australianAvailabilityStatus)
        || !approvedListing.has(validation.listingStatus)
        || validation.specificationsStatus !== "matched"
        || !["matched", "not-applicable"].includes(validation.safetyComplianceStatus)
        || validation.trackingStatus !== "verified"
      ) {
        addError(`${product.id} does not have a fully approved current affiliate validation record.`);
      }
      for (const sourceType of requiredCurrentSourceTypes) {
        const currentRecord = (product.sourceRecords ?? []).find((record) =>
          record.sourceType === sourceType && record.checkedOn === coverage.updatedOn
        );
        if (!currentRecord) {
          addError(`${product.id} needs a current ${sourceType} record dated ${coverage.updatedOn}.`);
        }
      }
    }
  } else {
    if (decision.reasonCode === "verified-product-set") {
      addError(`${guidePath} is legitimately unmonetised but uses the verified-product-set reasonCode.`);
    }
    if (enabledPaths.has(guidePath)) {
      addError(`${guidePath} is classified as legitimately-unmonetised but is enabled for commercial products.`);
    }
    if (products.length > 0) {
      addError(`${guidePath} is classified as legitimately-unmonetised but has ${products.length} catalogue products.`);
    }
    if (sourceBlockCount > 0) {
      addError(`${guidePath} is classified as legitimately-unmonetised but contains a CommercialProductBlock.`);
    }
  }

  if (checkDist) {
    const distPath = distPathFor(guidePath);
    if (!fs.existsSync(distPath)) {
      addError(`${guidePath} is missing from the built site.`);
      continue;
    }
    const html = fs.readFileSync(distPath, "utf8");
    const builtBlocks = countMatches(html, /<section\b[^>]*\bdata-commercial-product-block\b/gi);
    const builtCards = countMatches(html, /<article\b[^>]*\bdata-commercial-product-card\b/gi);
    const builtDisclosures = countMatches(html, /aria-label="Affiliate disclosure"/g);

    if (decision.classification === "monetised-correctly") {
      if (builtBlocks !== 1) addError(`${guidePath} built output must contain exactly one commercial product block.`);
      if (builtCards !== approvedProducts.length) {
        addError(`${guidePath} built output has ${builtCards} product cards; expected ${approvedProducts.length}.`);
      }
      if (builtDisclosures !== 1) addError(`${guidePath} built output must contain exactly one adjacent affiliate disclosure.`);
      for (const product of approvedProducts) {
        if (!html.includes(`data-commercial-product-id="${product.id}"`)) {
          addError(`${guidePath} built output is missing the approved product ${product.id}.`);
        }
      }
    } else if (builtBlocks > 0 || builtCards > 0 || builtDisclosures > 0) {
      addError(`${guidePath} is legitimately unmonetised but its built output contains commercial product markup.`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Seasonal commercial coverage audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const monetisedCount = decisions.filter((decision) => decision.classification === "monetised-correctly").length;
const unmonetisedCount = decisions.filter((decision) => decision.classification === "legitimately-unmonetised").length;
console.log(
  `Seasonal commercial coverage audit passed for ${seasonalPaths.length} published routes: `
  + `${monetisedCount} monetised correctly and ${unmonetisedCount} legitimately unmonetised`
  + `${checkDist ? ", including built output" : ""}.`,
);
