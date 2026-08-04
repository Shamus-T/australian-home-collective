import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const catalogueArgument = process.argv.find((argument) => argument.startsWith("--catalogue="));
const cataloguePath = catalogueArgument
  ? path.resolve(root, catalogueArgument.slice("--catalogue=".length))
  : path.join(root, "src", "data", "commercial-products.json");
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const checkDist = process.argv.includes("--dist");
const errors = [];
const today = new Date().toISOString().slice(0, 10);

const allowedEditorialStatuses = new Set(["draft", "in-review", "approved", "paused", "rejected"]);
const allowedResearchOutcomes = new Set([
  "research-supported",
  "promising-limited-evidence",
  "mixed-not-promoted",
  "does-not-meet-standard",
]);
const allowedEvidenceConfidence = new Set(["high", "moderate", "low"]);
const allowedSafetyStatuses = new Set([
  "clear",
  "check-required",
  "active-recall",
  "unresolved-safety-concern",
]);
const allowedTestingStatuses = new Set(["research-only", "hands-on-tested"]);
const allowedNetworks = new Set(["amazon-australia", "commission-factory", "direct", "other"]);
const allowedSourceTypes = new Set([
  "manufacturer-specification",
  "manufacturer-warranty",
  "independent-expert-review",
  "technical-review",
  "owner-feedback",
  "australian-availability-support",
  "regulator-recall-check",
  "seller-fulfilment",
]);
const requiredProductFields = [
  "id",
  "guidePath",
  "name",
  "productType",
  "summary",
  "merchant",
  "destinationUrl",
  "linkLabel",
  "affiliate",
  "affiliateNetwork",
  "editorialStatus",
  "researchOutcome",
  "evidenceConfidence",
  "recallSafetyStatus",
  "lastReviewedOn",
  "approvedForAffiliateUse",
  "testingStatus",
  "testingNotes",
  "drawbacks",
  "suitability",
  "sourceRecords",
];
const requiredSourceFields = [
  "sourceType",
  "title",
  "publisher",
  "sourceUrl",
  "supports",
  "checkedOn",
];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const affiliateParameterPattern = /[?&](?:utm_[a-z]+|aff(?:iliate)?(?:_?id)?|ref|tag|clickid|subid)=/i;
const modelCodePattern = /\b(?=[A-Z0-9/-]{5,}\b)(?=[A-Z0-9/-]*[A-Z])(?=[A-Z0-9/-]*\d)[A-Z]{2}[A-Z0-9/-]*\b/;

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
  "apvma.gov.au",
  "arctick.org",
  "asbestossafety.gov.au",
  "assda.asn.au",
  "australianmade.com.au",
  "ava.com.au",
  "betterhealth.vic.gov.au",
  "breville.com",
  "childcarseats.com.au",
  "cloudflare.com",
  "cyber.gov.au",
  "delonghi.com",
  "ecovacs.com",
  "electricalsafety.qld.gov.au",
  "electrolux.com.au",
  "energy.gov.au",
  "energy.nsw.gov.au",
  "energysafe.vic.gov.au",
  "energyrating.gov.au",
  "epa.nsw.gov.au",
  "erac.gov.au",
  "esafety.gov.au",
  "fire.nsw.gov.au",
  "health.nsw.gov.au",
  "health.qld.gov.au",
  "healthdirect.gov.au",
  "iec.ch",
  "kb.rspca.org.au",
  "lg.com",
  "lodgecastiron.com",
  "nespresso.com",
  "nsw.gov.au",
  "policies.google.com",
  "productsafety.gov.au",
  "qld.gov.au",
  "rfs.nsw.gov.au",
  "raisingchildren.net.au",
  "rednose.org.au",
  "sahealth.sa.gov.au",
  "sealy.com.au",
  "ses.nsw.gov.au",
  "ses.qld.gov.au",
  "sleepmaker.com.au",
  "tefal.com.au",
  "waterrating.gov.au",
  "watercorporation.com.au",
  "worksafe.qld.gov.au",
  "yourhome.gov.au",
]);
const outdatedAffiliateWordings = [
  {
    pattern: /does not currently (?:publish|use|include) affiliate links/i,
    label: "states that affiliate links are not currently used",
  },
  {
    pattern: /future affiliate links/i,
    label: "describes affiliate links as future-only",
  },
  {
    pattern: /if affiliate links are (?:introduced|added|used)/i,
    label: "describes affiliate links as conditional future use",
  },
  {
    pattern: /will disclose approved affiliate links/i,
    label: "uses future-tense affiliate disclosure wording",
  },
  {
    pattern: /affiliate links? (?:may|will) be used in the future/i,
    label: "says affiliate links may be used in the future",
  },
];
const phase4AProductPatterns = [
  { pattern: /sources and model checks/i, label: "a current model-check section" },
  { pattern: /current models with strong review signals/i, label: "a current model review section" },
  { pattern: /major retailer stock/i, label: "a retailer availability claim" },
  { pattern: /owner review signal/i, label: "owner-review evidence used for a product example" },
  { pattern: /(?:from|more than|over)\s+\d[\d,]*\s+(?:owner|customer)?\s*reviews?/i, label: "a product review-count claim" },
  { pattern: /\b[0-5](?:\.\d)?\/5\b/i, label: "a product star-rating claim" },
  { pattern: /(?:sale price|rrp|retailer price)[^\n<]{0,30}(?:aud\s*)?\$?\s*\d/i, label: "a product price claim" },
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

function addError(message) {
  errors.push(message);
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isDate(value) {
  return typeof value === "string"
    && datePattern.test(value)
    && !Number.isNaN(Date.parse(value + "T00:00:00Z"));
}

function reviewDueOn(lastReviewedOn, intervalDays) {
  const due = new Date(lastReviewedOn + "T00:00:00Z");
  due.setUTCDate(due.getUTCDate() + intervalDays);
  return due.toISOString().slice(0, 10);
}

function routeSourcePath(guidePath) {
  return path.join(root, "src", "pages", ...guidePath.split("/").filter(Boolean), "index.astro");
}

function normalizedHost(urlValue) {
  try {
    return new URL(urlValue).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hostMatches(host, domain) {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
  const normalizedValue = host.toLowerCase().replace(/^www\./, "");
  return normalizedValue === normalizedDomain || normalizedValue.endsWith("." + normalizedDomain);
}

function isRetailerUrl(urlValue) {
  const host = normalizedHost(urlValue);
  return [...retailerDomains].some((domain) => hostMatches(host, domain));
}

function isTrustedEditorialUrl(urlValue) {
  const host = normalizedHost(urlValue);
  return [...trustedEditorialDomains].some((domain) => hostMatches(host, domain));
}

function visibleText(html) {
  return html
    .replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&apos;|&#0*39;|&#x0*27;/gi, "'")
    .replace(/&(?:[a-z]+|#\d+|#x[a-f\d]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attributeValue(anchor, name) {
  const match = anchor.match(new RegExp("\\b" + name + "=\"([^\"]*)\"", "i"));
  return match ? match[1] : "";
}

function hasRelTokens(anchor, requiredTokens) {
  const relTokens = new Set(attributeValue(anchor, "rel").toLowerCase().split(/\s+/).filter(Boolean));
  return requiredTokens.every((token) => relTokens.has(token));
}

function pageRoute(relativePath) {
  const normal = relativePath.replaceAll(path.sep, "/");
  if (normal === "index.html") return "/";
  if (normal.endsWith("/index.html")) return "/" + normal.slice(0, -"index.html".length);
  return "/" + normal;
}

function affiliateProgramForUrl(urlValue) {
  const host = normalizedHost(urlValue);
  for (const [network, config] of Object.entries(catalogue.affiliatePrograms ?? {})) {
    if ((config.allowedHosts ?? []).some((domain) => hostMatches(host, domain))) {
      return { network, config };
    }
  }
  return null;
}

function validateAffiliateTracking(urlValue, network, prefix) {
  const config = catalogue.affiliatePrograms?.[network];
  if (!config) {
    addError(prefix + " uses affiliate network \"" + network + "\" without a tracking configuration.");
    return;
  }
  let url;
  try {
    url = new URL(urlValue);
  } catch {
    return;
  }
  if (!(config.allowedHosts ?? []).some((domain) => hostMatches(url.hostname, domain))) {
    addError(prefix + " does not use an allowed host for " + network + ": " + urlValue);
  }
  if (url.searchParams.get(config.trackingParameter) !== config.trackingValue) {
    addError(
      prefix + " is missing the current " + network + " tracking value "
      + config.trackingParameter + "=" + config.trackingValue + ".",
    );
  }
}

function stringListIsValid(value, requireItems) {
  return Array.isArray(value)
    && (!requireItems || value.length > 0)
    && value.every((item) => typeof item === "string" && item.trim() !== "");
}

if (catalogue.$schema !== "./commercial-products.schema.json") {
  addError("Catalogue must reference ./commercial-products.schema.json.");
}
if (catalogue.version !== 2) addError("Catalogue version must be 2.");
if (!isDate(catalogue.updatedOn)) addError("Catalogue updatedOn must be a valid YYYY-MM-DD date.");
if (catalogue.reviewIntervalDays !== 180) {
  addError("Catalogue reviewIntervalDays must match the documented 180-day review interval.");
}
if (!catalogue.affiliatePrograms || typeof catalogue.affiliatePrograms !== "object") {
  addError("Catalogue affiliatePrograms must be an object.");
}
for (const [network, config] of Object.entries(catalogue.affiliatePrograms ?? {})) {
  if (!allowedNetworks.has(network)) addError("Affiliate tracking configuration has an invalid network: " + network);
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    addError("Affiliate tracking configuration for " + network + " must be an object.");
    continue;
  }
  if (typeof config.trackingParameter !== "string" || config.trackingParameter.trim() === "") {
    addError("Affiliate tracking configuration for " + network + " needs a trackingParameter.");
  }
  if (typeof config.trackingValue !== "string" || config.trackingValue.trim() === "") {
    addError("Affiliate tracking configuration for " + network + " needs a trackingValue.");
  }
  if (!stringListIsValid(config.allowedHosts, true)) {
    addError("Affiliate tracking configuration for " + network + " needs allowedHosts.");
  }
}
const amazonProgram = catalogue.affiliatePrograms?.["amazon-australia"];
if (
  !amazonProgram
  || amazonProgram.trackingParameter !== "tag"
  || amazonProgram.trackingValue !== "ahc07-22"
  || !Array.isArray(amazonProgram.allowedHosts)
) {
  addError("Amazon Australia must use the current tag=ahc07-22 tracking configuration.");
}
if (!Array.isArray(catalogue.enabledGuidePaths)) addError("enabledGuidePaths must be an array.");
if (!Array.isArray(catalogue.products)) addError("products must be an array.");

const enabledGuidePaths = Array.isArray(catalogue.enabledGuidePaths)
  ? catalogue.enabledGuidePaths
  : [];
const products = Array.isArray(catalogue.products) ? catalogue.products : [];
const seenGuidePaths = new Set();

for (const guidePath of enabledGuidePaths) {
  if (seenGuidePaths.has(guidePath)) addError("Duplicate enabled guide path: " + guidePath);
  seenGuidePaths.add(guidePath);
  if (!/^\/guides\/[a-z0-9-]+\/$/.test(guidePath)) {
    addError("Enabled guide path is not canonical: " + guidePath);
  } else if (!fs.existsSync(routeSourcePath(guidePath))) {
    addError("Enabled guide route does not exist: " + guidePath);
  }
}

const seenIds = new Set();
const promotableProducts = [];
for (const [index, product] of products.entries()) {
  const prefix = "products[" + index + "]";
  if (!product || typeof product !== "object" || Array.isArray(product)) {
    addError(prefix + " must be an object.");
    continue;
  }

  for (const field of requiredProductFields) {
    if (!Object.hasOwn(product, field)) addError(prefix + " is missing required review field \"" + field + "\".");
  }

  if (typeof product.id !== "string" || !/^[a-z0-9-]+$/.test(product.id)) {
    addError(prefix + ".id must use lowercase letters, numbers and hyphens.");
  } else if (seenIds.has(product.id)) {
    addError("Duplicate product id: " + product.id);
  }
  seenIds.add(product.id);

  if (!enabledGuidePaths.includes(product.guidePath)) {
    addError(prefix + ".guidePath is not enabled for commercial placement.");
  }
  if (!allowedEditorialStatuses.has(product.editorialStatus)) {
    addError(prefix + ".editorialStatus is invalid.");
  }
  if (product.researchOutcome !== null && !allowedResearchOutcomes.has(product.researchOutcome)) {
    addError(prefix + ".researchOutcome is invalid.");
  }
  if (product.evidenceConfidence !== null && !allowedEvidenceConfidence.has(product.evidenceConfidence)) {
    addError(prefix + ".evidenceConfidence is invalid.");
  }
  if (!allowedSafetyStatuses.has(product.recallSafetyStatus)) {
    addError(prefix + ".recallSafetyStatus is invalid.");
  }
  if (!allowedTestingStatuses.has(product.testingStatus)) {
    addError(prefix + ".testingStatus is invalid.");
  }
  if (typeof product.affiliate !== "boolean") addError(prefix + ".affiliate must be boolean.");
  if (typeof product.approvedForAffiliateUse !== "boolean") {
    addError(prefix + ".approvedForAffiliateUse must be boolean.");
  }
  if (!Array.isArray(product.drawbacks)) addError(prefix + ".drawbacks must be an array.");
  if (!product.suitability || typeof product.suitability !== "object") {
    addError(prefix + ".suitability must contain suits and mayNotSuit arrays.");
  } else {
    if (!Array.isArray(product.suitability.suits)) addError(prefix + ".suitability.suits must be an array.");
    if (!Array.isArray(product.suitability.mayNotSuit)) addError(prefix + ".suitability.mayNotSuit must be an array.");
  }
  if (!Array.isArray(product.sourceRecords)) addError(prefix + ".sourceRecords must be an array.");

  if (product.testingStatus === "hands-on-tested") {
    if (typeof product.testingNotes !== "string" || product.testingNotes.trim().length < 20) {
      addError(prefix + ".testingNotes must describe genuine hands-on testing.");
    }
  } else if (typeof product.testingNotes !== "string" || product.testingNotes.trim() !== "") {
    addError(prefix + ".testingNotes must be empty when testingStatus is research-only.");
  }

  if (product.affiliate) {
    if (!allowedNetworks.has(product.affiliateNetwork)) {
      addError(prefix + ".affiliateNetwork is required for an affiliate link.");
    }
    if (product.destinationUrl) {
      validateAffiliateTracking(product.destinationUrl, product.affiliateNetwork, prefix + ".destinationUrl");
    }
  } else {
    if (product.affiliateNetwork !== null) {
      addError(prefix + ".affiliateNetwork must be null for a non-affiliate link.");
    }
    if (product.approvedForAffiliateUse) {
      addError(prefix + " cannot be approved for affiliate use when affiliate is false.");
    }
  }

  if (product.approvedForAffiliateUse && !product.affiliate) {
    addError(prefix + " has affiliate approval without an affiliate link.");
  }

  if (
    ["active-recall", "unresolved-safety-concern"].includes(product.recallSafetyStatus)
    && !["paused", "rejected"].includes(product.editorialStatus)
  ) {
    addError(prefix + " has an active recall or safety flag and must be paused or rejected.");
  }

  const records = Array.isArray(product.sourceRecords) ? product.sourceRecords : [];
  for (const [sourceIndex, source] of records.entries()) {
    const sourcePrefix = prefix + ".sourceRecords[" + sourceIndex + "]";
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      addError(sourcePrefix + " must be an object.");
      continue;
    }
    for (const field of requiredSourceFields) {
      if (!Object.hasOwn(source, field)) addError(sourcePrefix + " is missing \"" + field + "\".");
    }
    if (!allowedSourceTypes.has(source.sourceType)) addError(sourcePrefix + ".sourceType is invalid.");
    for (const field of ["title", "publisher", "supports"]) {
      if (typeof source[field] !== "string" || source[field].trim() === "") {
        addError(sourcePrefix + "." + field + " is required.");
      }
    }
    if (!isHttpsUrl(source.sourceUrl)) addError(sourcePrefix + ".sourceUrl must be HTTPS.");
    if (!isDate(source.checkedOn)) {
      addError(sourcePrefix + ".checkedOn must be a valid date.");
    } else if (source.checkedOn > today) {
      addError(sourcePrefix + ".checkedOn cannot be in the future.");
    }
  }

  if (product.editorialStatus === "approved") {
    for (const field of ["name", "productType", "summary", "merchant", "linkLabel"]) {
      if (typeof product[field] !== "string" || product[field].trim() === "") {
        addError(prefix + "." + field + " is required before approval.");
      }
    }
    if (!isHttpsUrl(product.destinationUrl)) {
      addError(prefix + ".destinationUrl must be an HTTPS URL before approval.");
    }
    if (product.researchOutcome !== "research-supported") {
      addError(prefix + " cannot be approved unless its outcome is research-supported.");
    }
    if (!["high", "moderate"].includes(product.evidenceConfidence)) {
      addError(prefix + " needs high or moderate evidence confidence before approval.");
    }
    if (product.recallSafetyStatus !== "clear") {
      addError(prefix + " cannot be approved without a clear recall and safety status.");
    }
    if (!isDate(product.lastReviewedOn)) {
      addError(prefix + ".lastReviewedOn must be a valid date before approval.");
    } else {
      if (product.lastReviewedOn > today) addError(prefix + ".lastReviewedOn cannot be in the future.");
      const dueOn = reviewDueOn(product.lastReviewedOn, catalogue.reviewIntervalDays);
      if (dueOn < today) {
        addError(prefix + " is overdue for review; it was due on " + dueOn + ".");
      }
    }
    if (product.affiliate && product.approvedForAffiliateUse !== true) {
      addError(prefix + " is an approved affiliate product without explicit affiliate approval.");
    }
    if (!stringListIsValid(product.drawbacks, true)) {
      addError(prefix + ".drawbacks needs at least one material drawback before approval.");
    }
    if (!stringListIsValid(product.suitability?.suits, true)) {
      addError(prefix + ".suitability.suits needs at least one suitability statement before approval.");
    }
    if (!stringListIsValid(product.suitability?.mayNotSuit, true)) {
      addError(prefix + ".suitability.mayNotSuit needs at least one limitation before approval.");
    }

    const sourceTypes = new Set(records.map((source) => source.sourceType));
    const evidenceGroups = [
      {
        label: "manufacturer specification or warranty evidence",
        present: sourceTypes.has("manufacturer-specification") || sourceTypes.has("manufacturer-warranty"),
      },
      {
        label: "independent expert or technical review evidence",
        present: sourceTypes.has("independent-expert-review") || sourceTypes.has("technical-review"),
      },
      { label: "recurring owner-feedback evidence", present: sourceTypes.has("owner-feedback") },
      {
        label: "Australian availability and support evidence",
        present: sourceTypes.has("australian-availability-support"),
      },
      { label: "regulator and recall checks", present: sourceTypes.has("regulator-recall-check") },
      { label: "seller and fulfilment checks", present: sourceTypes.has("seller-fulfilment") },
    ];
    for (const group of evidenceGroups) {
      if (!group.present) addError(prefix + " is missing " + group.label + ".");
    }

    promotableProducts.push(product);
  } else if (product.approvedForAffiliateUse) {
    addError(prefix + " has affiliate approval but editorialStatus is not approved.");
  }
}

const promotableById = new Map(promotableProducts.map((product) => [product.id, product]));
const publishedSourceRoot = path.join(root, "src", "pages");
const publishedSourceFiles = walk(publishedSourceRoot).filter((file) => file.endsWith(".astro"));
let sourceExternalLinkCount = 0;

for (const file of publishedSourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const relativePath = path.relative(root, file).replaceAll(path.sep, "/");

  for (const match of source.matchAll(/<(?:a|ExternalLink)\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gi)) {
    sourceExternalLinkCount += 1;
    const destinationUrl = match[1];
    if (!destinationUrl.toLowerCase().startsWith("https://")) {
      addError(relativePath + " contains a non-HTTPS external editorial link: " + destinationUrl);
    }
    if (isRetailerUrl(destinationUrl)) {
      addError(relativePath + " hard-codes a retailer link outside the commercial registry: " + destinationUrl);
    } else if (!isTrustedEditorialUrl(destinationUrl)) {
      addError(relativePath + " contains an external editorial link outside the trusted-source list: " + destinationUrl);
    }
    if (affiliateParameterPattern.test(destinationUrl)) {
      addError(relativePath + " hard-codes tracking or affiliate parameters outside the commercial registry: " + destinationUrl);
    }
  }

  for (const match of source.matchAll(/<CommercialProductBlock\b[^>]*\bguidePath=["']([^"']+)["'][^>]*>/gi)) {
    if (!enabledGuidePaths.includes(match[1])) {
      addError(relativePath + " uses a commercial product block for an unapproved guide: " + match[1]);
    }
  }

  if (promotableProducts.length === 0) {
    for (const { pattern, label } of phase4AProductPatterns) {
      if (pattern.test(source)) addError(relativePath + " contains " + label + " without an approved product record.");
    }
    for (const pattern of knownProhibitedProductPatterns) {
      if (pattern.test(source)) addError(relativePath + " contains a named product without an approved product record.");
    }
    if (modelCodePattern.test(source)) {
      addError(relativePath + " contains a model-like product code without an approved product record.");
    }
  }
}

const wordingSourceFiles = [
  ...walk(path.join(root, "src")),
  ...walk(path.join(root, "docs")),
  ...walk(path.join(root, "public")),
  ...walk(path.join(root, ".github")),
  ...walk(path.join(root, "apps")),
  ...walk(path.join(root, "tests")),
  path.join(root, "README.md"),
].filter((file) => fs.existsSync(file) && /\.(?:astro|html|md|ts|js|json|mjs|txt|xml|ya?ml)$/i.test(file));

for (const file of wordingSourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  const relativePath = path.relative(root, file).replaceAll(path.sep, "/");
  for (const { pattern, label } of outdatedAffiliateWordings) {
    if (pattern.test(content)) addError(relativePath + " " + label + ".");
  }
}

if (checkDist) {
  if (!fs.existsSync(distRoot)) {
    addError("Rendered commercial audit requires a completed dist build.");
  } else {
    const renderedCountByProduct = new Map();
    let builtPageCount = 0;
    let builtExternalLinkCount = 0;

    for (const file of walk(distRoot).filter((candidate) => candidate.endsWith(".html"))) {
      builtPageCount += 1;
      const html = fs.readFileSync(file, "utf8");
      const relativePath = path.relative(distRoot, file).replaceAll(path.sep, "/");
      const route = pageRoute(relativePath);
      const text = visibleText(html);
      const footerHtml = html.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] ?? "";
      const siteDisclosureCount = html.match(/\bdata-site-affiliate-disclosure\b/gi)?.length ?? 0;

      if (siteDisclosureCount !== 1) {
        addError(relativePath + " renders " + siteDisclosureCount + " site-wide footer disclosures; expected exactly one.");
      }
      for (const requiredText of [
        "Some links on this website are affiliate links.",
        "at no extra cost to you",
        "free, ad-free and easy to use",
        "Our editorial content remains independent.",
      ]) {
        if (!visibleText(footerHtml).includes(requiredText)) {
          addError(relativePath + " footer is missing disclosure text: " + requiredText);
        }
      }
      if (!footerHtml.includes('href="/affiliate-disclosure/"')) {
        addError(relativePath + " footer does not link to the affiliate disclosure policy.");
      }
      if (!footerHtml.includes('href="/how-we-select-products/"')) {
        addError(relativePath + " footer does not link to the AHC Product Research process.");
      }
      for (const { pattern, label } of outdatedAffiliateWordings) {
        if (pattern.test(text)) addError(relativePath + " " + label + ".");
      }

      const commercialAnchors = [...html.matchAll(/<a\b[^>]*\bdata-commercial-link="(?:affiliate|retailer)"[^>]*>/gi)]
        .map((match) => match[0]);
      const affiliateAnchors = commercialAnchors.filter(
        (anchor) => attributeValue(anchor, "data-commercial-link") === "affiliate",
      );

      for (const anchor of commercialAnchors) {
        const productId = attributeValue(anchor, "data-commercial-product-id");
        const href = attributeValue(anchor, "href").replace(/&amp;/g, "&");
        const product = promotableById.get(productId);
        if (!product) {
          addError(relativePath + " renders an unapproved commercial product: " + (productId || "(missing id)"));
          continue;
        }
        renderedCountByProduct.set(productId, (renderedCountByProduct.get(productId) ?? 0) + 1);
        if (route !== product.guidePath) {
          addError(relativePath + " renders product " + productId + " outside its approved guide.");
        }
        if (href !== product.destinationUrl) {
          addError(relativePath + " renders an unregistered destination for product " + productId + ".");
        }
        if (attributeValue(anchor, "target") !== "_blank") {
          addError(relativePath + " commercial product " + productId + " is missing safe target handling.");
        }
        if (!hasRelTokens(anchor, ["sponsored", "nofollow", "noopener", "noreferrer"])) {
          addError(
            relativePath + " commercial product " + productId
            + " must use rel=\"sponsored nofollow noopener noreferrer\".",
          );
        }
        if (product.affiliate) {
          validateAffiliateTracking(href, product.affiliateNetwork, relativePath + " product " + productId);
        }
      }

      for (const match of html.matchAll(/<a\b[^>]*\bhref="(https?:\/\/[^"]+)"[^>]*>/gi)) {
        builtExternalLinkCount += 1;
        const anchor = match[0];
        const href = match[1].replace(/&amp;/g, "&");
        const program = affiliateProgramForUrl(href);
        if (isRetailerUrl(href) && !attributeValue(anchor, "data-commercial-product-id")) {
          addError(relativePath + " renders a retailer link outside the approved commercial component: " + href);
        }
        if (affiliateParameterPattern.test(href) && !attributeValue(anchor, "data-commercial-product-id")) {
          addError(relativePath + " renders tracking parameters outside the approved commercial component: " + href);
        }
        if (program) validateAffiliateTracking(href, program.network, relativePath + " affiliate URL");
      }

      const localDisclosureCount = html.match(/aria-label="Affiliate disclosure"/g)?.length ?? 0;
      if (affiliateAnchors.length > 0 && localDisclosureCount !== 1) {
        addError(relativePath + " has affiliate product links without exactly one in-guide disclosure.");
      }
      if (affiliateAnchors.length === 0 && localDisclosureCount > 0) {
        addError(relativePath + " shows an in-guide affiliate disclosure without an approved affiliate link.");
      }

      if (promotableProducts.length === 0 && route.startsWith("/guides/")) {
        for (const { pattern, label } of phase4AProductPatterns) {
          if (pattern.test(text)) addError(relativePath + " renders " + label + " without an approved product record.");
        }
        for (const pattern of knownProhibitedProductPatterns) {
          if (pattern.test(text)) addError(relativePath + " renders a named product without an approved product record.");
        }
        if (modelCodePattern.test(text)) {
          addError(relativePath + " renders a model-like product code without an approved product record.");
        }
      }
    }

    for (const product of promotableProducts) {
      const renderedCount = renderedCountByProduct.get(product.id) ?? 0;
      if (renderedCount !== 1) {
        addError("Approved product " + product.id + " renders " + renderedCount + " times; expected exactly once.");
      }
    }

    if (errors.length === 0) {
      console.log(
        "Built commercial checks passed across " + builtPageCount + " HTML pages and "
        + builtExternalLinkCount + " external links, including one footer disclosure per page.",
      );
    }
  }
}

if (errors.length > 0) {
  console.error("Commercial data audit failed with " + errors.length + " error(s):");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

const affiliateCount = promotableProducts.filter((product) => product.affiliate).length;
console.log(
  "Commercial data audit passed: " + enabledGuidePaths.length + " enabled guides, "
  + products.length + " records, " + promotableProducts.length + " approved, "
  + affiliateCount + " affiliate.",
);
console.log(
  "Site-wide commercial boundary checks passed across " + publishedSourceFiles.length
  + " Astro pages and " + sourceExternalLinkCount + " external links.",
);
