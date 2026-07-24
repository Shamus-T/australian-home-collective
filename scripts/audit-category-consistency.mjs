import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const distRoot = path.join(process.cwd(), "dist");
const failures = [];
const categoryPaths = [
  "/categories/kitchen/",
  "/categories/laundry/",
  "/categories/bathroom/",
  "/categories/pets/",
  "/categories/nursery-kids/",
  "/categories/garage-storage/",
  "/categories/bedroom/",
  "/categories/living-spaces/",
  "/categories/home-office/",
  "/categories/outdoor-garden/",
];
const requiredSections = [
  "guide-collection",
  "planning-focus",
  "questions-and-mistakes",
  "nearby-categories",
  "common-questions",
];
const requiredFooterLinks = [
  "/about/",
  "/editorial-standards/",
  "/how-we-select-products/",
  "/corrections-content-review-policy/",
  "/australian-status-labels/",
  "/affiliate-disclosure/",
  "/privacy-policy/",
  "/contact/",
];

function fail(message) {
  failures.push(message);
}

function fileForHref(href) {
  return path.join(distRoot, ...href.replace(/^\/|\/$/g, "").split("/"), "index.html");
}

function readHref(href) {
  return fs.readFileSync(fileForHref(href), "utf8");
}

function decodeText(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&ndash;|&#8211;/gi, "â€“")
    .replace(/&mdash;|&#8212;/gi, "â€”")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1] ?? "";
}

function isIndexable(html) {
  const robots = html.match(/<meta name="robots" content="([^"]*)"/i)?.[1] ?? "";
  return !robots.toLowerCase().includes("noindex");
}

function guideBreadcrumbCategory(html) {
  const breadcrumbHtml = html.match(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/i)?.[0] ?? "";
  return [...breadcrumbHtml.matchAll(
    /<a\b[^>]*href="(\/categories\/[^"]+\/)"[^>]*>/gi,
  )].at(-1)?.[1];
}

function guideCards(html) {
  return [...html.matchAll(
    /<article\b[^>]*class="[^"]*\bguide-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
  )]
    .map((match) => match[0])
    .filter((card) => /<a\b[^>]*href="\/guides\/[^"]+\/"/i.test(card));
}

function navigationDestination(navigationHtml, className) {
  const container = navigationHtml.match(
    new RegExp(
      `<div[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>[\\s\\S]*?<\\/div>`,
      "i",
    ),
  )?.[0] ?? "";
  return container.match(/<a\b[^>]*href="([^"]+)"/i)?.[1] ?? "";
}

if (!fs.existsSync(distRoot)) {
  console.error("Category consistency audit requires a completed dist build.");
  process.exit(1);
}

const guideRoot = path.join(distRoot, "guides");
const guidePages = new Map();

for (const entry of fs.readdirSync(guideRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const href = `/guides/${entry.name}/`;
  const file = fileForHref(href);
  if (fs.existsSync(file)) guidePages.set(href, fs.readFileSync(file, "utf8"));
}

const activeGuidePages = new Map(
  [...guidePages].filter(([, html]) => isIndexable(html)),
);
const expectedByCategory = new Map(categoryPaths.map((categoryHref) => [
  categoryHref,
  [...activeGuidePages]
    .filter(([, html]) => guideBreadcrumbCategory(html) === categoryHref)
    .map(([href]) => href),
]));
const introductions = new Map();
let checkedCards = 0;

for (const categoryHref of categoryPaths) {
  const categoryFile = fileForHref(categoryHref);
  if (!fs.existsSync(categoryFile)) {
    fail(`${categoryHref} does not have generated HTML.`);
    continue;
  }

  const html = readHref(categoryHref);
  const pageTitle = decodeText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const breadcrumbHtml = html.match(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/i)?.[0] ?? "";
  const breadcrumbItems = [...breadcrumbHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => decodeText(
      match[1].replace(
        /<span class="breadcrumb-separator"[\s\S]*?<\/span>/gi,
        "",
      ),
    ));
  const breadcrumbHrefs = [...breadcrumbHtml.matchAll(/<a\b[^>]*href="([^"]+)"/gi)]
    .map((match) => match[1]);

  if (
    breadcrumbItems.length !== 4
    || breadcrumbItems[0] !== "Home"
    || breadcrumbItems[1] !== "Guides"
    || breadcrumbItems[2] !== "Categories"
    || breadcrumbItems[3] !== pageTitle
    || breadcrumbHrefs[0] !== "/"
    || breadcrumbHrefs[1] !== "/guides/"
    || breadcrumbHrefs[2] !== "/categories/"
  ) {
    fail(`${categoryHref} does not use the four-level Home, Guides, Categories and category breadcrumb.`);
  }

  const headerHtml = html.match(
    /<header\b[^>]*data-category-introduction[^>]*>([\s\S]*?)<\/header>/i,
  )?.[1] ?? "";
  const introduction = decodeText(
    headerHtml.match(/<p class="lead">([\s\S]*?)<\/p>/i)?.[1] ?? "",
  );

  if (introduction.length < 80) {
    fail(`${categoryHref} has a missing or undersized category-specific introduction.`);
  }
  if (
    /lorem ipsum|placeholder|category intro goes here|choose the guide that matches the part of the room or routine/i
      .test(introduction)
  ) {
    fail(`${categoryHref} contains known placeholder or generic template introduction copy.`);
  }

  const normalizedIntroduction = introduction.toLowerCase();
  const priorIntroduction = introductions.get(normalizedIntroduction);
  if (priorIntroduction) {
    fail(`${categoryHref} duplicates the introduction used by ${priorIntroduction}.`);
  } else {
    introductions.set(normalizedIntroduction, categoryHref);
  }

  for (const sectionName of requiredSections) {
    if (!new RegExp(`data-category-section="${sectionName}"`, "i").test(html)) {
      fail(`${categoryHref} is missing required category structure "${sectionName}".`);
    }
  }
  if (
    categoryHref === "/categories/kitchen/"
    && !/data-category-section="trust-and-methodology"/i.test(html)
  ) {
    fail(`${categoryHref} is missing its relevant trust and methodology section.`);
  }

  const footerHtml = html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/i)?.[0] ?? "";
  for (const requiredHref of requiredFooterLinks) {
    if (!new RegExp(`href="${requiredHref.replaceAll("/", "\\/")}"`, "i").test(footerHtml)) {
      fail(`${categoryHref} footer is missing trust/navigation link "${requiredHref}".`);
    }
  }

  const cards = guideCards(html);
  const cardHrefs = cards.map((card) => card.match(
    /<a\b[^>]*href="(\/guides\/[^"]+\/)"/i,
  )?.[1] ?? "");
  const expectedHrefs = expectedByCategory.get(categoryHref) ?? [];

  if (new Set(cardHrefs).size !== cardHrefs.length) {
    fail(`${categoryHref} contains duplicate guide cards.`);
  }

  const missingHrefs = expectedHrefs.filter((href) => !cardHrefs.includes(href));
  const unrelatedHrefs = cardHrefs.filter((href) => !expectedHrefs.includes(href));
  if (missingHrefs.length) {
    fail(`${categoryHref} is missing active guide(s): ${missingHrefs.join(", ")}.`);
  }
  if (unrelatedHrefs.length) {
    fail(`${categoryHref} contains unrelated, moved or noindex guide(s): ${unrelatedHrefs.join(", ")}.`);
  }

  for (let index = 0; index < cards.length; index += 1) {
    checkedCards += 1;
    const card = cards[index];
    const href = cardHrefs[index];
    const targetHtml = activeGuidePages.get(href);

    if (!targetHtml) {
      fail(`${categoryHref} card "${href || "missing URL"}" does not resolve to an active guide.`);
      continue;
    }

    const cardTitle = decodeText(card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? "");
    const guideTitle = decodeText(targetHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
    if (!cardTitle || cardTitle !== guideTitle) {
      fail(`${categoryHref} card "${href}" title does not match its guide title.`);
    }

    const cardParagraphs = [...card.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((match) => decodeText(match[1]));
    const description = cardParagraphs.at(-1) ?? "";
    if (description.length < 25) {
      fail(`${categoryHref} card "${href}" has a missing or undersized description.`);
    }

    const imageTags = [...card.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
    if (imageTags.length !== 1) {
      fail(`${categoryHref} card "${href}" has ${imageTags.length} images; expected one.`);
      continue;
    }

    const imageTag = imageTags[0];
    const imageSrc = attribute(imageTag, "src");
    const imageAlt = attribute(imageTag, "alt").trim();
    const width = Number(attribute(imageTag, "width"));
    const height = Number(attribute(imageTag, "height"));
    const heroTag = targetHtml.match(
      /<header\b[^>]*class="[^"]*\barticle-header\b[^"]*"[^>]*>[\s\S]*?<img\b[^>]*class="[^"]*\bheader-image\b[^"]*"[^>]*>/i,
    )?.[0].match(/<img\b[^>]*class="[^"]*\bheader-image\b[^"]*"[^>]*>/i)?.[0] ?? "";
    const heroSrc = attribute(heroTag, "src");

    if (!imageSrc.startsWith("/images/")) {
      fail(`${categoryHref} card "${href}" has invalid image URL "${imageSrc}".`);
    } else {
      const assetFile = path.join(distRoot, ...decodeURIComponent(imageSrc.slice(1)).split("/"));
      if (!fs.existsSync(assetFile)) {
        fail(`${categoryHref} card "${href}" image asset does not exist: "${imageSrc}".`);
      }
    }
    if (!imageAlt) {
      fail(`${categoryHref} card "${href}" has empty image alt text.`);
    }
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      fail(`${categoryHref} card "${href}" is missing valid intrinsic image dimensions.`);
    }
    if (!heroSrc || imageSrc !== heroSrc) {
      fail(`${categoryHref} card "${href}" image does not match its article hero.`);
    }

    const navigationHtml = targetHtml.match(
      /<nav class="guide-navigation"[\s\S]*?<\/nav>/i,
    )?.[0] ?? "";
    const expectedPrevious = cardHrefs[index - 1] ?? "";
    const expectedNext = cardHrefs[index + 1] ?? "";
    const actualPrevious = navigationDestination(navigationHtml, "guide-navigation-previous");
    const actualNext = navigationDestination(navigationHtml, "guide-navigation-next");
    const actualCategory = navigationHtml.match(
      /<a\b[^>]*class="guide-navigation-category"[^>]*href="([^"]+)"/i,
    )?.[1] ?? "";

    if (
      actualPrevious !== expectedPrevious
      || actualNext !== expectedNext
      || actualCategory !== categoryHref
    ) {
      fail(`${categoryHref} card order and "${href}" previous/category/next sequence do not match.`);
    }
  }
}

const assignedGuideHrefs = new Set(
  [...expectedByCategory.values()].flat(),
);
const categorizedActiveHrefs = [...activeGuidePages]
  .filter(([, html]) => guideBreadcrumbCategory(html))
  .map(([href]) => href);

for (const href of categorizedActiveHrefs) {
  if (!assignedGuideHrefs.has(href)) {
    fail(`${href} belongs to an active category not covered by the ten category pages.`);
  }
}

if (failures.length) {
  console.error(`Category consistency audit failed with ${failures.length} error(s):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(
  `Category consistency audit passed: ${categoryPaths.length} category pages and ${checkedCards} `
  + "guide cards have complete structure, correct membership, order, URLs, descriptions and hero images.",
);
