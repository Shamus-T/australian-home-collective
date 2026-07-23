import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const cataloguePath = path.join(root, "src", "data", "commercial-products.json");
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const checkDist = process.argv.includes("--dist");
const errors = [];
const allowedStatuses = new Set(["draft", "approved", "paused"]);
const allowedNetworks = new Set(["commission-factory", "direct", "other"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const retailerDomains = new Set([
  "amazon.com.au",
  "appliancesonline.com.au",
  "bunnings.com.au",
  "coles.com.au",
  "davidjones.com",
  "fortywinks.com.au",
  "harveynorman.com.au",
  "howards.com.au",
  "jbhifi.com.au",
  "kitchenwarehouse.com.au",
  "kmart.com.au",
  "myer.com.au",
  "petcircle.com.au",
  "snooze.com.au",
  "target.com.au",
  "thegoodguys.com.au",
  "woolworths.com.au",
]);
const phase4AProductPatterns = [
  { pattern: /sources and model checks/i, label: 'a "Sources and model checks" section' },
  { pattern: /current[^\n<]{0,60}(?:models|products|examples)[^\n<]{0,30}checked/i, label: "a current product check section" },
  { pattern: /current models with strong review signals/i, label: "a current model review section" },
  { pattern: /major retailer stock/i, label: "a retailer availability claim" },
  { pattern: /owner review(?:s| counts?)/i, label: "owner review evidence used for a product example" },
];

function addError(message) {
  errors.push(message);
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isDate(value) {
  return typeof value === "string" && datePattern.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function routeSourcePath(guidePath) {
  return path.join(root, "src", "pages", ...guidePath.split("/").filter(Boolean), "index.astro");
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function normalizedHost(urlValue) {
  try {
    return new URL(urlValue).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isRetailerUrl(urlValue) {
  const host = normalizedHost(urlValue);
  return [...retailerDomains].some((domain) => host === domain || host.endsWith(`.${domain}`));
}

if (catalogue.version !== 1) addError("Catalogue version must be 1.");
if (!isDate(catalogue.updatedOn)) addError("Catalogue updatedOn must be a valid YYYY-MM-DD date.");
if (!Array.isArray(catalogue.enabledGuidePaths)) addError("enabledGuidePaths must be an array.");
if (!Array.isArray(catalogue.products)) addError("products must be an array.");

const enabledGuidePaths = Array.isArray(catalogue.enabledGuidePaths)
  ? catalogue.enabledGuidePaths
  : [];
const products = Array.isArray(catalogue.products) ? catalogue.products : [];
const seenGuidePaths = new Set();

for (const guidePath of enabledGuidePaths) {
  if (seenGuidePaths.has(guidePath)) addError(`Duplicate enabled guide path: ${guidePath}`);
  seenGuidePaths.add(guidePath);
  if (!/^\/guides\/[a-z0-9-]+\/$/.test(guidePath)) {
    addError(`Enabled guide path is not canonical: ${guidePath}`);
  } else if (!fs.existsSync(routeSourcePath(guidePath))) {
    addError(`Enabled guide route does not exist: ${guidePath}`);
  }
}

const seenIds = new Set();
for (const [index, product] of products.entries()) {
  const prefix = `products[${index}]`;
  if (!product || typeof product !== "object" || Array.isArray(product)) {
    addError(`${prefix} must be an object.`);
    continue;
  }

  if (typeof product.id !== "string" || !/^[a-z0-9-]+$/.test(product.id)) {
    addError(`${prefix}.id must use lowercase letters, numbers and hyphens.`);
  } else if (seenIds.has(product.id)) {
    addError(`Duplicate product id: ${product.id}`);
  }
  seenIds.add(product.id);

  if (!allowedStatuses.has(product.status)) addError(`${prefix}.status is invalid.`);
  if (!enabledGuidePaths.includes(product.guidePath)) {
    addError(`${prefix}.guidePath is not enabled for the pilot.`);
  }
  if (typeof product.affiliate !== "boolean") addError(`${prefix}.affiliate must be boolean.`);
  if (!Array.isArray(product.evidence)) addError(`${prefix}.evidence must be an array.`);

  if (product.affiliate) {
    if (!allowedNetworks.has(product.affiliateNetwork)) {
      addError(`${prefix}.affiliateNetwork is required for an affiliate link.`);
    }
    if (typeof product.advertiserId !== "string" || product.advertiserId.trim() === "") {
      addError(`${prefix}.advertiserId is required for an affiliate link.`);
    }
  } else if (product.affiliateNetwork !== null || product.advertiserId !== "") {
    addError(`${prefix} must clear affiliateNetwork and advertiserId for a non-affiliate link.`);
  }

  if (product.status === "approved") {
    for (const field of ["name", "productType", "summary", "merchant", "linkLabel"]) {
      if (typeof product[field] !== "string" || product[field].trim() === "") {
        addError(`${prefix}.${field} is required before approval.`);
      }
    }
    if (!isHttpsUrl(product.destinationUrl)) {
      addError(`${prefix}.destinationUrl must be an HTTPS URL before approval.`);
    }
    if (!isDate(product.verifiedOn) || !isDate(product.reviewDueOn)) {
      addError(`${prefix} needs valid verifiedOn and reviewDueOn dates before approval.`);
    } else {
      if (product.reviewDueOn < product.verifiedOn) {
        addError(`${prefix}.reviewDueOn cannot be earlier than verifiedOn.`);
      }
      const today = new Date().toISOString().slice(0, 10);
      if (product.reviewDueOn < today) addError(`${prefix} is overdue for review.`);
    }
    if (!Array.isArray(product.evidence) || product.evidence.length === 0) {
      addError(`${prefix} needs at least one evidence record before approval.`);
    }
  }

  for (const [evidenceIndex, evidence] of (Array.isArray(product.evidence) ? product.evidence : []).entries()) {
    const evidencePrefix = `${prefix}.evidence[${evidenceIndex}]`;
    if (typeof evidence.claim !== "string" || evidence.claim.trim() === "") {
      addError(`${evidencePrefix}.claim is required.`);
    }
    if (!isHttpsUrl(evidence.sourceUrl)) addError(`${evidencePrefix}.sourceUrl must be HTTPS.`);
    if (!isDate(evidence.checkedOn)) addError(`${evidencePrefix}.checkedOn must be a valid date.`);
  }
}

const approvedDestinationUrls = new Set(
  products
    .filter((product) => product.status === "approved" && isHttpsUrl(product.destinationUrl))
    .map((product) => product.destinationUrl),
);
const guideSourceRoot = path.join(root, "src", "pages", "guides");
const guideSourceFiles = walk(guideSourceRoot).filter((file) => file.endsWith(".astro"));

for (const file of guideSourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const relativePath = path.relative(root, file).replaceAll(path.sep, "/");

  for (const match of source.matchAll(/href=["'](https:\/\/[^"']+)["']/gi)) {
    const destinationUrl = match[1];
    if (isRetailerUrl(destinationUrl) && !approvedDestinationUrls.has(destinationUrl)) {
      addError(`${relativePath} contains a retailer link outside an approved commercial record: ${destinationUrl}`);
    }
  }

  if (approvedDestinationUrls.size === 0) {
    for (const { pattern, label } of phase4AProductPatterns) {
      if (pattern.test(source)) {
        addError(`${relativePath} contains ${label}, which is outside the Phase 4A publishing boundary.`);
      }
    }
  }
}

if (checkDist) {
  for (const guidePath of enabledGuidePaths) {
    const outputPath = path.join(root, "dist", ...guidePath.split("/").filter(Boolean), "index.html");
    if (!fs.existsSync(outputPath)) {
      addError(`Built pilot page is missing: ${guidePath}`);
      continue;
    }

    const html = fs.readFileSync(outputPath, "utf8");
    const approved = products.filter(
      (product) => product.guidePath === guidePath && product.status === "approved",
    );
    const approvedAffiliate = approved.filter((product) => product.affiliate);
    const renderedLinks = html.match(/data-commercial-link=/g) ?? [];
    const renderedAffiliateLinks = html.match(/data-commercial-link="affiliate"/g) ?? [];
    const disclosureBlocks = html.match(/aria-label="Affiliate disclosure"/g) ?? [];

    if (renderedLinks.length !== approved.length) {
      addError(`${guidePath} renders ${renderedLinks.length} commercial links; expected ${approved.length}.`);
    }
    if (renderedAffiliateLinks.length !== approvedAffiliate.length) {
      addError(`${guidePath} renders ${renderedAffiliateLinks.length} affiliate links; expected ${approvedAffiliate.length}.`);
    }
    if (approvedAffiliate.length > 0 && disclosureBlocks.length === 0) {
      addError(`${guidePath} has affiliate links without a disclosure.`);
    }
    if (approvedAffiliate.length === 0 && disclosureBlocks.length > 0) {
      addError(`${guidePath} shows an affiliate disclosure without an approved affiliate link.`);
    }
    if (approvedAffiliate.length > 0) {
      const unsafeAffiliate = [...html.matchAll(/<a\s+[^>]*data-commercial-link="affiliate"[^>]*>/g)]
        .map((match) => match[0])
        .filter((anchor) =>
          !/target="_blank"/.test(anchor) ||
          !/rel="[^"]*sponsored[^"]*noopener[^"]*noreferrer[^"]*"/.test(anchor),
        );
      if (unsafeAffiliate.length > 0) {
        addError(`${guidePath} has affiliate links without the required target and rel values.`);
      }
    }
  }

  const builtGuideRoot = path.join(root, "dist", "guides");
  if (fs.existsSync(builtGuideRoot)) {
    for (const file of walk(builtGuideRoot).filter((candidate) => candidate.endsWith(".html"))) {
      const html = fs.readFileSync(file, "utf8");
      const relativePath = path.relative(root, file).replaceAll(path.sep, "/");
      for (const match of html.matchAll(/<a\s+[^>]*href="(https:\/\/[^"#]+)[^"#]*"[^>]*>/gi)) {
        const destinationUrl = match[1];
        if (isRetailerUrl(destinationUrl) && !approvedDestinationUrls.has(destinationUrl)) {
          addError(`${relativePath} renders a retailer link outside an approved commercial record: ${destinationUrl}`);
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Commercial data audit failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const approvedCount = products.filter((product) => product.status === "approved").length;
const affiliateCount = products.filter(
  (product) => product.status === "approved" && product.affiliate,
).length;
console.log(
  `Commercial data audit passed: ${enabledGuidePaths.length} pilot guides, ${products.length} records, ${approvedCount} approved, ${affiliateCount} affiliate.`,
);
if (checkDist) console.log("Built disclosure and link checks passed.");
