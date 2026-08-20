import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const sourceRoot = path.join(root, "src");
const pagefindRoot = path.join(distRoot, "pagefind");
const errors = [];

function addError(message) {
  errors.push(message);
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function routeForSource(file) {
  const relative = path.relative(path.join(sourceRoot, "pages"), file).replaceAll(path.sep, "/");
  const withoutIndex = relative.replace(/(?:^|\/)index\.astro$/i, "");
  const route = `/${withoutIndex}`.replace(/\/+/g, "/");
  return route.endsWith("/") ? route : `${route}/`;
}

function routeForOutput(file) {
  const relative = path.relative(distRoot, file).replaceAll(path.sep, "/");
  if (relative === "index.html") return "/";
  if (relative === "404.html") return "/404.html";
  return `/${relative.replace(/index\.html$/i, "")}`;
}

function getAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return tag.match(new RegExp(`\\b${escaped}=(?:\"([^\"]*)\"|'([^']*)')`, "i"))?.slice(1).find(
    (value) => value !== undefined,
  ) ?? "";
}

function findTag(html, tagName, predicate) {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
  return tags.find(predicate) ?? "";
}

function pagefindMetadata(html) {
  const metadata = new Map();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const declaration = getAttribute(tag, "data-pagefind-meta");
    const match = declaration.match(/^([a-z_]+)\[content\]$/i);
    if (match) metadata.set(match[1], getAttribute(tag, "content").trim());
  }
  return metadata;
}

function hasPagefindBody(html) {
  return /<main\b[^>]*\bdata-pagefind-body(?:\s|=|>)/i.test(html);
}

function hasNoindex(html) {
  const robotsTag = findTag(
    html,
    "meta",
    (tag) => getAttribute(tag, "name").toLowerCase() === "robots",
  );
  return getAttribute(robotsTag, "content").toLowerCase().includes("noindex");
}

if (!fs.existsSync(distRoot)) {
  console.error("Pagefind output audit requires a completed dist build.");
  process.exit(1);
}

const requiredPagefindAssets = [
  "pagefind-component-ui.css",
  "pagefind-component-ui.js",
  "pagefind.js",
];
for (const asset of requiredPagefindAssets) {
  if (!fs.existsSync(path.join(pagefindRoot, asset))) {
    addError(`dist/pagefind/${asset} is missing.`);
  }
}

const activeGuideSources = walk(path.join(sourceRoot, "pages", "guides"))
  .filter((file) => file.endsWith("index.astro"))
  .filter((file) => /<ArticleLayout\b/.test(read(file)));
const categorySources = walk(path.join(sourceRoot, "pages", "categories"))
  .filter((file) => file.endsWith("index.astro"))
  .filter((file) => /<(?:SimpleCategoryPage|CategoryHubLayout)\b/.test(read(file)));
const expectedRoutes = new Set(
  [...activeGuideSources, ...categorySources].map(routeForSource),
);

const htmlFiles = walk(distRoot).filter((file) => file.endsWith(".html"));
const pages = new Map(
  htmlFiles.map((file) => [routeForOutput(file), { file, html: read(file) }]),
);
const optedInRoutes = new Set(
  [...pages].filter(([, page]) => hasPagefindBody(page.html)).map(([route]) => route),
);

for (const route of expectedRoutes) {
  if (!pages.has(route)) {
    addError(`${route} is an expected search route but its built HTML is missing.`);
    continue;
  }
  if (!optedInRoutes.has(route)) {
    addError(`${route} is an expected active guide or category without data-pagefind-body.`);
  }
}

for (const route of optedInRoutes) {
  if (!expectedRoutes.has(route)) {
    addError(`${route} is outside the approved search scope but has data-pagefind-body.`);
  }
}

for (const [route, page] of pages) {
  if (hasNoindex(page.html) && hasPagefindBody(page.html)) {
    addError(`${route} is noindex but has data-pagefind-body.`);
  }
}

for (const route of expectedRoutes) {
  const page = pages.get(route);
  if (!page) continue;

  const metadata = pagefindMetadata(page.html);
  for (const key of ["title", "description", "category", "content_type", "image", "image_alt"]) {
    if (!metadata.get(key)) {
      addError(`${route} is missing non-empty Pagefind ${key} metadata.`);
    }
  }

  const image = metadata.get("image");
  if (image) {
    if (!image.startsWith("/images/")) {
      addError(`${route} has invalid Pagefind image URL "${image}".`);
    } else {
      const imageFile = path.join(distRoot, ...decodeURIComponent(image.slice(1)).split("/"));
      if (!fs.existsSync(imageFile)) {
        addError(`${route} Pagefind image asset does not exist: "${image}".`);
      }
    }
  }

  const expectedType = route.startsWith("/guides/") ? "Guide" : "Category";
  if (metadata.get("content_type") && metadata.get("content_type") !== expectedType) {
    addError(`${route} has Pagefind content_type ${metadata.get("content_type")}, expected ${expectedType}.`);
  }

  if (hasNoindex(page.html)) {
    addError(`${route} is in the approved index route set but is noindex.`);
  }
}

const searchPage = pages.get("/search/");
if (!searchPage) {
  addError("dist/search/index.html is missing.");
} else {
  const html = searchPage.html;
  const canonicalTag = findTag(html, "link", (tag) => getAttribute(tag, "rel") === "canonical");
  const robotsTag = findTag(html, "meta", (tag) => getAttribute(tag, "name") === "robots");
  const expectedFragments = [
    '<link rel="stylesheet" href="/pagefind/pagefind-component-ui.css">',
    'src="/pagefind/pagefind-component-ui.js"',
    'type="module"',
    '<pagefind-config bundle-path="/pagefind/">',
    "<pagefind-input",
    'debounce="300"',
    "<pagefind-summary",
    "<pagefind-keyboard-hints",
    "<pagefind-results",
    "hide-sub-results",
    'type="text/pagefind-template"',
    "| safeUrl",
    'class="pf-result-image search-result-image"',
    'width="900"',
    'height="620"',
    'loading="lazy"',
    "{{ meta.description }}",
    "<noscript>",
    'href="/guides/"',
    'href="/categories/"',
    'href="/contact/"',
    "Suggested searches",
    "Search is temporarily unavailable",
  ];

  if (getAttribute(canonicalTag, "href") !== "https://australianhomecollective.com.au/search/") {
    addError("/search/ does not have the exact clean self-canonical.");
  }
  if (getAttribute(robotsTag, "content").toLowerCase() !== "noindex,follow") {
    addError("/search/ robots must be exactly noindex,follow.");
  }
  if (!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) {
    addError("/search/ is missing an H1.");
  }
  if (hasPagefindBody(html)) {
    addError("/search/ must not have data-pagefind-body.");
  }
  for (const fragment of expectedFragments) {
    if (!html.includes(fragment)) {
      addError(`/search/ is missing required contract fragment: ${fragment}`);
    }
  }
  if (html.includes("Popular planning tasks")) {
    addError('/search/ contains the unsupported heading "Popular planning tasks".');
  }
}

const sitemapPath = path.join(distRoot, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) {
  addError("dist/sitemap.xml is missing.");
} else if (/https:\/\/australianhomecollective\.com\.au\/search\//i.test(read(sitemapPath))) {
  addError("/search/ must not appear in the sitemap.");
}

const pagefindConfigPath = path.join(root, "pagefind.yml");
const pagefindConfig = fs.existsSync(pagefindConfigPath) ? read(pagefindConfigPath) : "";
const selectorContracts = new Map([
  [".breadcrumbs", /class="[^"]*\bbreadcrumbs\b[^"]*"/i],
  [".article-meta", /class="[^"]*\barticle-meta\b[^"]*"/i],
  [".related-guides", /class="[^"]*\brelated-guides\b[^"]*"/i],
  [".guide-navigation", /class="[^"]*\bguide-navigation\b[^"]*"/i],
  ["[data-category-section='guide-collection']", /data-category-section="guide-collection"/i],
  ["[data-category-section='nearby-categories']", /data-category-section="nearby-categories"/i],
]);
const indexedHtml = [...expectedRoutes]
  .map((route) => pages.get(route)?.html ?? "")
  .join("\n");

if (!/^site:\s*dist\s*$/m.test(pagefindConfig)) {
  addError("pagefind.yml must set site: dist.");
}
if (!/^output_subdir:\s*pagefind\s*$/m.test(pagefindConfig)) {
  addError("pagefind.yml must keep output_subdir under pagefind.");
}
for (const [selector, renderedPattern] of selectorContracts) {
  if (!pagefindConfig.includes(`- "${selector}"`)) {
    addError(`pagefind.yml is missing approved exclusion selector ${selector}.`);
  }
  if (!renderedPattern.test(indexedHtml)) {
    addError(`Pagefind exclusion selector ${selector} has no rendered match in opted-in pages.`);
  }
}

const sourceFiles = walk(sourceRoot).filter((file) => /\.(?:astro|js|mjs|ts|tsx|jsx)$/.test(file));
for (const file of sourceFiles) {
  if (file.endsWith(path.join("pages", "search", "index.astro"))) continue;
  if (read(file).includes("/pagefind/")) {
    addError(`${path.relative(root, file)} references Pagefind assets outside /search/.`);
  }
}

const searchSourcePath = path.join(sourceRoot, "pages", "search", "index.astro");
const searchSource = fs.existsSync(searchSourcePath) ? read(searchSourcePath) : "";
const prohibitedSearchPatterns = new Map([
  ["a form", /<form\b/i],
  ["an unapproved analytics integration", /\b(?:dataLayer|gtag|googletagmanager|google-analytics|connect\.facebook\.net)\b/i],
  ["persistent browser storage", /\b(?:localStorage|document\.cookie|indexedDB)\b/i],
  ["URL or history query persistence", /\b(?:URLSearchParams|location\.search|history\.(?:pushState|replaceState))\b/i],
  ["shadow DOM access", /\.shadowRoot\b/i],
  ["unrestricted HTML rendering", /\b(?:set:html|innerHTML)\b/i],
]);
for (const [description, pattern] of prohibitedSearchPatterns) {
  if (pattern.test(searchSource)) {
    addError(`/search/ source introduces ${description}.`);
  }
}

const analyticsContracts = [
  'const analyticsEndpoint = "/api/search-analytics";',
  'const analyticsSessionKey = "ahc-search-session";',
  "sessionStorage.getItem(analyticsSessionKey)",
  "sessionStorage.setItem(analyticsSessionKey, created)",
  "crypto.randomUUID()",
  "navigator.sendBeacon(",
  "fetch(analyticsEndpoint, {",
  'credentials: "same-origin"',
  "keepalive: true",
  "}).catch(() => {});",
  'originPath: "/search/"',
  "if (query.length < minimumQueryLength) return;",
];
for (const fragment of analyticsContracts) {
  if (!searchSource.includes(fragment)) {
    addError(`/search/ is missing approved anonymous analytics contract fragment: ${fragment}`);
  }
}
const fetchTargets = [...searchSource.matchAll(
  /\bfetch\s*\(\s*([A-Za-z_$][\w$]*|["'`][^"'`]+["'`])/gi,
)].map((match) => match[1]);
if (fetchTargets.some((target) => target !== "analyticsEndpoint")) {
  addError("/search/ makes a fetch call outside the approved analytics endpoint.");
}
const beaconTargets = [...searchSource.matchAll(
  /\bsendBeacon\s*\(\s*([A-Za-z_$][\w$]*|["'`][^"'`]+["'`])/gi,
)].map((match) => match[1]);
if (beaconTargets.some((target) => target !== "analyticsEndpoint")) {
  addError("/search/ sends a beacon outside the approved analytics endpoint.");
}

const functionsFiles = walk(path.join(root, "functions"))
  .filter((file) => /\.(?:js|mjs|cjs)$/.test(file))
  .map((file) => path.relative(root, file).replaceAll(path.sep, "/"))
  .sort();
const approvedFunctionsFiles = [
  "functions/api/affiliate-click.js",
  "functions/api/contact.js",
  "functions/api/search-analytics.js",
];
if (JSON.stringify(functionsFiles) !== JSON.stringify(approvedFunctionsFiles)) {
  addError(`Pages Functions changed from the approved route files: ${functionsFiles.join(", ") || "none"}.`);
}

const routesPath = path.join(root, "public", "_routes.json");
try {
  const routes = JSON.parse(read(routesPath));
  if (
    routes.version !== 1
    || JSON.stringify(routes.include) !== JSON.stringify(["/api/contact", "/api/search-analytics", "/api/affiliate-click"])
    || JSON.stringify(routes.exclude) !== JSON.stringify([])
  ) {
    addError("public/_routes.json must retain only the approved contact, search-analytics and affiliate-click Function includes.");
  }
} catch {
  addError("public/_routes.json is missing or invalid JSON.");
}

const headers = read(path.join(root, "public", "_headers"));
const csp = headers.match(/Content-Security-Policy:\s*([^\r\n]+)/i)?.[1] ?? "";
if (!/script-src[^;]*'wasm-unsafe-eval'/i.test(csp)) {
  addError("CSP script-src is missing 'wasm-unsafe-eval'.");
}
if (/(?:^|\s)'unsafe-eval'(?:\s|;|$)/i.test(csp)) {
  addError("CSP must not allow 'unsafe-eval'.");
}
if (!/worker-src\s+'self'\s+blob:\s*;/i.test(csp)) {
  addError("CSP is missing worker-src 'self' blob:.");
}

for (const [route, page] of pages) {
  if (!page.html.includes('href="/styles/global.css?v=12"')) {
    addError(`${route} does not reference global.css?v=12.`);
  }
  if (!page.html.includes('<a href="/search/">Search</a>')) {
    addError(`${route} does not expose the shared Search navigation link.`);
  }
}

if (errors.length > 0) {
  console.error("Pagefind output audit failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Pagefind output audit passed: ${expectedRoutes.size} opted-in pages `
  + `(${activeGuideSources.length} guides and ${categorySources.length} categories), `
  + "same-origin search assets and anonymous analytics, metadata, exclusions, navigation, CSP and privacy boundaries verified.",
);
