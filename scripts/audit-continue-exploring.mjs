import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const distRoot = path.join(process.cwd(), "dist");
const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(distRoot, ...relativePath.split("/")), "utf8");
}

function hrefForPagePath(relativePath) {
  return `/${relativePath.slice(0, -"index.html".length)}`;
}

function isIndexable(html) {
  const robots = html.match(/<meta name="robots" content="([^"]*)"/i)?.[1] ?? "";
  return !robots.toLowerCase().includes("noindex");
}

function decodeText(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function articleContent(html) {
  const openingTag = '<article class="content narrow">';
  const articleStart = html.indexOf(openingTag);
  const mainEnd = html.indexOf("</main>", articleStart);
  const articleEnd = html.lastIndexOf("</article>", mainEnd);

  return articleStart >= 0 && articleEnd > articleStart
    ? html.slice(articleStart + openingTag.length, articleEnd)
    : "";
}

if (!fs.existsSync(distRoot)) {
  console.error("Continue exploring audit requires a completed dist build.");
  process.exit(1);
}

const guideDirectory = path.join(distRoot, "guides");
const guidePagePaths = fs.readdirSync(guideDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `guides/${entry.name}/index.html`)
  .filter((relativePath) => fs.existsSync(path.join(distRoot, ...relativePath.split("/"))));

const guidePages = new Map(
  guidePagePaths.map((relativePath) => [hrefForPagePath(relativePath), read(relativePath)]),
);
const activeGuidePages = [...guidePages].filter(([, html]) => isIndexable(html));
let checkedSections = 0;

for (const [href, html] of activeGuidePages) {
  const articleHtml = articleContent(html);

  if (!articleHtml) {
    fail(`${href} is missing its article content container.`);
    continue;
  }

  if (/<h[1-6][^>]*>\s*Related Guides\s*<\/h[1-6]>/i.test(articleHtml)) {
    fail(`${href} still uses the old "Related Guides" heading.`);
  }

  const sections = [...articleHtml.matchAll(
    /<aside class="related-guides"[\s\S]*?<\/aside>/gi,
  )].map((match) => match[0]);

  if (sections.length !== 1) {
    fail(`${href} renders ${sections.length} Continue exploring sections; expected exactly one.`);
    continue;
  }

  checkedSections += 1;
  const sectionHtml = sections[0];
  const heading = decodeText(
    sectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "",
  );
  if (heading !== "Continue exploring") {
    fail(`${href} recommendation heading is "${heading || "missing"}"; expected "Continue exploring".`);
  }

  const linkHrefs = [...sectionHtml.matchAll(/<a\b[^>]*href="([^"]+)"/gi)]
    .map((match) => match[1]);

  if (linkHrefs.length < 1 || linkHrefs.length > 3) {
    fail(`${href} has ${linkHrefs.length} Continue exploring links; expected 1-3.`);
  }

  if (new Set(linkHrefs).size !== linkHrefs.length) {
    fail(`${href} has duplicate destinations within Continue exploring.`);
  }

  const navigationHtml = articleHtml.match(
    /<nav class="guide-navigation"[\s\S]*?<\/nav>/i,
  )?.[0] ?? "";
  const expectedCategoryHref = navigationHtml.match(
    /<a\b[^>]*class="guide-navigation-category"[^>]*href="([^"]+)"/i,
  )?.[1] ?? "";
  const categoryCount = linkHrefs.filter((linkHref) => linkHref === expectedCategoryHref).length;

  if (!expectedCategoryHref) {
    fail(`${href} has no category destination in its sequence navigation.`);
  } else if (categoryCount !== 1) {
    fail(
      `${href} Continue exploring contains ${categoryCount} links to "${expectedCategoryHref}"; expected one.`,
    );
  }

  for (const linkHref of linkHrefs) {
    if (!linkHref.startsWith("/guides/") || linkHref === "/guides/") continue;

    const targetHtml = guidePages.get(linkHref);
    if (!targetHtml) {
      fail(`${href} recommends missing guide "${linkHref}".`);
    } else if (!isIndexable(targetHtml)) {
      fail(`${href} recommends moved or noindex guide "${linkHref}".`);
    }
  }

  const contextualHtml = articleHtml
    .replace(/<aside class="related-guides"[\s\S]*?<\/aside>/gi, "")
    .replace(/<nav class="guide-navigation"[\s\S]*?<\/nav>/gi, "");
  const contextualLinks = [...contextualHtml.matchAll(
    /<a\b[^>]*href="(\/(?:guides|categories)\/[^"]*)"/gi,
  )].map((match) => match[1]);
  const counts = new Map();

  for (const linkHref of contextualLinks) {
    counts.set(linkHref, (counts.get(linkHref) ?? 0) + 1);
  }

  const repeatedRecommendations = linkHrefs.filter(
    (linkHref) => linkHref.startsWith("/guides/") && counts.has(linkHref),
  );
  if (repeatedRecommendations.length) {
    fail(
      `${href} repeats article-body destination(s) in Continue exploring: `
      + repeatedRecommendations.join(", "),
    );
  }

  for (const [linkHref, count] of counts) {
    if (count > 2) {
      fail(`${href} repeats article-body destination "${linkHref}" ${count} times.`);
    } else if (count === 2) {
      warnings.push(`${href} uses article-body destination "${linkHref}" twice.`);
    }
  }
}

if (checkedSections !== activeGuidePages.length) {
  fail(
    `Checked ${checkedSections} Continue exploring sections for ${activeGuidePages.length} active guides.`,
  );
}

if (warnings.length) {
  console.warn(`Continue exploring audit noted ${warnings.length} practical duplication warning(s):`);
  warnings.forEach((message) => console.warn(`- ${message}`));
}

if (failures.length) {
  console.error(`Continue exploring audit failed with ${failures.length} error(s):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(
  `Continue exploring audit passed: ${checkedSections} active guides use 1-3 unique links, `
  + "including the matching category destination; moved guides are excluded.",
);
