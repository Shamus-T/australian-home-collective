import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { decodeHTML } from "entities";
import {
  ELEMENT_NODE,
  TEXT_NODE,
  parse,
  walkSync,
} from "ultrahtml";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const sourceRoot = path.join(root, "src");
const pagefindRoot = path.join(distRoot, "pagefind");
const suggestFixed = process.argv.includes("--suggest-fixed");
const verbose = process.argv.includes("--verbose");
const errors = [];

const pagefindDefaultExclusions = new Set([
  "head",
  "style",
  "script",
  "noscript",
  "label",
  "form",
  "svg",
  "footer",
  "nav",
  "iframe",
  "template",
]);

const proseElements = new Set([
  "p",
  "li",
  "td",
  "th",
  "caption",
  "blockquote",
]);

const stopWords = new Set([
  "a", "about", "after", "again", "against", "all", "also", "am", "an", "and", "any",
  "are", "as", "at", "be", "because", "been", "before", "being", "between", "both", "but",
  "by", "can", "could", "do", "does", "doing", "down", "during", "each", "few", "for",
  "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
  "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself",
  "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off",
  "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own",
  "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs",
  "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to",
  "too", "under", "until", "up", "very", "was", "we", "were", "what", "when", "where",
  "which", "while", "who", "whom", "why", "will", "with", "would", "you", "your", "yours",
  "yourself", "yourselves",
]);

const requiredMetadata = [
  "title",
  "description",
  "category",
  "content_type",
  "image",
  "image_alt",
];

const fixedContracts = [
  {
    route: "/guides/fridge-dimensions-australia/",
    coverage: "Kitchen",
    opening: "old appliance carries those unknowns",
    middle: "star rating measures efficiency relative",
    final: "steps lift dimensions handrails gates",
  },
  {
    route: "/guides/heat-pump-vs-condenser-vs-vented-dryers/",
    coverage: "Laundry",
    opening: "pump condenser and vented dryer",
    middle: "washer avoids splitting every load",
    final: "heat pump model recirculates warm air",
  },
  {
    route: "/guides/bathroom-storage-what-to-measure-and-check-before-you-buy/",
    coverage: "Bathroom",
    opening: "takes more editing than organising",
    middle: "obstruct the cistern flush button",
    final: "blades hot hair tools fragrances",
  },
  {
    route: "/guides/mattress-sizes-australia/",
    coverage: "Bedroom",
    opening: "king are familiar market labels",
    middle: "permits solid platforms slats or adjustable",
    final: "durability evidence and warranty indentation",
  },
  {
    route: "/guides/sofa-and-seating-layout-what-to-measure-before-buying-furniture/",
    coverage: "Living Spaces",
    opening: "chaise fixes the direction of",
    middle: "Apartment bookings body corporate rules",
    final: "Include reclining chaise or pull-out",
  },
  {
    route: "/guides/home-office-desk-setup-what-to-measure-before-you-buy/",
    coverage: "Home Office",
    opening: "docking station speakers microphone graphics",
    middle: "scanner lid rear feed cable",
    final: "join calls simultaneously Two compact",
  },
  {
    route: "/guides/pet-feeding-station-ideas-for-australian-homes/",
    coverage: "Pets",
    opening: "dental swallowing digestive or mobility",
    middle: "Automatic feeders add portion settings",
    final: "animal casually finishing another's meal",
  },
  {
    route: "/guides/nursery-storage-small-rooms/",
    coverage: "Nursery & Kids",
    opening: "Keeping nappies wipes creams and",
    middle: "straps cords and loose loops",
    final: "baby starts rolling crawling pulling",
  },
  {
    route: "/guides/garage-storage-what-to-measure-and-check-before-you-buy/",
    coverage: "Garage Storage",
    opening: "camping gear decorations beach equipment",
    middle: "Bikes scooters ladders prams surfboards",
    final: "bare-wall measurement misses the clearances",
  },
  {
    route: "/guides/outdoor-shade-setup-for-patios-and-backyards-what-to-check-before-buying/",
    coverage: "Outdoor & Garden",
    opening: "Cantilever umbrellas have an offset",
    middle: "under eaves balconies or pergolas",
    final: "including bases poles arms guy",
  },
  {
    route: "/guides/condensation-and-mould-during-winter/",
    coverage: "Winter seasonal",
    opening: "staining softened plasterboard damaged insulation",
    middle: "ducted rangehood correct dryer exhaust",
    final: "cavities or undertake unsafe remediation",
  },
  {
    route: "/guides/australian-made-gift-ideas-under-100/",
    coverage: "Australian-made gift guide",
    opening: "green and gold kangaroo certification",
    middle: "Prices stock and origin details",
    final: "Patriotic packaging",
  },
];

const rankingContracts = [
  ["fridge delivery access", "/guides/fridge-dimensions-australia/"],
  ["condensation mould winter", "/guides/condensation-and-mould-during-winter/"],
  ["induction cookware base", "/guides/cookware-materials-compared/"],
  ["vacuum maximum runtime", "/guides/cordless-stick-vacuums-australia/"],
  ["mattress manufacturer dimensions", "/guides/mattress-sizes-australia/"],
  ["fixed wiring electrician", "/guides/ceiling-fans-before-you-buy/"],
  [
    "outdoor shade patio",
    "/guides/outdoor-shade-setup-for-patios-and-backyards-what-to-check-before-buying/",
  ],
  ["nursery storage", "/guides/nursery-storage-small-rooms/"],
  ["garage clearances", "/guides/garage-shelving-what-to-measure-before-buying-storage-units/"],
  ["pet feeding zone", "/guides/pet-feeding-station-ideas-for-australian-homes/"],
];

function addError(message) {
  errors.push(message);
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
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

function hasAttribute(node, name) {
  return node?.type === ELEMENT_NODE
    && Object.prototype.hasOwnProperty.call(node.attributes, name);
}

function hasClass(node, className) {
  return (node?.attributes?.class ?? "").split(/\s+/).includes(className);
}

function isElement(node, name) {
  return node?.type === ELEMENT_NODE && node.name.toLowerCase() === name;
}

function allElements(node, predicate) {
  const found = [];
  walkSync(node, (candidate) => {
    if (candidate.type === ELEMENT_NODE && predicate(candidate)) found.push(candidate);
  });
  return found;
}

function configuredSelectors() {
  const configPath = path.join(root, "pagefind.yml");
  if (!fs.existsSync(configPath)) {
    addError("pagefind.yml is missing.");
    return [];
  }
  return [...read(configPath).matchAll(/^\s*-\s*"([^"]+)"\s*$/gm)].map((match) => match[1]);
}

const exclusions = configuredSelectors();

function matchesConfiguredSelector(node, selector) {
  if (node?.type !== ELEMENT_NODE) return false;
  if (selector.startsWith(".")) return hasClass(node, selector.slice(1));
  const attributeMatch = selector.match(/^\[([^=\]]+)=['"]([^'"]+)['"]\]$/);
  if (attributeMatch) {
    return node.attributes[attributeMatch[1]] === attributeMatch[2];
  }
  return node.name.toLowerCase() === selector.toLowerCase();
}

function isExcludedElement(node) {
  if (node?.type !== ELEMENT_NODE) return false;
  const tag = node.name.toLowerCase();
  if (pagefindDefaultExclusions.has(tag)) return true;
  if (hasAttribute(node, "data-pagefind-ignore")) return true;
  if (hasAttribute(node, "hidden")) return true;
  if ((node.attributes["aria-hidden"] ?? "").toLowerCase() === "true") return true;
  return exclusions.some((selector) => matchesConfiguredSelector(node, selector));
}

function textFrom(node) {
  const pieces = [];
  function visit(candidate) {
    if (candidate.type === TEXT_NODE) {
      pieces.push(decodeHTML(candidate.value));
      return;
    }
    if (candidate.type !== ELEMENT_NODE && !candidate.children) return;
    if (candidate.type === ELEMENT_NODE && isExcludedElement(candidate)) return;
    for (const child of candidate.children ?? []) visit(child);
    if (
      candidate.type === ELEMENT_NODE
      && !["a", "abbr", "b", "cite", "code", "em", "i", "small", "span", "strong", "sub", "sup"]
        .includes(candidate.name.toLowerCase())
    ) {
      pieces.push(" ");
    }
  }
  visit(node);
  return pieces.join(" ").replace(/\s+/g, " ").trim();
}

function wordTokens(value) {
  return value.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu) ?? [];
}

function normaliseWord(value) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en-AU")
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑‒–—]/g, "-");
}

function normalisedTokens(value) {
  return wordTokens(value).map(normaliseWord);
}

function paddedNormalisedText(value) {
  return ` ${normalisedTokens(value).join(" ")} `;
}

function containsNormalisedPhrase(value, phrase) {
  return paddedNormalisedText(value).includes(` ${normalisedTokens(phrase).join(" ")} `);
}

function proseSegments(article) {
  const segments = [];
  function visit(node, insideProse = false) {
    if (node.type === ELEMENT_NODE && isExcludedElement(node)) return;
    if (node.type !== ELEMENT_NODE && !node.children) return;
    const prose = node.type === ELEMENT_NODE && proseElements.has(node.name.toLowerCase());
    if (prose && !insideProse) {
      const text = textFrom(node);
      if (normalisedTokens(text).length > 0) segments.push(text);
      return;
    }
    for (const child of node.children ?? []) visit(child, insideProse || prose);
  }
  visit(article);
  return segments;
}

function metadataFrom(ast) {
  const metadata = new Map();
  for (const node of allElements(ast, (candidate) => isElement(candidate, "meta"))) {
    const declaration = node.attributes["data-pagefind-meta"];
    const match = declaration?.match(/^([a-z_]+)\[content\]$/i);
    if (match) metadata.set(match[1], decodeHTML(node.attributes.content ?? "").trim());
  }
  return metadata;
}

function nearestConfiguredExclusion(node) {
  let current = node;
  while (current) {
    const match = exclusions.find((selector) => matchesConfiguredSelector(current, selector));
    if (match) return match;
    current = current.parent;
  }
  return "";
}

function hasExcludedAncestor(node) {
  let current = node;
  while (current) {
    if (current.type === ELEMENT_NODE && isExcludedElement(current)) return true;
    current = current.parent;
  }
  return false;
}

function analysePage(route, file, type) {
  const html = read(file);
  const ast = parse(html);
  const bodies = allElements(
    ast,
    (node) => isElement(node, "main") && hasAttribute(node, "data-pagefind-body"),
  );
  if (bodies.length !== 1) {
    addError(`${route} has ${bodies.length} main[data-pagefind-body] elements; expected exactly one.`);
    return null;
  }

  const body = bodies[0];
  const metadata = metadataFrom(ast);
  for (const key of requiredMetadata) {
    if (!metadata.get(key)) addError(`${route} is missing non-empty Pagefind ${key} metadata.`);
  }
  if (metadata.get("content_type") !== type) {
    addError(`${route} Pagefind content_type is "${metadata.get("content_type")}", expected "${type}".`);
  }

  const ignoreNodes = allElements(body, (node) => hasAttribute(node, "data-pagefind-ignore"));
  for (const node of ignoreNodes) {
    const ignoredWords = normalisedTokens(textFrom(node)).length;
    if (ignoredWords > 0) {
      addError(`${route} has ${ignoredWords} words under an unexpected data-pagefind-ignore element.`);
    }
  }

  const searchableText = textFrom(body);
  if (normalisedTokens(searchableText).length === 0) {
    addError(`${route} has an empty intended searchable body.`);
  }

  let article = null;
  let articleText = "";
  let segments = [];
  let faqText = "";
  let headings = [];

  if (type === "Guide") {
    const headers = allElements(body, (node) => isElement(node, "header") && hasClass(node, "article-header"));
    const articles = allElements(body, (node) => isElement(node, "article") && hasClass(node, "content"));
    if (headers.length !== 1) {
      addError(`${route} has ${headers.length} article headers inside the Pagefind body; expected one.`);
    }
    if (articles.length !== 1) {
      addError(`${route} has ${articles.length} article.content elements inside the Pagefind body; expected one.`);
    }
    article = articles[0] ?? null;
    if (article) {
      const articleExclusion = nearestConfiguredExclusion(article);
      if (articleExclusion) {
        addError(`${route} article.content is covered by exclusion selector ${articleExclusion}.`);
      }
      const faq = allElements(article, (node) => hasClass(node, "faq-block"))[0];
      if (faq) {
        const faqExclusion = nearestConfiguredExclusion(faq);
        if (faqExclusion) addError(`${route} FAQ is covered by exclusion selector ${faqExclusion}.`);
        faqText = textFrom(faq);
      }
      segments = proseSegments(article);
      articleText = textFrom(article);
      headings = allElements(
        article,
        (node) => /^h[2-6]$/i.test(node.name) && !hasExcludedAncestor(node),
      ).map(textFrom).filter(Boolean);
      if (normalisedTokens(segments.join(" ")).length < 60) {
        addError(`${route} has too little substantive article prose for three body probes.`);
      }
    }
  } else {
    segments = proseSegments(body);
    if (normalisedTokens(segments.join(" ")).length < 20) {
      addError(`${route} has too little substantive category prose for a body probe.`);
    }
  }

  for (const selector of exclusions) {
    for (const excluded of allElements(body, (node) => matchesConfiguredSelector(node, selector))) {
      if (
        hasClass(excluded, "content")
        || hasClass(excluded, "faq-block")
        || allElements(excluded, (node) => hasClass(node, "content") || hasClass(node, "faq-block")).length
      ) {
        addError(`${route} selector ${selector} removes article.content or FAQ content.`);
      }
    }
  }

  return {
    route,
    file,
    type,
    ast,
    body,
    article,
    articleText,
    metadata,
    searchableText,
    segments,
    faqText,
    headings,
  };
}

function candidateWindows(
  page,
  regionIndex,
  allPages,
  documentFrequency,
  phraseDocumentFrequency,
  metadataPhrases,
) {
  const segmentTokens = page.segments.map((segment) => wordTokens(segment).map((raw) => ({
    raw,
    norm: normaliseWord(raw),
  })));
  const totalWords = segmentTokens.reduce((sum, tokens) => sum + tokens.length, 0);
  const regionStart = Math.floor((totalWords * regionIndex) / 3);
  const regionEnd = regionIndex === 2 ? totalWords : Math.floor((totalWords * (regionIndex + 1)) / 3);
  const regionMidpoint = (regionStart + regionEnd) / 2;
  const candidates = [];
  let offset = 0;

  for (const tokens of segmentTokens) {
    for (let start = 0; start < tokens.length; start += 1) {
      const globalStart = offset + start;
      if (globalStart < regionStart || globalStart >= regionEnd) continue;
      for (const length of [5, 4, 3, 2, 1]) {
        const window = tokens.slice(start, start + length);
        if (window.length !== length) continue;
        const norms = window.map((token) => token.norm);
        if (norms.some((token) => token.length < 2 || /^\d+$/.test(token))) continue;
        const contentWords = norms.filter((token) => !stopWords.has(token));
        if (length > 1 && contentWords.length < 2) continue;
        if (!contentWords.some((token) => token.length >= 6)) continue;
        const phrase = norms.join(" ");
        const rawPhrase = window.map((token) => token.raw).join(" ");
        const documentCount = phraseDocumentFrequency.get(phrase) ?? 0;
        if (documentCount !== 1) continue;
        if (metadataPhrases.has(phrase)) continue;
        const rarity = contentWords.reduce((sum, token) => {
          const frequency = documentFrequency.get(token) ?? allPages.length;
          return sum + Math.log((allPages.length + 1) / (frequency + 1));
        }, 0);
        const distance = Math.abs(globalStart + (length / 2) - regionMidpoint) / Math.max(1, totalWords);
        candidates.push({
          phrase: rawPhrase,
          normalisedPhrase: phrase,
          regionIndex,
          score: (length * 8) + (rarity * 3) - distance,
        });
      }
    }
    offset += tokens.length;
  }

  return candidates
    .sort((a, b) => b.score - a.score || a.normalisedPhrase.localeCompare(b.normalisedPhrase))
    .slice(0, 40);
}

function buildDocumentFrequency(pages) {
  const frequency = new Map();
  for (const page of pages) {
    for (const token of new Set(normalisedTokens(page.searchableText))) {
      frequency.set(token, (frequency.get(token) ?? 0) + 1);
    }
  }
  return frequency;
}

function buildPhraseFrequency(pages) {
  const phraseDocumentFrequency = new Map();
  const metadataPhrases = new Set();

  for (const page of pages) {
    const seen = new Set();
    const tokens = normalisedTokens(page.searchableText);
    for (let start = 0; start < tokens.length; start += 1) {
      for (let length = 1; length <= 5 && start + length <= tokens.length; length += 1) {
        seen.add(tokens.slice(start, start + length).join(" "));
      }
    }
    for (const phrase of seen) {
      phraseDocumentFrequency.set(phrase, (phraseDocumentFrequency.get(phrase) ?? 0) + 1);
    }

    const metadataTokens = normalisedTokens([...page.metadata.values()].join(" "));
    for (let start = 0; start < metadataTokens.length; start += 1) {
      for (let length = 1; length <= 5 && start + length <= metadataTokens.length; length += 1) {
        metadataPhrases.add(metadataTokens.slice(start, start + length).join(" "));
      }
    }
  }

  return { phraseDocumentFrequency, metadataPhrases };
}

function staticServer() {
  const mimeTypes = new Map([
    [".css", "text/css; charset=utf-8"],
    [".html", "text/html; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".pf_filter", "application/octet-stream"],
    [".pf_fragment", "application/octet-stream"],
    [".pf_index", "application/octet-stream"],
    [".wasm", "application/wasm"],
  ]);

  const server = http.createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
      const relative = pathname.replace(/^\/+/, "");
      let file = path.resolve(distRoot, relative);
      if (!file.startsWith(`${path.resolve(distRoot)}${path.sep}`) && file !== path.resolve(distRoot)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.setHeader("Content-Type", mimeTypes.get(path.extname(file)) ?? "application/octet-stream");
      response.setHeader("Cache-Control", "no-store");
      response.writeHead(200);
      fs.createReadStream(file).pipe(response);
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

function resultRoute(data) {
  const raw = data.raw_url ?? data.url ?? "";
  const pathname = new URL(raw, "https://australianhomecollective.com.au").pathname;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function indexedText(data) {
  return decodeHTML(String(data.raw_content ?? data.content ?? "").replace(/<[^>]+>/g, " "));
}

async function loadExpectedResult(pagefind, query, expectedRoute) {
  const search = await pagefind.search(query);
  for (const result of search.results) {
    const data = await result.data();
    if (resultRoute(data) === expectedRoute) return { search, result, data };
  }
  return { search, result: null, data: null };
}

async function verifyProbe(pagefind, page, probe, label) {
  const query = `"${normalisedTokens(probe).join(" ")}"`;
  const loaded = await loadExpectedResult(pagefind, query, page.route);
  if (!loaded.data) {
    return {
      ok: false,
      reason: `expected route was absent from ${loaded.search.results.length} results`,
    };
  }
  if (!containsNormalisedPhrase(indexedText(loaded.data), probe)) {
    return {
      ok: false,
      reason: "expected route loaded, but its indexed content did not contain the probe",
    };
  }
  const pageMetadata = [...page.metadata.values()].join(" ");
  if (containsNormalisedPhrase(pageMetadata, probe)) {
    return {
      ok: false,
      reason: "probe also occurs in the expected page metadata",
    };
  }
  if (verbose) {
    console.log(`  ${page.route} [${label}] "${probe}"`);
  }
  return { ok: true, loaded, query };
}

function coverageStats(page, data) {
  const expectedWords = normalisedTokens(page.searchableText);
  const actualText = indexedText(data);
  const actualWords = normalisedTokens(actualText);
  const actualPadded = ` ${actualWords.join(" ")} `;
  const checkpoints = [];

  for (const segment of page.segments) {
    const tokens = normalisedTokens(segment);
    if (tokens.length < 4) continue;
    const length = Math.min(8, tokens.length);
    const starts = new Set([
      0,
      Math.max(0, Math.floor((tokens.length - length) / 2)),
      Math.max(0, tokens.length - length),
    ]);
    for (const start of starts) {
      checkpoints.push(tokens.slice(start, start + length).join(" "));
    }
  }

  const missingCheckpoints = checkpoints.filter(
    (checkpoint) => !actualPadded.includes(` ${checkpoint} `),
  );
  const headingChecks = page.headings.map((heading) => ({
    heading,
    present: containsNormalisedPhrase(actualText, heading),
  }));
  const faqWords = normalisedTokens(page.faqText);
  const faqProbe = faqWords.slice(0, Math.min(8, faqWords.length)).join(" ");

  return {
    expectedWords: expectedWords.length,
    indexedWords: actualWords.length,
    ratio: expectedWords.length ? actualWords.length / expectedWords.length : 0,
    checkpointCount: checkpoints.length,
    missingCheckpoints,
    missingHeadings: headingChecks.filter((check) => !check.present).map((check) => check.heading),
    faqWords: faqWords.length,
    faqIndexed: faqWords.length === 0 || actualPadded.includes(` ${faqProbe} `),
  };
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

if (!fs.existsSync(distRoot) || !fs.existsSync(path.join(pagefindRoot, "pagefind.js"))) {
  console.error("Pagefind content audit requires a completed dist build and dist/pagefind bundle.");
  process.exit(1);
}

const activeGuideSources = walkFiles(path.join(sourceRoot, "pages", "guides"))
  .filter((file) => file.endsWith("index.astro"))
  .filter((file) => /<ArticleLayout\b/.test(read(file)));
const categorySources = walkFiles(path.join(sourceRoot, "pages", "categories"))
  .filter((file) => file.endsWith("index.astro"))
  .filter((file) => /<(?:SimpleCategoryPage|CategoryHubLayout)\b/.test(read(file)));
const guideRoutes = new Set(activeGuideSources.map(routeForSource));
const categoryRoutes = new Set(categorySources.map(routeForSource));

const htmlFiles = walkFiles(distRoot).filter((file) => file.endsWith(".html"));
const outputFiles = new Map(htmlFiles.map((file) => [routeForOutput(file), file]));
const guidePages = [...guideRoutes]
  .sort()
  .map((route) => outputFiles.has(route) ? analysePage(route, outputFiles.get(route), "Guide") : null)
  .filter(Boolean);
const categoryPages = [...categoryRoutes]
  .sort()
  .map((route) => outputFiles.has(route) ? analysePage(route, outputFiles.get(route), "Category") : null)
  .filter(Boolean);

for (const route of guideRoutes) {
  if (!outputFiles.has(route)) addError(`${route} is missing generated HTML.`);
}
for (const route of categoryRoutes) {
  if (!outputFiles.has(route)) addError(`${route} is missing generated HTML.`);
}

const allPages = [...guidePages, ...categoryPages];
const documentFrequency = buildDocumentFrequency(allPages);
const { phraseDocumentFrequency, metadataPhrases } = buildPhraseFrequency(allPages);
const guideOccurrences = guidePages.reduce(
  (sum, page) => sum + normalisedTokens(page.searchableText).length,
  0,
);
const guideArticleOccurrences = guidePages.reduce(
  (sum, page) => sum + normalisedTokens(page.articleText).length,
  0,
);
const categoryOccurrences = categoryPages.reduce(
  (sum, page) => sum + normalisedTokens(page.searchableText).length,
  0,
);
const distinctVocabulary = new Set(
  allPages.flatMap((page) => normalisedTokens(page.searchableText)),
).size;

console.log(
  `Independent intended-content count: ${guideOccurrences.toLocaleString("en-AU")} guide searchable-main `
  + `word occurrences (${guideArticleOccurrences.toLocaleString("en-AU")} inside article elements)`
  + ` + ${categoryOccurrences.toLocaleString("en-AU")} category word occurrences`
  + ` = ${(guideOccurrences + categoryOccurrences).toLocaleString("en-AU")} combined;`
  + ` ${distinctVocabulary.toLocaleString("en-AU")} distinct case-folded, diacritic-normalised tokens.`,
);

const automaticCandidates = new Map();
for (const page of guidePages) {
  automaticCandidates.set(
    page.route,
    [0, 1, 2].map((region) => candidateWindows(
      page,
      region,
      allPages,
      documentFrequency,
      phraseDocumentFrequency,
      metadataPhrases,
    )),
  );
  for (const [region, candidates] of automaticCandidates.get(page.route).entries()) {
    if (candidates.length === 0) {
      addError(`${page.route} has no reliable automatic probe candidate in region ${region + 1}.`);
    }
  }
}
for (const page of categoryPages) {
  automaticCandidates.set(page.route, [
    candidateWindows(
      page,
      1,
      allPages,
      documentFrequency,
      phraseDocumentFrequency,
      metadataPhrases,
    ),
  ]);
  if (automaticCandidates.get(page.route)[0].length === 0) {
    addError(`${page.route} has no reliable automatic category prose probe candidate.`);
  }
}

if (suggestFixed) {
  for (const contract of fixedContracts) {
    const candidates = automaticCandidates.get(contract.route);
    console.log(`\n${contract.coverage} — ${contract.route}`);
    for (const [region, label] of ["opening", "middle", "final"].entries()) {
      console.log(`  ${label}: ${candidates?.[region]?.slice(0, 5).map((candidate) => `"${candidate.phrase}"`).join(" | ") || "none"}`);
    }
  }
  process.exit(errors.length ? 1 : 0);
}

let server;
let pagefind;
const selectedAutomaticProbes = [];
const fixedProbeResults = [];
const pageData = new Map();
const coverageResults = new Map();
const rankingResults = [];

try {
  const hosted = await staticServer();
  server = hosted.server;
  const moduleUrl = `${pathToFileURL(path.join(pagefindRoot, "pagefind.js")).href}?audit=${Date.now()}`;
  const pagefindModule = await import(moduleUrl);
  pagefind = pagefindModule.createInstance({
    basePath: `${hosted.baseUrl}/pagefind/`,
    language: "en-au",
    noWorker: true,
  });
  await pagefind.init();

  for (const page of guidePages) {
    const regions = automaticCandidates.get(page.route) ?? [];
    for (const [regionIndex, candidates] of regions.entries()) {
      let accepted = null;
      const diagnostics = [];
      for (const candidate of candidates) {
        const result = await verifyProbe(
          pagefind,
          page,
          candidate.phrase,
          ["opening", "middle", "final"][regionIndex],
        );
        if (result.ok) {
          accepted = { ...candidate, result };
          break;
        }
        diagnostics.push(`"${candidate.phrase}": ${result.reason}`);
      }
      if (!accepted) {
        addError(
          `${page.route} ${["opening", "middle", "final"][regionIndex]} probe failed: `
          + (diagnostics.slice(0, 5).join("; ") || "no candidates"),
        );
      } else {
        selectedAutomaticProbes.push({
          route: page.route,
          region: ["opening", "middle", "final"][regionIndex],
          phrase: accepted.phrase,
        });
        if (!pageData.has(page.route)) pageData.set(page.route, accepted.result.loaded.data);
      }
    }
  }

  for (const page of categoryPages) {
    const candidates = automaticCandidates.get(page.route)?.[0] ?? [];
    let accepted = null;
    const diagnostics = [];
    for (const candidate of candidates) {
      const result = await verifyProbe(pagefind, page, candidate.phrase, "category prose");
      if (result.ok) {
        accepted = { ...candidate, result };
        break;
      }
      diagnostics.push(`"${candidate.phrase}": ${result.reason}`);
    }
    if (!accepted) {
      addError(`${page.route} category probe failed: ${diagnostics.slice(0, 5).join("; ") || "no candidates"}`);
    } else {
      selectedAutomaticProbes.push({
        route: page.route,
        region: "category",
        phrase: accepted.phrase,
      });
      if (!pageData.has(page.route)) pageData.set(page.route, accepted.result.loaded.data);
    }
  }

  for (const contract of fixedContracts) {
    const page = guidePages.find((candidate) => candidate.route === contract.route);
    if (!page) {
      addError(`Fixed contract route is not an active guide: ${contract.route}`);
      continue;
    }
    for (const region of ["opening", "middle", "final"]) {
      const phrase = contract[region];
      if (!phrase) {
        addError(`Fixed contract ${contract.route} is missing its ${region} phrase.`);
        continue;
      }
      const result = await verifyProbe(pagefind, page, phrase, `fixed ${region}`);
      if (!result.ok) {
        addError(`Fixed contract ${contract.route} ${region} phrase "${phrase}" failed: ${result.reason}.`);
      } else {
        for (const key of ["title", "description", "image", "image_alt", "content_type", "category"]) {
          if ((result.loaded.data.meta?.[key] ?? "") !== (page.metadata.get(key) ?? "")) {
            addError(
              `Fixed contract ${contract.route} returned incorrect ${key} metadata for "${phrase}".`,
            );
          }
        }
        fixedProbeResults.push({ route: contract.route, region, phrase });
        if (!pageData.has(page.route)) pageData.set(page.route, result.loaded.data);
      }
    }
  }

  for (const page of allPages) {
    const data = pageData.get(page.route);
    if (!data) {
      addError(`${page.route} has no loadable result data for indexed-content comparison.`);
      continue;
    }
    const coverage = coverageStats(page, data);
    coverageResults.set(page.route, coverage);
    const checkpointCoverage = coverage.checkpointCount
      ? 1 - (coverage.missingCheckpoints.length / coverage.checkpointCount)
      : 0;
    if (coverage.ratio < 0.9 || coverage.ratio > 1.15) {
      addError(
        `${page.route} indexed/expected word ratio is ${coverage.ratio.toFixed(3)}`
        + ` (${coverage.indexedWords}/${coverage.expectedWords}).`,
      );
    }
    if (checkpointCoverage < 0.95) {
      addError(
        `${page.route} has ${coverage.missingCheckpoints.length}/${coverage.checkpointCount}`
        + ` missing intended-content checkpoints: ${coverage.missingCheckpoints.slice(0, 3).join(" | ")}`,
      );
    }
    if (coverage.missingHeadings.length > 0) {
      addError(`${page.route} is missing indexed headings: ${coverage.missingHeadings.join(" | ")}`);
    }
    if (!coverage.faqIndexed) addError(`${page.route} FAQ content is missing from the index.`);
  }

  for (const [query, expectedRoute] of rankingContracts) {
    const search = await pagefind.search(query);
    const loaded = [];
    for (const result of search.results.slice(0, 10)) {
      const data = await result.data();
      loaded.push({
        route: resultRoute(data),
        title: data.meta?.title ?? "",
        excerpt: data.plain_excerpt ?? decodeHTML(String(data.excerpt ?? "").replace(/<[^>]+>/g, " ")),
        contentType: data.meta?.content_type ?? "",
      });
    }
    const expectedRank = loaded.findIndex((result) => result.route === expectedRoute) + 1;
    if (expectedRank === 0 || expectedRank > 5) {
      addError(`Ranking query "${query}" did not return ${expectedRoute} in the top five.`);
    }
    const expectedResult = expectedRank > 0 ? loaded[expectedRank - 1] : null;
    const excerptTerms = new Set(normalisedTokens(expectedResult?.excerpt ?? ""));
    const relevantExcerptTerms = normalisedTokens(query)
      .filter((term) => !stopWords.has(term))
      .filter((term) => excerptTerms.has(term));
    if (!expectedResult?.excerpt || relevantExcerptTerms.length === 0) {
      addError(`Ranking query "${query}" did not produce a relevant excerpt for ${expectedRoute}.`);
    }
    const topCategories = loaded.slice(0, 5).filter((result) => result.contentType === "Category").length;
    if (topCategories >= 3) {
      addError(`Ranking query "${query}" is dominated by category pages (${topCategories}/5).`);
    }
    rankingResults.push({ query, expectedRoute, expectedRank, results: loaded.slice(0, 5) });
  }
} catch (error) {
  addError(`Could not query the generated Pagefind JavaScript bundle: ${error.stack ?? error}`);
} finally {
  if (pagefind) await pagefind.destroy();
  if (server) await closeServer(server);
}

for (const contract of fixedContracts) {
  const page = guidePages.find((candidate) => candidate.route === contract.route);
  const coverage = coverageResults.get(contract.route);
  if (!page || !coverage) continue;
  console.log(
    `Deep comparison (${contract.coverage}): ${contract.route} `
    + `${coverage.expectedWords} intended / ${coverage.indexedWords} indexed words; `
    + `${coverage.missingCheckpoints.length}/${coverage.checkpointCount} non-contiguous checkpoints; `
    + `FAQ ${coverage.faqWords ? (coverage.faqIndexed ? "indexed" : "missing") : "not present"}.`,
  );
}

for (const ranking of rankingResults) {
  console.log(
    `Ranking "${ranking.query}": expected guide rank ${ranking.expectedRank || "not found"}; `
    + `top results ${ranking.results.map((result) => `${result.route} [${result.contentType}]`).join(", ")}; `
    + `excerpt "${ranking.results[ranking.expectedRank - 1]?.excerpt ?? ""}".`,
  );
}

if (errors.length > 0) {
  console.error("Pagefind full-body content audit failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const guideAutomaticCount = selectedAutomaticProbes.filter((probe) => probe.region !== "category").length;
const categoryAutomaticCount = selectedAutomaticProbes.filter((probe) => probe.region === "category").length;
console.log(
  `Pagefind full-body content audit passed: ${guidePages.length} guides and ${categoryPages.length} categories; `
  + `${guideAutomaticCount} automatic guide probes (${guidePages.length} opening, ${guidePages.length} middle, `
  + `${guidePages.length} final), ${categoryAutomaticCount} category probes and ${fixedProbeResults.length} fixed `
  + "deep-phrase contracts all returned the correct route from the generated JavaScript index with loadable, "
  + "body-matching result data. Intended/indexed content coverage, FAQ inclusion and ranking contracts also passed.",
);
