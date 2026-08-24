import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

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
  assert.match(result.stdout, /27 published routes: 5 monetised correctly and 22 legitimately unmonetised/);
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
