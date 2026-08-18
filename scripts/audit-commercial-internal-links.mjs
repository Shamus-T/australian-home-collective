import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const guideRoot = path.join(root, "src", "pages", "guides");
const cataloguePath = path.join(root, "src", "data", "commercial-products.json");
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const commercialGuidePaths = new Set(catalogue.enabledGuidePaths ?? []);
const inboundSources = new Map(
  [...commercialGuidePaths].map((guidePath) => [guidePath, new Set()]),
);
const failures = [];

function pagePathFor(directoryName) {
  return `/guides/${directoryName}/`;
}

function articleBody(source) {
  const frontmatter = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return frontmatter ? source.slice(frontmatter[0].length) : source;
}

for (const guidePath of commercialGuidePaths) {
  const directoryName = guidePath.match(/^\/guides\/([^/]+)\/$/)?.[1];
  const guideFile = directoryName
    ? path.join(guideRoot, directoryName, "index.astro")
    : "";

  if (!directoryName || !fs.existsSync(guideFile)) {
    failures.push(`Commercial guide does not resolve to an Astro source page: ${guidePath}`);
  }
}

for (const entry of fs.readdirSync(guideRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const sourcePath = path.join(guideRoot, entry.name, "index.astro");
  if (!fs.existsSync(sourcePath)) continue;

  const sourcePagePath = pagePathFor(entry.name);
  if (commercialGuidePaths.has(sourcePagePath)) continue;

  const source = fs.readFileSync(sourcePath, "utf8");
  if (!source.includes("<ArticleLayout")) continue;

  const contextualGuideLinks = [...articleBody(source).matchAll(
    /\bhref\s*=\s*["'](\/guides\/[^"']+)["']/g,
  )].map((match) => match[1]);

  for (const targetPath of new Set(contextualGuideLinks)) {
    inboundSources.get(targetPath)?.add(sourcePagePath);
  }
}

for (const [guidePath, sources] of inboundSources) {
  if (sources.size === 0) {
    failures.push(
      `${guidePath} has no contextual body-copy link from a non-commercial guide.`,
    );
  }
}

if (failures.length) {
  console.error(`Commercial internal-link audit failed with ${failures.length} error(s):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

const sourcePages = new Set([...inboundSources.values()].flatMap((sources) => [...sources]));
const inboundCounts = [...inboundSources.values()].map((sources) => sources.size);
const weakestCount = Math.min(...inboundCounts);
const strongestCount = Math.max(...inboundCounts);

console.log(
  `Commercial internal-link audit passed: ${commercialGuidePaths.size} enabled guides each have `
  + `contextual body-copy inbound links from non-commercial guides (${sourcePages.size} source pages; `
  + `${weakestCount}-${strongestCount} distinct sources per guide).`,
);
