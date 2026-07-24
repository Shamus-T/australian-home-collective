import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const distRoot = path.join(process.cwd(), "dist");
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(distRoot, ...relativePath.split("/")), "utf8");
}

function pagePathForHref(href) {
  return `${href.replace(/^\/|\/$/g, "")}/index.html`;
}

function hrefForPagePath(relativePath) {
  return `/${relativePath.slice(0, -"index.html".length)}`;
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1] ?? "";
}

function text(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&larr;|&#8592;/gi, "←")
    .replace(/&rarr;|&#8594;/gi, "→")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function isIndexable(html) {
  const robots = html.match(/<meta name="robots" content="([^"]*)"/i)?.[1] ?? "";
  return !robots.toLowerCase().includes("noindex");
}

function guideCardHrefs(html) {
  return [
    ...new Set(
      [...html.matchAll(
        /<article\b[^>]*class="[^"]*\bguide-card\b[^"]*"[^>]*>[\s\S]*?<a\b[^>]*href="(\/guides\/[^"]+\/)"/gi,
      )].map((match) => match[1]),
    ),
  ];
}

function guideBreadcrumb(html) {
  const breadcrumbs = html.match(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/i)?.[0] ?? "";
  const categoryLink = [...breadcrumbs.matchAll(/<a\b[^>]*href="(\/categories\/[^"]+\/)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .at(-1);

  return categoryLink
    ? { href: categoryLink[1], label: text(categoryLink[2]) }
    : undefined;
}

function navigationLink(navigationHtml, className) {
  const container = navigationHtml.match(
    new RegExp(`<div[^>]+class="[^"]*\\b${className}\\b[^"]*"[^>]*>[\\s\\S]*?<\\/div>`, "i"),
  )?.[0] ?? "";
  const linkTag = container.match(/<a\b[^>]*>/i)?.[0] ?? "";
  return linkTag ? attribute(linkTag, "href") : "";
}

if (!fs.existsSync(distRoot)) {
  console.error("Guide navigation audit requires a completed dist build.");
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
const activeGuideHrefs = new Set(
  [...guidePages].filter(([, html]) => isIndexable(html)).map(([href]) => href),
);
const movedGuideHrefs = new Set(
  [...guidePages].filter(([, html]) => !isIndexable(html)).map(([href]) => href),
);
const expectedNavigation = new Map();
const sequences = [];

const categoryRoot = path.join(distRoot, "categories");
for (const entry of fs.readdirSync(categoryRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const relativePath = `categories/${entry.name}/index.html`;
  if (!fs.existsSync(path.join(distRoot, ...relativePath.split("/")))) continue;

  const categoryHref = `/categories/${entry.name}/`;
  const categoryHtml = read(relativePath);
  const hrefs = guideCardHrefs(categoryHtml).filter((href) => {
    const guideHtml = guidePages.get(href);
    return guideHtml && isIndexable(guideHtml) && guideBreadcrumb(guideHtml)?.href === categoryHref;
  });

  if (!hrefs.length) continue;
  sequences.push({ categoryHref, hrefs });
}

const guideIndexHtml = read("guides/index.html");
const ungroupedSections = [...guideIndexHtml.matchAll(
  /<section class="guide-library-group"[\s\S]*?<\/section>/gi,
)].map((match) => match[0]);

for (const section of ungroupedSections) {
  if (/href="\/categories\//i.test(section)) continue;

  const label = text(section.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? "");
  const hrefs = [...new Set(
    [...section.matchAll(/<a\b[^>]*href="(\/guides\/[^"]+\/)"/gi)]
      .map((match) => match[1])
      .filter((href) => activeGuideHrefs.has(href)),
  )];

  if (hrefs.length) {
    sequences.push({ categoryHref: "/guides/", label, hrefs });
  }
}

for (const sequence of sequences) {
  sequence.hrefs.forEach((href, index) => {
    if (expectedNavigation.has(href)) {
      fail(`${href} appears in more than one active category sequence.`);
      return;
    }

    const guideHtml = guidePages.get(href);
    const breadcrumb = guideHtml ? guideBreadcrumb(guideHtml) : undefined;
    expectedNavigation.set(href, {
      categoryHref: sequence.categoryHref,
      categoryLabel: breadcrumb?.label || sequence.label || "",
      previous: sequence.hrefs[index - 1],
      next: sequence.hrefs[index + 1],
    });
  });
}

for (const href of activeGuideHrefs) {
  if (!expectedNavigation.has(href)) {
    fail(`${href} is an active guide but is absent from every visible category sequence.`);
  }
}

for (const href of movedGuideHrefs) {
  const html = guidePages.get(href) ?? "";
  if (/<nav class="guide-navigation"/i.test(html)) {
    fail(`${href} is a moved or non-indexable guide but renders guide navigation.`);
  }
}

for (const [href, expected] of expectedNavigation) {
  const html = guidePages.get(href) ?? "";
  const navigationMatch = html.match(/<nav class="guide-navigation"[\s\S]*?<\/nav>/i);
  const navigationHtml = navigationMatch?.[0] ?? "";

  if (!navigationHtml) {
    fail(`${href} is missing the guide navigation block.`);
    continue;
  }

  const categoryTag = navigationHtml.match(
    /<a\b[^>]*class="guide-navigation-category"[^>]*>/i,
  )?.[0] ?? "";
  const categoryHref = attribute(categoryTag, "href");
  const categoryText = text(
    navigationHtml.match(
      /<a\b[^>]*class="guide-navigation-category"[^>]*>([\s\S]*?)<\/a>/i,
    )?.[1] ?? "",
  );
  const expectedCategoryText = `Back to ${expected.categoryLabel} guides`;

  if (categoryHref !== expected.categoryHref) {
    fail(`${href} category return link is "${categoryHref || "missing"}"; expected "${expected.categoryHref}".`);
  }
  if (categoryText !== expectedCategoryText) {
    fail(`${href} category return text is "${categoryText || "missing"}"; expected "${expectedCategoryText}".`);
  }

  const previousHref = navigationLink(navigationHtml, "guide-navigation-previous");
  const nextHref = navigationLink(navigationHtml, "guide-navigation-next");

  if (expected.previous && previousHref !== expected.previous) {
    fail(`${href} previous link is "${previousHref || "missing"}"; expected "${expected.previous}".`);
  }
  if (!expected.previous && previousHref) {
    fail(`${href} is first in its category but renders previous link "${previousHref}".`);
  }
  if (expected.next && nextHref !== expected.next) {
    fail(`${href} next link is "${nextHref || "missing"}"; expected "${expected.next}".`);
  }
  if (!expected.next && nextHref) {
    fail(`${href} is last in its category but renders next link "${nextHref}".`);
  }

  const navigationText = text(navigationHtml);
  if (expected.previous && (!navigationText.includes("Previous guide") || !navigationText.includes("←"))) {
    fail(`${href} previous navigation is missing its label or left arrow.`);
  }
  if (expected.next && (!navigationText.includes("Next guide") || !navigationText.includes("→"))) {
    fail(`${href} next navigation is missing its label or right arrow.`);
  }

  const navigationIndex = navigationMatch?.index ?? -1;
  const footerIndex = html.indexOf('<footer class="site-footer"');
  const relatedIndex = html.lastIndexOf('<aside class="related-guides"', navigationIndex);
  const faqIndex = html.lastIndexOf('<section class="faq-block"', navigationIndex);

  if (navigationIndex < relatedIndex || navigationIndex < faqIndex || footerIndex < navigationIndex) {
    fail(`${href} guide navigation is not after related guides and FAQs or before the site footer.`);
  }
}

if (expectedNavigation.size !== activeGuideHrefs.size) {
  fail(
    `Expected navigation for ${activeGuideHrefs.size} active guides, but resolved ${expectedNavigation.size}.`,
  );
}

if (failures.length) {
  console.error(`Guide navigation audit failed with ${failures.length} error(s):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(
  `Guide navigation audit passed: ${activeGuideHrefs.size} active guides matched ${sequences.length} visible category sequences; ${movedGuideHrefs.size} moved guides excluded.`,
);
