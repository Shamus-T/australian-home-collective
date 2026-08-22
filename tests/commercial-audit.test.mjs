import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = process.cwd();
const baseCatalogue = JSON.parse(
  fs.readFileSync(path.join(root, "src", "data", "commercial-products.json"), "utf8"),
);
const today = new Date().toISOString().slice(0, 10);

function sourceRecord(sourceType, index) {
  return {
    sourceType,
    title: "Evidence source " + index,
    publisher: "Example publisher",
    sourceUrl: "https://example.com/evidence/" + index,
    supports: "A relevant product claim or screening check.",
    checkedOn: today,
  };
}

function validProduct() {
  return {
    id: "example-approved-product",
    guidePath: "/guides/pantry-storage-what-to-measure-before-buying-organisers/",
    name: "Example approved product",
    productType: "Pantry organiser",
    summary: "A neutral summary of the option and its intended use.",
    merchant: "Amazon Australia",
    destinationUrl: "https://www.amazon.com.au/dp/B000000000?tag=ahc07-22",
    linkLabel: "Check current details",
    affiliate: true,
    affiliateNetwork: "amazon-australia",
    editorialStatus: "approved",
    researchOutcome: "research-supported",
    evidenceConfidence: "moderate",
    recallSafetyStatus: "clear",
    lastReviewedOn: today,
    approvedForAffiliateUse: true,
    affiliateValidation: {
      checkedOn: today,
      destinationStatus: "reachable",
      productIdentityStatus: "verified",
      australianAvailabilityStatus: "in-stock",
      listingStatus: "unchanged",
      specificationsStatus: "matched",
      safetyComplianceStatus: "not-applicable",
      trackingStatus: "verified",
    },
    testingStatus: "research-only",
    testingNotes: "",
    drawbacks: ["May not suit unusually deep pantry shelves."],
    suitability: {
      suits: ["households that have checked the available shelf dimensions"],
      mayNotSuit: ["households that need a different storage format"],
    },
    sourceRecords: [
      sourceRecord("manufacturer-specification", 1),
      sourceRecord("independent-expert-review", 2),
      sourceRecord("owner-feedback", 3),
      sourceRecord("australian-availability-support", 4),
      sourceRecord("regulator-recall-check", 5),
      {
        ...sourceRecord("seller-fulfilment", 6),
        sourceUrl: "https://www.amazon.com.au/dp/B000000000?tag=ahc07-22",
      },
    ],
  };
}

function runAudit(productMutator, catalogueMutator = () => {}) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "ahc-commercial-audit-"));
  const fixturePath = path.join(temporaryDirectory, "catalogue.json");
  const catalogue = structuredClone(baseCatalogue);
  const product = validProduct();
  productMutator(product);
  const companionProduct = validProduct();
  companionProduct.id = "example-approved-product-companion";
  companionProduct.name = "Example approved companion product";
  companionProduct.destinationUrl = "https://www.amazon.com.au/dp/B000000001?tag=ahc07-22";
  companionProduct.sourceRecords = companionProduct.sourceRecords.map((source, index) => ({
    ...source,
    sourceUrl: source.sourceType === "seller-fulfilment"
      ? companionProduct.destinationUrl
      : "https://example.com/companion-evidence/" + index,
  }));
  catalogue.enabledGuidePaths = [product.guidePath];
  catalogue.products = [product, companionProduct];
  catalogueMutator(catalogue);
  fs.writeFileSync(fixturePath, JSON.stringify(catalogue), "utf8");

  try {
    return spawnSync(
      process.execPath,
      ["scripts/audit-commercial-data.mjs", "--catalogue=" + fixturePath],
      { cwd: root, encoding: "utf8" },
    );
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

test("a complete research-supported affiliate record passes the source audit", () => {
  const result = runAudit(() => {});
  assert.equal(result.status, 0, result.stderr);
});

test("a research-supported record can pass without an expert review when its required practical evidence is present", () => {
  const result = runAudit((product) => {
    product.sourceRecords = product.sourceRecords.filter(
      (source) => source.sourceType !== "independent-expert-review",
    );
  });
  assert.equal(result.status, 0, result.stderr);
});

test("the audit rejects a missing required review field", () => {
  const result = runAudit((product) => {
    delete product.drawbacks;
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required review field "drawbacks"/);
});

test("the audit rejects an affiliate URL without the current tracking tag", () => {
  const result = runAudit((product) => {
    product.destinationUrl = "https://www.amazon.com.au/dp/B000000000?tag=outdated-22";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing the current amazon-australia tracking value tag=ahc07-22/);
});

test("the audit rejects an Amazon affiliate URL without a canonical ASIN path", () => {
  const result = runAudit((product) => {
    product.destinationUrl = "https://www.amazon.com.au/s?k=pantry+organiser&tag=ahc07-22";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /canonical Amazon Australia \/dp\/ASIN destination/);
});

test("the audit rejects an affiliate product without a product-validity check", () => {
  const result = runAudit((product) => {
    delete product.affiliateValidation;
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /affiliateValidation must record the current product-validity check/);
});

for (const scenario of [
  {
    name: "a product identity mismatch",
    mutate(validation) {
      validation.productIdentityStatus = "mismatch";
    },
    expected: /intended product identity and model or variant/,
  },
  {
    name: "a product that is unavailable to Australian customers",
    mutate(validation) {
      validation.australianAvailabilityStatus = "unavailable";
    },
    expected: /currently in stock or available to order for Australian customers/,
  },
  {
    name: "a materially changed retailer listing",
    mutate(validation) {
      validation.listingStatus = "materially-changed";
    },
    expected: /materially changed or unverified retailer listing/,
  },
  {
    name: "listing specifications that no longer match AHC copy",
    mutate(validation) {
      validation.specificationsStatus = "mismatch";
    },
    expected: /listing specifications match the AHC copy/,
  },
  {
    name: "unverified applicable safety or compliance claims",
    mutate(validation) {
      validation.safetyComplianceStatus = "unverified";
    },
    expected: /safety and compliance claims match current evidence/,
  },
  {
    name: "unverified affiliate tracking",
    mutate(validation) {
      validation.trackingStatus = "unverified";
    },
    expected: /affiliate tracking is verified/,
  },
]) {
  test("the audit rejects " + scenario.name, () => {
    const result = runAudit((product) => scenario.mutate(product.affiliateValidation));
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, scenario.expected);
  });
}

test("the audit requires affiliate validation on the current product review date", () => {
  const result = runAudit((product) => {
    product.affiliateValidation.checkedOn = "2026-01-01";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /completed on the current lastReviewedOn date/);
});

test("the audit requires current evidence for the exact affiliate destination", () => {
  const result = runAudit((product) => {
    const sellerRecord = product.sourceRecords.find(
      (source) => source.sourceType === "seller-fulfilment",
    );
    sellerRecord.sourceUrl = "https://www.amazon.com.au/dp/B000000099?tag=ahc07-22";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /seller-fulfilment record for the exact affiliate destination/);
});

test("the audit rejects an enabled guide with fewer than two approved products", () => {
  const result = runAudit(
    () => {},
    (catalogue) => {
      catalogue.products = catalogue.products.slice(0, 1);
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /at least 2 are required/);
});

test("the audit rejects duplicate destinations within the same guide", () => {
  const result = runAudit(
    () => {},
    (catalogue) => {
      const [first, second] = catalogue.products;
      second.destinationUrl = first.destinationUrl;
      const sellerRecord = second.sourceRecords.find(
        (source) => source.sourceType === "seller-fulfilment",
      );
      sellerRecord.sourceUrl = first.destinationUrl;
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicates destination .* within .*already used by/);
});

test("the audit rejects unsupported commercial Product or Review schema", () => {
  for (const type of ["Product", "Review", "AggregateRating"]) {
    const sourcePath = path.join(
      root,
      "src",
      "pages",
      "guides",
      "_commercial-guardrail-test",
      "index.astro",
    );
    fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
    fs.writeFileSync(sourcePath, `---\nconst schema = { "@type": "${type}" };\n---\n`, "utf8");
    try {
      const result = runAudit(() => {});
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, new RegExp(`unsupported ${type} structured data`));
    } finally {
      fs.rmSync(path.dirname(sourcePath), { recursive: true, force: true });
    }
  }
});

test("the audit rejects active recall and safety flags on an approved product", () => {
  const result = runAudit((product) => {
    product.recallSafetyStatus = "active-recall";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /active recall or safety flag/);
});

test("the audit rejects an affiliate product without explicit approval", () => {
  const result = runAudit((product) => {
    product.approvedForAffiliateUse = false;
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /without explicit affiliate approval/);
});

test("the audit rejects an expired approved product review", () => {
  const result = runAudit((product) => {
    product.lastReviewedOn = "2020-01-01";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /overdue for review/);
});

test("every enabled guide owns one contextual product block before related guides", () => {
  for (const guidePath of baseCatalogue.enabledGuidePaths) {
    const sourcePath = path.join(root, "src", "pages", ...guidePath.split("/").filter(Boolean), "index.astro");
    const source = fs.readFileSync(sourcePath, "utf8");
    const blocks = [...source.matchAll(/<CommercialProductBlock\b[\s\S]*?\/>/g)];

    assert.equal(blocks.length, 1, guidePath + " must own exactly one product block");
    assert.match(blocks[0][0], new RegExp(`guidePath=["']${guidePath}["']`));
    assert.match(blocks[0][0], /\btitle="[^"]{20,}"/);
    assert.match(blocks[0][0], /\bintro="[^"]{160,}"/);

    const relatedGuidesIndex = source.indexOf("<RelatedGuidesBlock");
    if (relatedGuidesIndex !== -1) {
      assert.ok(blocks[0].index < relatedGuidesIndex, guidePath + " product block must precede related guides");
    }
  }
});

test("the shared article layout does not detach commercial products from guide context", () => {
  const source = fs.readFileSync(path.join(root, "src", "layouts", "ArticleLayout.astro"), "utf8");
  assert.doesNotMatch(source, /CommercialProductBlock/);
});

test("the shared commercial component renders automatic affiliate tracking metadata", () => {
  const source = fs.readFileSync(
    path.join(root, "src", "components", "CommercialProductBlock.astro"),
    "utf8",
  );

  for (const contract of [
    "data-commercial-product-id={product.id}",
    "data-commercial-product-name={product.name}",
    "data-commercial-guide-path={guidePath}",
    "data-commercial-affiliate-network={product.affiliateNetwork ?? undefined}",
    "data-commercial-merchant={product.merchant}",
    "data-commercial-destination-host={new URL(product.destinationUrl).hostname}",
    'data-affiliate-trackable={product.affiliate ? "true" : undefined}',
    'rel="sponsored nofollow noopener noreferrer"',
    "createAffiliateClickTracker",
  ]) {
    assert.ok(source.includes(contract), `missing commercial tracking contract: ${contract}`);
  }
});
