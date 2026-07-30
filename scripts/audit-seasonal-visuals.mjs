import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import { loadSeasonalGuideData } from "./lib/load-seasonal-guides.mjs";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const failures = [];
const expectedLogoAssets = [
  {
    label: "preferred WebP logo",
    publicPath: "/images/header-title.webp",
    sourceReference: "/images/header-title.webp?v=2",
    format: "webp",
  },
  {
    label: "PNG fallback logo",
    publicPath: "/images/header-title.png",
    sourceReference: "/images/header-title.png?v=7",
    format: "png",
  },
];
const expectedLogoDimensions = { width: 1200, height: 300 };

function addFailure(message) {
  failures.push(message);
}

function getAttribute(tag, attribute) {
  return tag.match(new RegExp(`\\b${attribute}="([^"]*)"`, "i"))?.[1] ?? "";
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#0*39;|&#x0*27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function plainText(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function normalizedRegistryPath(publicUrl) {
  return `public/${decodeURIComponent(publicUrl).replace(/^\/+/, "")}`.replaceAll("\\", "/");
}

function outputPathForHref(href) {
  const pathname = new URL(href, "https://australianhomecollective.com.au").pathname;
  return pathname === "/"
    ? path.join(distRoot, "index.html")
    : path.join(distRoot, ...pathname.split("/").filter(Boolean), "index.html");
}

function outputPathForImage(src) {
  return path.join(distRoot, ...decodeURIComponent(src).split("/").filter(Boolean));
}

async function fileExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function describeGuide(season, guide) {
  return `${season.title} — "${guide.title}" (${guide.href ?? "planned; no URL"}) `
    + `[image: ${guide.image ?? "none"}]`;
}

async function inspectLogoAsset(asset) {
  const publicFile = path.join(root, "public", ...asset.publicPath.split("/").filter(Boolean));
  const distFile = path.join(distRoot, ...asset.publicPath.split("/").filter(Boolean));

  for (const [location, file] of [["public", publicFile], ["built output", distFile]]) {
    if (!(await fileExists(file))) {
      addFailure(`Header logo: ${asset.label} is missing from ${location}: ${file}.`);
    }
  }
  if (!(await fileExists(publicFile))) return undefined;

  const image = sharp(publicFile);
  const metadata = await image.metadata();
  if (metadata.format !== asset.format) {
    addFailure(
      `Header logo: ${asset.label} has format "${metadata.format ?? "unknown"}"; `
      + `expected "${asset.format}".`,
    );
  }
  if (
    metadata.width !== expectedLogoDimensions.width
    || metadata.height !== expectedLogoDimensions.height
  ) {
    addFailure(
      `Header logo: ${asset.label} is ${metadata.width ?? "unknown"}×${metadata.height ?? "unknown"}; `
      + `expected ${expectedLogoDimensions.width}×${expectedLogoDimensions.height}.`,
    );
  }
  if (!metadata.hasAlpha) {
    addFailure(`Header logo: ${asset.label} has no alpha channel.`);
  }

  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparentPixelCount = 0;
  let partialAlphaPixelCount = 0;
  for (let offset = 3; offset < data.length; offset += info.channels) {
    const alpha = data[offset];
    if (alpha === 0) transparentPixelCount += 1;
    else if (alpha < 255) partialAlphaPixelCount += 1;
  }
  const cornerOffsets = [
    3,
    (info.width - 1) * info.channels + 3,
    (info.height - 1) * info.width * info.channels + 3,
    ((info.height * info.width) - 1) * info.channels + 3,
  ];
  if (cornerOffsets.some((offset) => data[offset] !== 0)) {
    addFailure(`Header logo: ${asset.label} does not have transparent corner pixels.`);
  }
  if (transparentPixelCount < info.width * info.height * 0.5) {
    addFailure(
      `Header logo: ${asset.label} has only ${transparentPixelCount} fully transparent pixels; `
      + "the opaque background appears to remain.",
    );
  }
  if (partialAlphaPixelCount === 0) {
    addFailure(
      `Header logo: ${asset.label} has no partial-alpha edge pixels; anti-aliased artwork may be damaged.`,
    );
  }
  return { data, info, metadata, transparentPixelCount, partialAlphaPixelCount };
}

const { seasonalLanding, seasonalSections, publishedSeasonalGuides } =
  await loadSeasonalGuideData(root);
const homepagePath = path.join(distRoot, "index.html");
const seasonalPath = path.join(distRoot, "seasonal", "index.html");
const homepageHtml = await readFile(homepagePath, "utf8");
const seasonalHtml = await readFile(seasonalPath, "utf8");
const rejectedRegistry = JSON.parse(
  await readFile(path.join(root, "docs", "visual", "rejected-image-assets.json"), "utf8"),
);
const blockedImages = new Map(
  rejectedRegistry.assets.map((asset) => [asset.path.replaceAll("\\", "/"), asset]),
);

const categorySection = homepageHtml.match(
  /<section\b[^>]*\bdata-homepage-category-grid\b[^>]*>([\s\S]*?)<\/section>/i,
)?.[1] ?? "";
if (!categorySection) {
  addFailure("Homepage Seasonal feature: the marked homepage category grid is missing.");
}
const categoryFallbackImages = new Set(
  [...categorySection.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map((match) => match[1]),
);

const categoryIndex = homepageHtml.search(/\bdata-homepage-category-grid\b/i);
const seasonalFeatureIndex = homepageHtml.search(/\bdata-homepage-seasonal-feature\b/i);
const featuredGuidesIndex = homepageHtml.search(/\bdata-featured-guides="homepage"/i);
if (
  categoryIndex < 0
  || seasonalFeatureIndex <= categoryIndex
  || featuredGuidesIndex <= seasonalFeatureIndex
) {
  addFailure(
    "Homepage Seasonal feature: expected it after Browse by category and before A good place to begin.",
  );
}

const homepageFeature = homepageHtml.match(
  /<section\b[^>]*\bdata-homepage-seasonal-feature\b[^>]*>([\s\S]*?)<\/section>/i,
)?.[1] ?? "";
if (!homepageFeature) {
  addFailure("Homepage Seasonal feature: marked feature section was not found.");
} else {
  const linkTag = homepageFeature.match(/<a\b[^>]*>/i)?.[0] ?? "";
  const href = getAttribute(linkTag, "href");
  if (href !== seasonalLanding.href) {
    addFailure(
      `Homepage Seasonal feature: link is "${href || "missing"}"; expected "${seasonalLanding.href}".`,
    );
  }
  const imageTags = [...homepageFeature.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const featureImage = imageTags.find((tag) => /\bdata-seasonal-feature-image\b/i.test(tag)) ?? "";
  const featureSrc = getAttribute(featureImage, "src");
  const featureAlt = getAttribute(featureImage, "alt").trim();
  if (!featureImage) {
    addFailure("Homepage Seasonal feature: feature image is missing.");
  } else {
    if (featureSrc !== seasonalLanding.image) {
      addFailure(
        `Homepage Seasonal feature: image is "${featureSrc || "missing"}"; `
        + `shared seasonal data requires "${seasonalLanding.image}".`,
      );
    }
    if (featureAlt !== seasonalLanding.imageAlt) {
      addFailure(
        `Homepage Seasonal feature: alt text is "${featureAlt || "missing"}"; `
        + `shared seasonal data requires "${seasonalLanding.imageAlt}".`,
      );
    }
    if (!getAttribute(featureImage, "width") || !getAttribute(featureImage, "height")) {
      addFailure("Homepage Seasonal feature: image is missing declared width or height.");
    }
    if (!(await fileExists(outputPathForImage(featureSrc)))) {
      addFailure(`Homepage Seasonal feature: built image is missing: "${featureSrc}".`);
    }
    const blocked = blockedImages.get(normalizedRegistryPath(featureSrc));
    if (blocked) {
      addFailure(
        `Homepage Seasonal feature: image "${featureSrc}" is ${blocked.status}: ${blocked.reason}`,
      );
    }
  }
  const h1Count = homepageFeature.match(/<h1\b/gi)?.length ?? 0;
  const featureHeadings = [...homepageFeature.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const h2Titles = featureHeadings
    .filter((match) => match[1] === "2")
    .map((match) => plainText(match[2]));
  if (h1Count !== 0 || h2Titles.length !== 1 || h2Titles[0] !== seasonalLanding.heading) {
    addFailure(
      `Homepage Seasonal feature: expected one H2 "${seasonalLanding.heading}" and no H1; `
      + `found H2 values [${h2Titles.join(", ")}] and ${h1Count} H1 elements.`,
    );
  }
}

const homepageH1Count = homepageHtml.match(/<h1\b/gi)?.length ?? 0;
if (homepageH1Count !== 1) {
  addFailure(`Homepage Seasonal feature: homepage has ${homepageH1Count} H1 elements; expected one.`);
}

const seasonalH1Count = seasonalHtml.match(/<h1\b/gi)?.length ?? 0;
if (seasonalH1Count !== 1) {
  addFailure(`Seasonal Guides page has ${seasonalH1Count} H1 elements; expected one.`);
}

const imageOwners = new Map();
let auditedPublishedGuideCount = 0;

for (const season of seasonalSections) {
  const sectionHtml = seasonalHtml.match(
    new RegExp(
      `<section\\b[^>]*\\bdata-season-id="${season.id}"[^>]*>([\\s\\S]*?)<\\/section>`,
      "i",
    ),
  )?.[1] ?? "";
  if (!sectionHtml) {
    addFailure(`Seasonal Guides: ${season.title} section (${season.id}) is missing.`);
    continue;
  }

  const sectionH2s = [...sectionHtml.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((match) => plainText(match[1]));
  if (sectionH2s.length !== 1 || sectionH2s[0] !== season.title) {
    addFailure(
      `Seasonal Guides: ${season.title} section requires one H2 "${season.title}"; `
      + `found [${sectionH2s.join(", ")}].`,
    );
  }

  const cards = [...sectionHtml.matchAll(
    /<article\b[^>]*class="[^"]*\bseasonal-guide-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,
  )].map((match) => match[0]);
  const publishedGuides = season.guides.filter((guide) => guide.status === "published");
  const plannedGuides = season.guides.filter((guide) => guide.status === "planned");
  const publishedCards = cards.filter((card) => /<a\b[^>]*href="/i.test(card));
  const plannedCards = cards.filter((card) => !/<a\b[^>]*href="/i.test(card));

  if (publishedCards.length !== publishedGuides.length) {
    addFailure(
      `Seasonal Guides: ${season.title} has ${publishedCards.length} published image cards; `
      + `shared seasonal data requires ${publishedGuides.length}.`,
    );
  }
  if (plannedCards.length !== plannedGuides.length) {
    addFailure(
      `Seasonal Guides: ${season.title} has ${plannedCards.length} planned text cards; `
      + `shared seasonal data requires ${plannedGuides.length}.`,
    );
  }

  for (const [index, guide] of publishedGuides.entries()) {
    auditedPublishedGuideCount += 1;
    const label = describeGuide(season, guide);
    const card = publishedCards[index] ?? "";

    if (!guide.href) addFailure(`${label}: published guide has no URL.`);
    if (!guide.image) addFailure(`${label}: published guide has no image path.`);
    if (!guide.imageAlt?.trim()) addFailure(`${label}: published guide has no image alt text.`);
    if (!card) continue;

    const linkTag = card.match(/<a\b[^>]*>/i)?.[0] ?? "";
    const href = getAttribute(linkTag, "href");
    const headingTags = [...card.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
    const cardTitle = headingTags.length === 1 ? plainText(headingTags[0][2]) : "";
    const cardHeadingLevel = headingTags.length === 1 ? Number(headingTags[0][1]) : 0;
    const imageTags = [...card.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
    const imageTag = imageTags[0] ?? "";
    const src = getAttribute(imageTag, "src");
    const alt = getAttribute(imageTag, "alt").trim();

    if (href !== guide.href) {
      addFailure(`${label}: card URL is "${href || "missing"}"; expected "${guide.href}".`);
    }
    if (cardTitle !== guide.title) {
      addFailure(`${label}: card title is "${cardTitle || "missing"}"; expected "${guide.title}".`);
    }
    if (cardHeadingLevel !== 3) {
      addFailure(`${label}: card heading is H${cardHeadingLevel || "missing"}; expected H3 beneath H2.`);
    }
    if (imageTags.length !== 1) {
      addFailure(`${label}: card contains ${imageTags.length} images; expected exactly one.`);
    }
    if (src !== guide.image) {
      addFailure(`${label}: card image is "${src || "missing"}"; expected "${guide.image}".`);
    }
    if (alt !== guide.imageAlt) {
      addFailure(`${label}: card alt is "${alt || "missing"}"; expected "${guide.imageAlt}".`);
    }
    if (!getAttribute(imageTag, "width") || !getAttribute(imageTag, "height")) {
      addFailure(`${label}: card image is missing declared width or height.`);
    }
    if (categoryFallbackImages.has(src)) {
      addFailure(`${label}: card uses generic category fallback "${src}".`);
    }
    const blocked = blockedImages.get(normalizedRegistryPath(src));
    if (blocked) {
      addFailure(`${label}: card image is ${blocked.status}: ${blocked.reason}`);
    }
    if (!(await fileExists(outputPathForImage(src)))) {
      addFailure(`${label}: image is missing from public output: "${src}".`);
    }

    const priorOwner = imageOwners.get(src);
    if (priorOwner) {
      addFailure(`${label}: image duplicates ${priorOwner}.`);
    } else {
      imageOwners.set(src, label);
    }

    const guidePath = outputPathForHref(href);
    if (!(await fileExists(guidePath))) {
      addFailure(`${label}: guide output is missing: "${href}".`);
      continue;
    }
    const guideHtml = await readFile(guidePath, "utf8");
    const articleHeader = guideHtml.match(
      /<header\b[^>]*class="[^"]*\barticle-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/i,
    )?.[0] ?? "";
    const heroTag = articleHeader.match(
      /<img\b[^>]*class="[^"]*\bheader-image\b[^"]*"[^>]*>/i,
    )?.[0] ?? "";
    const heroSrc = getAttribute(heroTag, "src");
    const heroAlt = getAttribute(heroTag, "alt").trim();
    if (heroSrc !== guide.image) {
      addFailure(`${label}: article hero is "${heroSrc || "missing"}"; expected "${guide.image}".`);
    }
    if (heroAlt !== guide.imageAlt) {
      addFailure(
        `${label}: article hero alt is "${heroAlt || "missing"}"; expected "${guide.imageAlt}".`,
      );
    }
  }

  for (const [index, guide] of plannedGuides.entries()) {
    const label = describeGuide(season, guide);
    const card = plannedCards[index] ?? "";
    if (!card) continue;
    if (/<a\b/i.test(card) || /<img\b/i.test(card)) {
      addFailure(`${label}: planned guide must remain a clearly marked non-linked text card.`);
    }
    if (!/\bPlanned\b/i.test(plainText(card))) {
      addFailure(`${label}: planned guide card is missing its Planned status.`);
    }
  }
}

if (auditedPublishedGuideCount !== publishedSeasonalGuides.length) {
  addFailure(
    `Seasonal Guides: audited ${auditedPublishedGuideCount} published guides; `
    + `shared seasonal data contains ${publishedSeasonalGuides.length}.`,
  );
}
if (imageOwners.size !== publishedSeasonalGuides.length) {
  addFailure(
    `Seasonal Guides: ${imageOwners.size} unique published images for `
    + `${publishedSeasonalGuides.length} published guides.`,
  );
}

const siteHeaderSource = await readFile(
  path.join(root, "src", "components", "SiteHeader.astro"),
  "utf8",
);
for (const asset of expectedLogoAssets) {
  if (!siteHeaderSource.includes(asset.sourceReference)) {
    addFailure(
      `Header logo: SiteHeader.astro does not reference approved cache version `
      + `"${asset.sourceReference}".`,
    );
  }
  if (!homepageHtml.includes(asset.sourceReference.replaceAll("&", "&amp;"))) {
    addFailure(
      `Header logo: built homepage does not reference approved cache version `
      + `"${asset.sourceReference}".`,
    );
  }
}

const logoResults = [];
for (const asset of expectedLogoAssets) {
  logoResults.push(await inspectLogoAsset(asset));
}
if (logoResults.every(Boolean)) {
  const [webpResult, pngResult] = logoResults;
  if (webpResult.info.width === pngResult.info.width && webpResult.info.height === pngResult.info.height) {
    let alphaMismatchCount = 0;
    for (let offset = 3; offset < webpResult.data.length; offset += webpResult.info.channels) {
      if (webpResult.data[offset] !== pngResult.data[offset]) alphaMismatchCount += 1;
    }
    if (alphaMismatchCount !== 0) {
      addFailure(
        `Header logo: WebP and PNG alpha masks differ at ${alphaMismatchCount} pixels.`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`Seasonal and header visual regression audit failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Seasonal and header visual regression audit passed: homepage feature, `
  + `${publishedSeasonalGuides.length} published seasonal guide cards with unique article-matched `
  + `images, planned-card safeguards, heading levels, rejected/fallback exclusions, and transparent `
  + `${expectedLogoDimensions.width}×${expectedLogoDimensions.height} WebP/PNG logo assets.`,
);
