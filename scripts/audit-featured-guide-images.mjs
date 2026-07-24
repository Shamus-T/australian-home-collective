import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distDirectory = path.join(root, "dist");

const sections = [
  {
    file: path.join(distDirectory, "index.html"),
    marker: "homepage",
    label: "Homepage featured guides",
    minimumCardCount: 7,
    maximumCardCount: 7,
  },
  {
    file: path.join(distDirectory, "guides", "index.html"),
    marker: "start-here",
    label: 'Guides "Start here"',
    minimumCardCount: 6,
    maximumCardCount: 8,
  },
];

const failures = [];

function getAttribute(tag, attribute) {
  return tag.match(new RegExp(`\\b${attribute}="([^"]*)"`, "i"))?.[1] ?? "";
}

function getBuiltPagePath(href) {
  const pathname = new URL(href, "https://www.australianhomecollective.com.au").pathname;
  const relativePath = pathname === "/" ? "index.html" : path.join(pathname.slice(1), "index.html");
  return path.join(distDirectory, relativePath);
}

async function fileExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

for (const sectionConfig of sections) {
  const html = await readFile(sectionConfig.file, "utf8");
  const sectionPattern = new RegExp(
    `<section[^>]*\\bdata-featured-guides="${sectionConfig.marker}"[^>]*>([\\s\\S]*?)<\\/section>`,
    "i",
  );
  const sectionHtml = html.match(sectionPattern)?.[1] ?? "";

  if (!sectionHtml) {
    failures.push(`${sectionConfig.label}: marked section was not found.`);
    continue;
  }

  const cards = [...sectionHtml.matchAll(/<article\b[^>]*\bguide-card\b[^>]*>[\s\S]*?<\/article>/gi)]
    .map((match) => match[0]);

  if (
    cards.length < sectionConfig.minimumCardCount
    || cards.length > sectionConfig.maximumCardCount
  ) {
    failures.push(
      `${sectionConfig.label}: expected ${sectionConfig.minimumCardCount}`
      + `${sectionConfig.minimumCardCount === sectionConfig.maximumCardCount
        ? ""
        : `-${sectionConfig.maximumCardCount}`} cards, found ${cards.length}.`,
    );
  }

  const imageOwners = new Map();
  const hrefOwners = new Map();

  for (const card of cards) {
    const linkTag = card.match(/<a\b[^>]*>/i)?.[0] ?? "";
    const href = getAttribute(linkTag, "href");
    const title = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1].replace(/<[^>]+>/g, "").trim()
      ?? href
      ?? "Unknown card";
    const description = card.match(/<p(?![^>]*\bmeta\b)[^>]*>([\s\S]*?)<\/p>/gi)
      ?.at(-1)
      ?.replace(/<[^>]+>/g, "")
      .trim() ?? "";
    const imageTags = [...card.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);

    if (!description) {
      failures.push(`${sectionConfig.label}: "${title}" has no description.`);
    }

    if (imageTags.length !== 1) {
      failures.push(`${sectionConfig.label}: "${title}" has ${imageTags.length} featured images.`);
      continue;
    }

    const imageTag = imageTags[0];
    const src = getAttribute(imageTag, "src");
    const alt = getAttribute(imageTag, "alt").trim();
    const width = getAttribute(imageTag, "width");
    const height = getAttribute(imageTag, "height");

    if (!src.startsWith("/images/")) {
      failures.push(`${sectionConfig.label}: "${title}" has an invalid featured image path "${src}".`);
      continue;
    }

    if (!alt) {
      failures.push(`${sectionConfig.label}: "${title}" has empty featured image alt text.`);
    }

    if (!width || !height) {
      failures.push(`${sectionConfig.label}: "${title}" is missing intrinsic image dimensions.`);
    }

    const imagePath = path.join(distDirectory, decodeURIComponent(src.slice(1)));
    if (!(await fileExists(imagePath))) {
      failures.push(`${sectionConfig.label}: "${title}" references missing asset "${src}".`);
    }

    const priorOwner = imageOwners.get(src);
    if (priorOwner) {
      failures.push(
        `${sectionConfig.label}: "${title}" duplicates "${src}", already used by "${priorOwner}".`,
      );
    } else {
      imageOwners.set(src, title);
    }

    if (!href) {
      failures.push(`${sectionConfig.label}: "${title}" has no guide link.`);
      continue;
    }

    const priorHrefOwner = hrefOwners.get(href);
    if (priorHrefOwner) {
      failures.push(
        `${sectionConfig.label}: "${title}" duplicates "${href}", already used by "${priorHrefOwner}".`,
      );
    } else {
      hrefOwners.set(href, title);
    }

    const guidePath = getBuiltPagePath(href);
    if (!(await fileExists(guidePath))) {
      failures.push(`${sectionConfig.label}: "${title}" links to missing page "${href}".`);
      continue;
    }

    const guideHtml = await readFile(guidePath, "utf8");
    const headerHtml = guideHtml.match(
      /<header\b[^>]*\barticle-header\b[^>]*>[\s\S]*?<\/header>/i,
    )?.[0] ?? "";
    const heroTag = headerHtml.match(/<img\b[^>]*\bheader-image\b[^>]*>/i)?.[0] ?? "";
    const heroSrc = getAttribute(heroTag, "src");

    if (!heroSrc) {
      failures.push(`${sectionConfig.label}: "${title}" article has no hero image.`);
    } else if (heroSrc !== src) {
      failures.push(
        `${sectionConfig.label}: "${title}" uses "${src}", but its article hero is "${heroSrc}".`,
      );
    }
  }
}

if (failures.length) {
  console.error("Featured guide image audit failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    'Featured guide image audit passed: homepage and Guides "Start here" cards have valid, '
    + "unique URLs and loadable images matching their article heroes.",
  );
}
