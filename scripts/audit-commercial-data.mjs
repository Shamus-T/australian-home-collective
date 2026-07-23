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
const trustedEditorialDomains = new Set([
  "abc.net.au",
  "accc.gov.au",
  "agriculture.gov.au",
  "australianmade.com.au",
  "ava.com.au",
  "childcarseats.com.au",
  "cloudflare.com",
  "electricalsafety.qld.gov.au",
  "energyrating.gov.au",
  "esafety.gov.au",
  "formspree.io",
  "healthdirect.gov.au",
  "kb.rspca.org.au",
  "ncc.abcb.gov.au",
  "policies.google.com",
  "productsafety.gov.au",
  "raisingchildren.net.au",
  "rednose.org.au",
  "waterrating.gov.au",
  "worksafe.qld.gov.au",
]);
const phase4AProductPatterns = [
  { pattern: /sources and model checks/i, label: 'a "Sources and model checks" section' },
  { pattern: /current[^\n<]{0,60}(?:models|products|examples)[^\n<]{0,30}checked/i, label: "a current product check section" },
  { pattern: /current models with strong review signals/i, label: "a current model review section" },
  { pattern: /major retailer stock/i, label: "a retailer availability claim" },
  { pattern: /owner review signal/i, label: "owner review evidence used for a product example" },
  { pattern: /(?:from|more than|over)\s+\d[\d,]*\s+(?:owner|customer)?\s*reviews?/i, label: "a product review count claim" },
  { pattern: /\b[0-5](?:\.\d)?\/5\b/i, label: "a product star rating claim" },
  { pattern: /(?:current and available|currently available)[^\n<]{0,60}(?:retailer|stock)/i, label: "a current retailer availability claim" },
  { pattern: /(?:discontinued|superseded|clearance)\s+(?:product|model|item)/i, label: "a discontinued or clearance product reference" },
  { pattern: /(?:sale price|rrp|retailer price)[^\n<]{0,30}(?:aud\s*)?\$?\s*\d/i, label: "a product price claim" },
  { pattern: /(?:aud\s*)?\$\s*\d{1,3}(?:,\d{3})+(?:\.\d{2})?/i, label: "a numeric product price claim" },
];
const knownProhibitedProductPatterns = [
  /Samsung Bespoke AI Jet Ultra/i,
  /LG CordZero/i,
  /Dyson Gen5detect/i,
  /Ecovacs Deebot/i,
  /Dreame Aqua10/i,
  /Roborock Saros/i,
  /Breville Barista Touch Impress/i,
  /DeLonghi Eletta Explore/i,
  /JURA E8/i,
  /Sleeping Duck Mach II/i,
  /Koala Plus Mattress/i,
  /Ecosa Pure Mattress/i,
  /Bosch SMS6/i,
  /Westinghouse WSF6602/i,
  /Fisher\s*&\s*Paykel DW60/i,
  /Artusi ADW4501/i,
  /SCANPAN Impact/i,
  /Essteele Per Vita/i,
  /Lodge Blacklock/i,
  /Tefal Unlimited Premium/i,
  /LG GB-455/i,
  /Westinghouse WHE520/i,
  /Fisher\s*&\s*Paykel RF505/i,
];
const affiliateParameterPattern = /[?&](?:utm_[a-z]+|aff(?:iliate)?(?:_?id)?|ref|tag|clickid|subid)=/i;
const modelCodePattern = /\b(?=[A-Z0-9/-]{5,}\b)(?=[A-Z0-9/-]*[A-Z])(?=[A-Z0-9/-]*\d)[A-Z]{2}[A-Z0-9/-]*\b/;

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

function isTrustedEditorialUrl(urlValue) {
  const host = normalizedHost(urlValue);
  return [...trustedEditorialDomains].some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:[a-z]+|#\d+|#x[a-f\d]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
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
const publishedSourceRoot = path.join(root, "src", "pages");
const publishedSourceFiles = walk(publishedSourceRoot).filter((file) => file.endsWith(".astro"));
let sourceExternalLinkCount = 0;

for (const file of publishedSourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const relativePath = path.relative(root, file).replaceAll(path.sep, "/");

  for (const match of source.matchAll(/<(?:a|ExternalLink)\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gi)) {
    sourceExternalLinkCount += 1;
    const destinationUrl = match[1];
    const approvedDestination = approvedDestinationUrls.has(destinationUrl);
    if (!destinationUrl.toLowerCase().startsWith("https://")) {
      addError(`${relativePath} contains a non-HTTPS external editorial link: ${destinationUrl}`);
    }
    if (isRetailerUrl(destinationUrl) && !approvedDestination) {
      addError(`${relativePath} contains a retailer link outside an approved commercial record: ${destinationUrl}`);
    } else if (!approvedDestination && !isTrustedEditorialUrl(destinationUrl)) {
      addError(`${relativePath} contains an external editorial link outside the trusted-source list: ${destinationUrl}`);
    }
    if (affiliateParameterPattern.test(destinationUrl) && !approvedDestination) {
      addError(`${relativePath} contains tracking or affiliate parameters outside an approved commercial record: ${destinationUrl}`);
    }
  }

  if (approvedDestinationUrls.size === 0) {
    for (const { pattern, label } of phase4AProductPatterns) {
      if (pattern.test(source)) {
        addError(`${relativePath} contains ${label}, which is outside the Phase 4A publishing boundary.`);
      }
    }
    for (const pattern of knownProhibitedProductPatterns) {
      if (pattern.test(source)) {
        addError(`${relativePath} contains a named product introduced by the prohibited product batches.`);
      }
    }
    if (modelCodePattern.test(source)) {
      addError(`${relativePath} contains a model-like product code, which requires an approved commercial record.`);
    }
  }
}

if (checkDist) {
  let builtPageCount = 0;
  let builtExternalLinkCount = 0;

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

  const builtRoot = path.join(root, "dist");
  if (fs.existsSync(builtRoot)) {
    for (const file of walk(builtRoot).filter((candidate) => candidate.endsWith(".html"))) {
      builtPageCount += 1;
      const html = fs.readFileSync(file, "utf8");
      const relativePath = path.relative(root, file).replaceAll(path.sep, "/");
      for (const match of html.matchAll(/<a\s+[^>]*href="(https?:\/\/[^"#]+)[^"#]*"[^>]*>/gi)) {
        builtExternalLinkCount += 1;
        const destinationUrl = match[1];
        const approvedDestination = approvedDestinationUrls.has(destinationUrl);
        if (!destinationUrl.toLowerCase().startsWith("https://")) {
          addError(`${relativePath} renders a non-HTTPS external editorial link: ${destinationUrl}`);
        }
        if (isRetailerUrl(destinationUrl) && !approvedDestination) {
          addError(`${relativePath} renders a retailer link outside an approved commercial record: ${destinationUrl}`);
        } else if (!approvedDestination && !isTrustedEditorialUrl(destinationUrl)) {
          addError(`${relativePath} renders an external editorial link outside the trusted-source list: ${destinationUrl}`);
        }
        if (affiliateParameterPattern.test(destinationUrl) && !approvedDestination) {
          addError(`${relativePath} renders tracking or affiliate parameters outside an approved commercial record: ${destinationUrl}`);
        }
      }

      if (approvedDestinationUrls.size === 0 && relativePath.startsWith("dist/guides/")) {
        const text = visibleText(html);
        for (const { pattern, label } of phase4AProductPatterns) {
          if (pattern.test(text)) {
            addError(`${relativePath} renders ${label}, which is outside the Phase 4A publishing boundary.`);
          }
        }
        for (const pattern of knownProhibitedProductPatterns) {
          if (pattern.test(text)) {
            addError(`${relativePath} renders a named product introduced by the prohibited product batches.`);
          }
        }
        if (modelCodePattern.test(text)) {
          addError(`${relativePath} renders a model-like product code, which requires an approved commercial record.`);
        }
      }
    }
  }

  if (errors.length === 0) {
    console.log(
      `Built commercial-boundary checks passed across ${builtPageCount} HTML pages and ${builtExternalLinkCount} external links.`,
    );
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
console.log(
  `Site-wide editorial boundary checks passed across ${publishedSourceFiles.length} Astro pages and ${sourceExternalLinkCount} external links.`,
);
