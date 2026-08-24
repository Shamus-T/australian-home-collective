import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { analyseCommercialPlacement } from "../scripts/lib/analyse-commercial-placement.mjs";

const root = process.cwd();
const coveragePath = path.join(root, "src", "data", "seasonal-commercial-coverage.json");
const baseCoverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));

function runWithCoverage(mutator) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "ahc-seasonal-commercial-"));
  const fixturePath = path.join(temporaryDirectory, "coverage.json");
  const coverage = structuredClone(baseCoverage);
  mutator(coverage);
  fs.writeFileSync(fixturePath, JSON.stringify(coverage), "utf8");

  try {
    return spawnSync(
      process.execPath,
      ["scripts/audit-seasonal-commercial-coverage.mjs", `--coverage=${fixturePath}`],
      { cwd: root, encoding: "utf8" },
    );
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

test("the complete seasonal commercial decision registry passes", () => {
  const result = runWithCoverage(() => {});
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /27 published routes: 8 monetised correctly and 19 legitimately unmonetised/);
  assert.match(result.stdout, /Seasonal commercial placement diagnostics:/);
  assert.match(result.stdout, /\/guides\/reduce-pollen-dust-inside-home-spring\//);
});

test("placement analysis warns when a commercial block follows sources in the final quarter", () => {
  const source = `---\nconst fixture = true;\n---\n<ArticleLayout>
    <h2>Problem</h2><p>${"early advice ".repeat(120)}</p>
    <h2>Options</h2><p>${"comparison detail ".repeat(120)}</p>
    <h2>Official guidance</h2><p>${"source note ".repeat(40)}</p>
    <CommercialProductBlock guidePath="/guides/example/" title="Late products" />
    <h2>Final check</h2><p>Short ending.</p>
  </ArticleLayout>`;
  const placement = analyseCommercialPlacement(source);
  assert.equal(placement.finalQuarterWarning, true);
  assert.ok(placement.percentBefore >= 75);
  assert.deepEqual(placement.markersBefore, ["sources or official guidance"]);
  assert.equal(placement.sectionsBefore, 3);
  assert.equal(placement.sectionsAfter, 1);
});

test("placement analysis accepts a product block after an informed early comparison", () => {
  const source = `<ArticleLayout>
    <h2>Problem</h2><p>Diagnosis first.</p>
    <h2>Comparison</h2><p>Trade-offs and room fit.</p>
    <CommercialProductBlock guidePath="/guides/example/" title="Products" />
    <h2>Placement</h2><p>${"later advice ".repeat(70)}</p>
    <h2>Safety</h2><p>${"later checks ".repeat(70)}</p>
  </ArticleLayout>`;
  const placement = analyseCommercialPlacement(source);
  assert.equal(placement.finalQuarterWarning, false);
  assert.deepEqual(placement.markersBefore, []);
  assert.equal(placement.sectionNumber, 3);
  assert.equal(placement.totalSubstantiveSections, 5);
});

test("placement analysis identifies navigation, FAQ, source and conclusion markers before products", () => {
  const source = `<ArticleLayout>
    <h2>Official guidance</h2><p>Sources.</p>
    <h2>Final verdict</h2><p>Conclusion.</p>
    <RelatedGuidesBlock guides={[]} />
    <FAQSection items={[]} />
    <CommercialProductBlock guidePath="/guides/example/" title="Products" />
  </ArticleLayout>`;
  const placement = analyseCommercialPlacement(source);
  assert.deepEqual(placement.markersBefore, [
    "related-guide navigation",
    "FAQ content",
    "sources or official guidance",
    "a conclusion",
  ]);
});

test("the audit rejects a seasonal route with no recorded decision", () => {
  const result = runWithCoverage((coverage) => {
    coverage.decisions = coverage.decisions.filter(
      (decision) => decision.guidePath !== "/guides/reduce-pollen-dust-inside-home-spring/",
    );
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing seasonal commercial coverage decision for \/guides\/reduce-pollen-dust-inside-home-spring\//);
});

test("the audit rejects an exclusion that contradicts live commercial data", () => {
  const result = runWithCoverage((coverage) => {
    const decision = coverage.decisions.find(
      (item) => item.guidePath === "/guides/reduce-pollen-dust-inside-home-spring/",
    );
    decision.classification = "legitimately-unmonetised";
    decision.reasonCode = "editorial-maintenance-or-source-control";
    decision.reason = "Fixture reason long enough to reach the structural contradiction checks in this audit.";
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /classified as legitimately-unmonetised but is enabled for commercial products/);
});
