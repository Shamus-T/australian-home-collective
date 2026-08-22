import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const css = fs.readFileSync(path.join(root, "public", "styles", "global.css"), "utf8");
const failures = [];
const representativeRoutes = [
  "/",
  "/seasonal/",
  "/categories/",
  "/categories/kitchen/",
  "/categories/laundry/",
  "/categories/bathroom/",
  "/categories/garage-storage/",
  "/categories/outdoor-garden/",
  "/guides/",
];

function fail(message) {
  failures.push(message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ruleBodies(selector) {
  return [...css.matchAll(
    new RegExp(`^\\s*${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, "gm"),
  )].map((match) => normalized(match[1]));
}

function normalized(value) {
  return value.replace(/\s+/g, " ").trim();
}

function requireRuleFragments(selector, fragments) {
  const bodies = ruleBodies(selector);
  if (bodies.length === 0) {
    fail(`Shared card CSS is missing the ${selector} rule.`);
    return;
  }
  for (const fragment of fragments) {
    if (!bodies.some((body) => body.includes(normalized(fragment)))) {
      fail(`Shared card CSS ${selector} is missing layout contract: ${fragment}.`);
    }
  }
}

function outputFile(route) {
  return route === "/"
    ? path.join(distRoot, "index.html")
    : path.join(distRoot, ...route.split("/").filter(Boolean), "index.html");
}

requireRuleFragments(".grid", ["display: grid", "gap: 20px", "align-items: stretch"]);
requireRuleFragments(".guide-card", [
  "display: flex",
  "min-width: 0",
  "align-self: stretch",
  "height: 100%",
]);
requireRuleFragments(".guide-card a", [
  "display: grid",
  "grid-template-rows: auto minmax(4.5em, auto) 1fr",
  "height: 100%",
]);
requireRuleFragments(".guide-card.has-image a", [
  "min-height: 360px",
  "grid-template-rows: 1fr auto minmax(4.5em, auto) minmax(8.5em, auto)",
]);
requireRuleFragments(".guide-card h3", [
  "min-height: 4.5em",
  "font-size: 1.38rem",
]);
requireRuleFragments(".guide-card.category-card.has-image a", [
  "min-height: 330px",
  "grid-template-rows: 1fr auto minmax(2.15em, auto) minmax(8.5em, auto)",
]);
requireRuleFragments(".guide-card.category-card.has-image h3", [
  "min-height: 2.15em",
]);
requireRuleFragments(".card-image", [
  "width: 100%",
  "height: 100%",
  "object-fit: cover",
  "filter: saturate(1.06) contrast(1.04)",
]);

if (!css.includes("@media (min-width: 821px) and (max-width: 1020px)")) {
  fail("Shared grid CSS is missing the two-column tablet breakpoint.");
}
if (!/\.guide-card h3 \{\r?\n\s+min-height: 0;/.test(css)) {
  fail("Shared card CSS is missing the narrow-screen title-height reset.");
}

let auditedCards = 0;
let auditedImageCards = 0;

for (const route of representativeRoutes) {
  const file = outputFile(route);
  if (!fs.existsSync(file)) {
    fail(`${route} does not have generated HTML for card-layout auditing.`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes('href="/styles/global.css?v=12"')) {
    fail(`${route} does not reference the current shared stylesheet version.`);
  }

  const cards = [...html.matchAll(
    /<article\b[^>]*class="[^"]*\bguide-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
  )].map((match) => match[0]);
  if (cards.length === 0) {
    fail(`${route} has no guide or category cards to audit.`);
    continue;
  }

  for (const card of cards) {
    auditedCards += 1;
    const linkCount = card.match(/<a\b[^>]*href="[^"]+"/gi)?.length ?? 0;
    const headingCount = card.match(/<h[23]\b/gi)?.length ?? 0;
    if (linkCount !== 1) fail(`${route} has a guide card with ${linkCount} primary links.`);
    if (headingCount !== 1) fail(`${route} has a guide card with ${headingCount} card headings.`);

    if (/\bhas-image\b/i.test(card.match(/<article\b[^>]*>/i)?.[0] ?? "")) {
      auditedImageCards += 1;
      const images = [...card.matchAll(/<img\b[^>]*class="[^"]*\bcard-image\b[^"]*"[^>]*>/gi)]
        .map((match) => match[0]);
      if (images.length !== 1) {
        fail(`${route} has an image card with ${images.length} shared card images.`);
        continue;
      }
      const imageTag = images[0];
      if (!/\bwidth="900"/i.test(imageTag) || !/\bheight="620"/i.test(imageTag)) {
        fail(`${route} has a card image without the shared 900×620 intrinsic dimensions.`);
      }
      if (/opacity\s*:/i.test(imageTag)) {
        fail(`${route} has a card image with a one-off inline opacity override.`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Card layout audit failed with ${failures.length} error(s):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(
  `Card layout audit passed: ${auditedCards} guide/category cards (${auditedImageCards} image cards) `
  + "across nine representative pages use the shared alignment, image, contrast and responsive contracts.",
);
