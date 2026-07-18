import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const sitemapPath = path.join(distRoot, "sitemap.xml");
const siteOrigin = "https://australianhomecollective.com.au";
const errors = [];

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

function outputPathForUrl(urlValue) {
  const url = new URL(urlValue, siteOrigin);
  if (url.origin !== siteOrigin) return null;
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) {
    return path.join(distRoot, ...pathname.split("/").filter(Boolean), "index.html");
  }
  return path.join(distRoot, ...pathname.split("/").filter(Boolean));
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
  const title = firstMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const description = firstMatch(html, /<meta name="description" content="([^"]*)"/i);
  const canonical = firstMatch(html, /<link rel="canonical" href="([^"]*)"/i);
  const robots = firstMatch(html, /<meta name="robots" content="([^"]*)"/i);
  const h1Count = html.match(/<h1(?:\s[^>]*)?>/gi)?.length ?? 0;
  const indexable = !robots.toLowerCase().includes("noindex");
  const structuredDataBlocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const structuredDataTypes = new Set();

  for (const [, value] of structuredDataBlocks) {
    try {
      const data = JSON.parse(value);
      const nodes = Array.isArray(data?.["@graph"]) ? data["@graph"] : [data];
      for (const node of nodes) {
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
  if (description.length > 160) {
    addError(`${relativePath} has a meta description longer than 160 characters (${description.length}).`);
  }
  if (!canonical) addError(`${relativePath} has no canonical URL.`);
  if (h1Count !== 1) addError(`${relativePath} has ${h1Count} H1 elements; expected 1.`);
  if (indexable && structuredDataBlocks.length === 0) {
    addError(`${relativePath} is indexable but has no JSON-LD.`);
  }
  for (const requiredType of ["Organization", "WebSite", "WebPage"]) {
    if (indexable && !structuredDataTypes.has(requiredType)) {
      addError(`${relativePath} is missing ${requiredType} structured data.`);
    }
  }
  if (indexable && /^guides\/.+\/index\.html$/.test(relativePath)) {
    for (const requiredType of ["Article", "BreadcrumbList"]) {
      if (!structuredDataTypes.has(requiredType)) {
        addError(`${relativePath} is missing ${requiredType} structured data.`);
      }
    }
  }
  if (indexable && /^categories\/.+\/index\.html$/.test(relativePath) && !structuredDataTypes.has("BreadcrumbList")) {
    addError(`${relativePath} is missing BreadcrumbList structured data.`);
  }
  if (relativePath === "404.html" && indexable) addError("404.html must be noindex.");

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
    } else if (
      !/target="_blank"/i.test(anchor) ||
      !/rel="[^"]*noopener[^"]*noreferrer[^"]*"/i.test(anchor)
    ) {
      addError(`${relativePath} has an external link without the required target and rel values: ${href}`);
    }
  }

  pages.push({ relativePath, title, description, canonical, indexable });
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

console.log(`Site output audit passed: ${htmlFiles.length} pages checked with unique indexable metadata, valid canonicals, internal links and sitemap coverage.`);
