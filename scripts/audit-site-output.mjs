import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const sitemapPath = path.join(distRoot, "sitemap.xml");
const siteOrigin = "https://australianhomecollective.com.au";
const errors = [];
const faqQuestions = new Map();
const internalLinks = [];

function addError(message) {
  errors.push(message);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function firstMatch(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? "";
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
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:[a-z]+|#\d+|#x[a-f\d]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderedText(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#0*32;|&#x0*20;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#0*39;|&#x0*27;/gi, "'")
    .replace(/&(?:lsquo|rsquo);/gi, "’")
    .replace(/&(?:ldquo|rdquo);/gi, "”")
    .replace(/&(?:ndash|mdash);/gi, "—")
    .replace(/&#(?:x[\da-f]+|\d+);/gi, "x")
    .replace(/&[a-z]+;/gi, "x");
}

function inlineLinkSpacingErrors(html) {
  const issues = [];
  const linkPattern = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const linkText = renderedText(match[1]);
    if (!linkText) continue;

    const start = match.index;
    const end = start + match[0].length;
    const precedingTextStart = html.lastIndexOf(">", start - 1) + 1;
    const followingTagStart = html.indexOf("<", end);
    const precedingText = renderedText(html.slice(precedingTextStart, start));
    const followingText = renderedText(html.slice(end, followingTagStart === -1 ? html.length : followingTagStart));
    const previousCharacter = precedingText.at(-1) ?? "";
    const firstLinkCharacter = linkText[0];
    const lastLinkCharacter = linkText.at(-1);
    const nextTextToken = followingText.match(/^\S+/u)?.[0] ?? "";
    const openingPunctuation = new Set(["(", "[", "{", "“", "‘", "-", "–", "—", "/"]);

    if (
      previousCharacter &&
      !/\s/u.test(previousCharacter) &&
      !/\s/u.test(firstLinkCharacter) &&
      !openingPunctuation.has(previousCharacter)
    ) {
      issues.push({ position: start, side: "before" });
    }

    if (/^[\p{L}\p{N}]/u.test(nextTextToken)) {
      issues.push({ position: end, side: "after" });
    } else if (
      /^[.,;:!?\])}”]+[\p{L}\p{N}]/u.test(nextTextToken) &&
      /[\p{L}\p{N}’'"]$/u.test(lastLinkCharacter)
    ) {
      issues.push({ position: end, side: "after" });
    }
  }

  return issues.map(({ position, side }) => {
    const context = plainText(html.slice(Math.max(0, position - 80), Math.min(html.length, position + 120)));
    return `missing whitespace ${side} an inline link near “${context}”`;
  });
}

function outputPathForUrl(urlValue) {
  const url = new URL(urlValue, siteOrigin);
  if (url.origin !== siteOrigin) return null;
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) {
    return path.join(distRoot, ...pathname.split("/").filter(Boolean), "index.html");
  }
  return path.join(distRoot, ...pathname.split("/").filter(Boolean));
}

function publicUrlForOutput(relativePath) {
  if (relativePath === "index.html") return `${siteOrigin}/`;
  if (relativePath.endsWith("/index.html")) {
    return `${siteOrigin}/${relativePath.slice(0, -"index.html".length)}`;
  }
  return `${siteOrigin}/${relativePath}`;
}

if (!fs.existsSync(distRoot)) {
  console.error("Site output audit requires a completed dist build.");
  process.exit(1);
}

const htmlFiles = walk(distRoot).filter((file) => file.endsWith(".html"));
const pages = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const relativePath = path.relative(distRoot, file).replaceAll(path.sep, "/");
  const title = decodeEntities(firstMatch(html, /<title>([\s\S]*?)<\/title>/i));
  const description = firstMatch(html, /<meta name="description" content="([^"]*)"/i);
  const canonical = firstMatch(html, /<link rel="canonical" href="([^"]*)"/i);
  const robots = firstMatch(html, /<meta name="robots" content="([^"]*)"/i);
  const pageUrl = publicUrlForOutput(relativePath);
  const ogTitle = decodeEntities(firstMatch(html, /<meta property="og:title" content="([^"]*)"/i));
  const ogDescription = firstMatch(html, /<meta property="og:description" content="([^"]*)"/i);
  const ogImage = firstMatch(html, /<meta property="og:image" content="([^"]*)"/i);
  const ogImageAlt = firstMatch(html, /<meta property="og:image:alt" content="([^"]*)"/i);
  const ogImageType = firstMatch(html, /<meta property="og:image:type" content="([^"]*)"/i);
  const ogUrl = firstMatch(html, /<meta property="og:url" content="([^"]*)"/i);
  const h1Count = html.match(/<h1(?:\s[^>]*)?>/gi)?.length ?? 0;
  const indexable = !robots.toLowerCase().includes("noindex");
  const structuredDataBlocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const structuredDataTypes = new Set();
  const structuredDataNodes = [];
  const structuredDataIds = new Set();

  for (const issue of inlineLinkSpacingErrors(html)) {
    addError(`${relativePath} has ${issue}.`);
  }

  for (const [, value] of structuredDataBlocks) {
    try {
      const data = JSON.parse(value);
      const nodes = Array.isArray(data?.["@graph"]) ? data["@graph"] : [data];
      for (const node of nodes) {
        structuredDataNodes.push(node);
        if (node?.["@id"]) {
          if (structuredDataIds.has(node["@id"])) {
            addError(`${relativePath} repeats JSON-LD @id ${node["@id"]}.`);
          }
          structuredDataIds.add(node["@id"]);
        }
        const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
        for (const type of types.filter(Boolean)) structuredDataTypes.add(type);
      }
    } catch {
      addError(`${relativePath} contains invalid JSON-LD.`);
    }
  }

  if (!title) addError(`${relativePath} has no title.`);
  if (title.length > 60) addError(`${relativePath} has a title longer than 60 characters (${title.length}).`);
  if (!description) addError(`${relativePath} has no meta description.`);
  if (indexable && description.length < 70) {
    addError(`${relativePath} has a meta description shorter than 70 characters (${description.length}).`);
  }
  if (description.length > 160) {
    addError(`${relativePath} has a meta description longer than 160 characters (${description.length}).`);
  }
  if (!canonical) addError(`${relativePath} has no canonical URL.`);
  if (indexable && canonical !== pageUrl) {
    addError(`${relativePath} is indexable but is not self-canonical (${canonical || "missing"}).`);
  }
  if (canonical && /[?#]/.test(new URL(canonical, siteOrigin).href.replace(siteOrigin, ""))) {
    addError(`${relativePath} has a canonical URL containing a query string or fragment.`);
  }
  if (!ogTitle || ogTitle !== title) addError(`${relativePath} has an Open Graph title mismatch.`);
  if (!ogDescription || ogDescription !== description) {
    addError(`${relativePath} has an Open Graph description mismatch.`);
  }
  if (!ogImage) addError(`${relativePath} has no Open Graph image.`);
  if (!ogImageAlt) addError(`${relativePath} has no Open Graph image alt text.`);
  if (!ogUrl || ogUrl !== canonical) addError(`${relativePath} has an Open Graph URL mismatch.`);
  if (ogImage) {
    const imageUrl = new URL(ogImage, siteOrigin);
    const extension = imageUrl.pathname.toLowerCase().split(".").at(-1);
    const expectedType = extension === "jpg" || extension === "jpeg"
      ? "image/jpeg"
      : extension === "webp"
        ? "image/webp"
        : extension === "png"
          ? "image/png"
          : "";
    if (expectedType && ogImageType !== expectedType) {
      addError(`${relativePath} has Open Graph image type ${ogImageType || "missing"}; expected ${expectedType}.`);
    }
    if (imageUrl.origin === siteOrigin) {
      const imagePath = path.join(distRoot, ...decodeURIComponent(imageUrl.pathname).split("/").filter(Boolean));
      if (!fs.existsSync(imagePath)) addError(`${relativePath} references missing Open Graph image ${imageUrl.pathname}.`);
    }
  }
  if (h1Count !== 1) addError(`${relativePath} has ${h1Count} H1 elements; expected 1.`);
  if (indexable && structuredDataBlocks.length !== 1) {
    addError(`${relativePath} is indexable but has ${structuredDataBlocks.length} JSON-LD blocks; expected 1.`);
  }
  for (const requiredType of ["Organization", "WebSite", "WebPage"]) {
    if (indexable && !structuredDataTypes.has(requiredType)) {
      addError(`${relativePath} is missing ${requiredType} structured data.`);
    }
  }
  for (const forbiddenType of ["Product", "Review", "AggregateRating", "Offer"]) {
    if (structuredDataTypes.has(forbiddenType)) {
      addError(`${relativePath} contains prohibited ${forbiddenType} structured data.`);
    }
  }

  const faqItems = [...html.matchAll(/<div class="faq-item">\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/gi)];
  const faqSchemaNodes = structuredDataNodes.filter((node) => {
    const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
    return types.includes("FAQPage");
  });
  if (indexable && faqItems.length > 0 && faqSchemaNodes.length !== 1) {
    addError(`${relativePath} has visible FAQs but ${faqSchemaNodes.length} FAQPage schema nodes.`);
  }
  if (indexable && faqItems.length === 0 && faqSchemaNodes.length > 0) {
    addError(`${relativePath} has FAQPage schema without visible FAQs.`);
  }
  if (faqSchemaNodes.length === 1) {
    const schemaItems = Array.isArray(faqSchemaNodes[0].mainEntity) ? faqSchemaNodes[0].mainEntity : [];
    if (schemaItems.length !== faqItems.length) {
      addError(`${relativePath} has ${faqItems.length} visible FAQs but ${schemaItems.length} FAQ schema questions.`);
    }
  }

  const articleNodes = structuredDataNodes.filter((node) => {
    const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
    return types.includes("Article");
  });
  for (const article of articleNodes) {
    if (!article.datePublished && !article.dateModified) {
      addError(`${relativePath} has Article schema without datePublished or dateModified.`);
    }
    if (article.reviewedBy) addError(`${relativePath} has an unsupported reviewedBy claim.`);
    if (article.datePublished && article.dateModified && article.datePublished > article.dateModified) {
      addError(`${relativePath} has datePublished after dateModified.`);
    }
    const timeMatch = html.match(/<time\b[^>]*datetime="([^"]+)"[^>]*>([\s\S]*?)<\/time>/i);
    const visibleDate = timeMatch ? plainText(timeMatch[2]) : "";
    const machineDate = timeMatch?.[1] ?? "";
    if (visibleDate.startsWith("Published") && (!article.datePublished || machineDate !== article.datePublished)) {
      addError(`${relativePath} has a Published label that does not match datePublished.`);
    }
    if (visibleDate.startsWith("Updated") && (!article.dateModified || machineDate !== article.dateModified)) {
      addError(`${relativePath} has an Updated label that does not match dateModified.`);
    }
  }

  if (indexable && /^guides\/.+\/index\.html$/.test(relativePath)) {
    for (const requiredType of ["Article", "BreadcrumbList"]) {
      if (!structuredDataTypes.has(requiredType)) {
        addError(`${relativePath} is missing ${requiredType} structured data.`);
      }
    }

    if (faqItems.length !== 3) {
      addError(`${relativePath} has ${faqItems.length} FAQ answers; expected exactly 3.`);
    }
    for (const [, questionHtml, answerHtml] of faqItems) {
      const question = plainText(questionHtml);
      const answer = plainText(answerHtml);
      const answerWordCount = answer.split(/\s+/).filter(Boolean).length;
      if (!question.endsWith("?")) {
        addError(`${relativePath} has an FAQ heading that is not a question: ${question}`);
      }
      if (answerWordCount < 25 || answerWordCount > 100) {
        addError(`${relativePath} FAQ answer has ${answerWordCount} words; expected 25–100: ${question}`);
      }
      const normalizedQuestion = question.toLowerCase();
      const matches = faqQuestions.get(normalizedQuestion) ?? [];
      matches.push(relativePath);
      faqQuestions.set(normalizedQuestion, matches);
    }

    const breadcrumbHtml = html.match(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/i)?.[0] ?? "";
    const breadcrumbItems = breadcrumbHtml.match(/<li>/gi)?.length ?? 0;
    if (breadcrumbItems !== 4 || !/href="\/guides\/"/i.test(breadcrumbHtml)) {
      addError(`${relativePath} must use the four-level Home, Guides, category and current-guide breadcrumb.`);
    }

    const articleStart = html.indexOf('<article class="content narrow">');
    const mainEnd = html.indexOf("</main>", articleStart);
    const articleEnd = html.lastIndexOf("</article>", mainEnd);
    const articleHtml = articleStart >= 0 && articleEnd > articleStart
      ? html.slice(articleStart + '<article class="content narrow">'.length, articleEnd)
      : "";
    const guideNavigationHtml = articleHtml.match(/<nav class="guide-navigation"[\s\S]*?<\/nav>/i)?.[0] ?? "";
    if (!guideNavigationHtml || !/class="guide-navigation-category"/i.test(guideNavigationHtml)) {
      addError(`${relativePath} is missing direct previous/category/next guide navigation.`);
    }

    const relatedHtml = articleHtml.match(/<aside class="related-guides"[\s\S]*?<\/aside>/i)?.[0] ?? "";
    const relatedGuideCount = relatedHtml.match(/<li>/gi)?.length ?? 0;
    if (relatedGuideCount > 3) {
      addError(`${relativePath} shows ${relatedGuideCount} Continue Exploring links; expected no more than 3.`);
    }

    const contextualHtml = articleHtml
      .replace(/<aside class="related-guides"[\s\S]*?<\/aside>/gi, "")
      .replace(/<nav class="guide-navigation"[\s\S]*?<\/nav>/gi, "");
    const contextualInternalLinks = [...contextualHtml.matchAll(/<a\s+[^>]*href="(\/[^"]+)"/gi)]
      .map((match) => match[1]);
    const contextualLinkCounts = new Map();
    for (const href of contextualInternalLinks) {
      contextualLinkCounts.set(href, (contextualLinkCounts.get(href) ?? 0) + 1);
    }
    for (const [href, count] of contextualLinkCounts) {
      if (count > 2) {
        addError(`${relativePath} repeats contextual internal link ${href} ${count} times.`);
      }
    }
  }
  if (indexable && /^categories\/.+\/index\.html$/.test(relativePath) && !structuredDataTypes.has("BreadcrumbList")) {
    addError(`${relativePath} is missing BreadcrumbList structured data.`);
  }
  if (relativePath === "404.html" && indexable) addError("404.html must be noindex.");
  if (/\bNCC\b|National Construction Code/i.test(plainText(html))) {
    addError(`${relativePath} contains a prohibited National Construction Code reference.`);
  }

  for (const match of html.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*>/gi)) {
    const [anchor, href] = match;
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) continue;

    let url;
    try {
      url = new URL(href, canonical || siteOrigin);
    } catch {
      addError(`${relativePath} contains an invalid link: ${href}`);
      continue;
    }

    if (url.origin === siteOrigin) {
      const targetPath = outputPathForUrl(url);
      if (targetPath && !fs.existsSync(targetPath)) {
        addError(`${relativePath} links to missing internal target ${url.pathname}.`);
      }
      internalLinks.push({
        source: canonical,
        sourceIndexable: indexable,
        target: `${url.origin}${url.pathname}`,
      });
    } else if (
      !/target="_blank"/i.test(anchor) ||
      !/rel="[^"]*noopener[^"]*noreferrer[^"]*"/i.test(anchor)
    ) {
      addError(`${relativePath} has an external link without the required target and rel values: ${href}`);
    }
  }

  pages.push({ relativePath, title, description, canonical, pageUrl, indexable });
}

const movedPageUrls = new Set(
  pages.filter((page) => !page.indexable && page.canonical && page.pageUrl !== page.canonical).map((page) => page.pageUrl),
);
for (const link of internalLinks.filter((candidate) => candidate.sourceIndexable)) {
  if (movedPageUrls.has(link.target)) {
    addError(`${link.source} links to moved route ${link.target} instead of its canonical destination.`);
  }
}

const inboundLinks = new Map(
  pages
    .filter((page) => page.indexable && page.canonical && page.canonical !== `${siteOrigin}/`)
    .map((page) => [page.canonical, new Set()]),
);
for (const link of internalLinks.filter((candidate) => candidate.sourceIndexable)) {
  if (link.source && link.source !== link.target && inboundLinks.has(link.target)) {
    inboundLinks.get(link.target).add(link.source);
  }
}
for (const [canonical, sources] of inboundLinks) {
  if (sources.size === 0) addError(`${canonical} is indexable but has no inbound internal link.`);
}

for (const [question, matches] of faqQuestions) {
  if (matches.length > 1) {
    addError(`FAQ question is duplicated across pages "${question}": ${matches.join(", ")}`);
  }
}

for (const field of ["title", "description", "canonical"]) {
  const values = new Map();
  for (const page of pages.filter((candidate) => candidate.indexable)) {
    if (!page[field]) continue;
    const matches = values.get(page[field]) ?? [];
    matches.push(page.relativePath);
    values.set(page[field], matches);
  }
  for (const [value, matches] of values) {
    if (matches.length > 1) {
      addError(`Indexable pages share ${field} "${value}": ${matches.join(", ")}`);
    }
  }
}

if (!fs.existsSync(sitemapPath)) {
  addError("dist/sitemap.xml is missing.");
} else {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const sitemapSet = new Set(sitemapUrls);

  if (sitemapSet.size !== sitemapUrls.length) addError("The sitemap contains duplicate URLs.");

  for (const page of pages.filter((candidate) => candidate.indexable)) {
    if (page.relativePath === "404.html") continue;
    if (page.canonical && !sitemapSet.has(page.canonical)) {
      addError(`${page.relativePath} is indexable but absent from the sitemap.`);
    }
  }

  for (const sitemapUrl of sitemapSet) {
    const outputPath = outputPathForUrl(sitemapUrl);
    if (!outputPath || !fs.existsSync(outputPath)) {
      addError(`The sitemap points to missing output: ${sitemapUrl}`);
      continue;
    }
    const page = pages.find((candidate) => candidate.canonical === sitemapUrl && candidate.indexable);
    if (!page) addError(`The sitemap includes a URL without an indexable self-canonical page: ${sitemapUrl}`);
  }
}

if (errors.length > 0) {
  console.error(`Site output audit failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Site output audit passed: ${htmlFiles.length} pages checked with valid metadata, self-canonicals, Open Graph images, inline-link spacing, links, sitemap coverage, date and FAQ schema, structured-data boundaries and inbound discovery.`);
