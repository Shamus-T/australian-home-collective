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
      sourceRecord("seller-fulfilment", 6),
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
    sourceUrl: "https://example.com/companion-evidence/" + index,
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
