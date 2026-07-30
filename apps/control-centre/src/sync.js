import {
  beginIntegrationRun,
  finishIntegrationRun,
  purgeExpiredData,
  replaceCloudflareHourly,
  replaceCloudflarePaths,
  replaceGa4Daily,
  replaceGa4LandingPages,
  replaceSearchConsoleDaily,
  replaceSearchConsolePages,
  replaceSearchConsoleQueries,
  replaceSitePages,
  requireDatabase,
  saveSourceSnapshot,
} from "./db.js";
import {
  GoogleConfigurationError,
  parseGa4Rows,
  parseSearchConsoleRows,
  querySearchConsole,
  runGa4Report,
} from "./google.js";

const SITE_TYPES = [
  ["/guides/", "guide"],
  ["/categories/", "category"],
  ["/seasonal/", "seasonal"],
];

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date, amount) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function periodEndingDaysAgo(now, endOffsetDays, lengthDays) {
  const end = addUtcDays(now, -endOffsetDays);
  const start = addUtcDays(end, -(lengthDays - 1));
  return { start: dateOnly(start), end: dateOnly(end) };
}

function requiredString(value) {
  const string = typeof value === "string" ? value.trim() : "";
  return string && !string.includes("REPLACE_WITH") ? string : "";
}

export function integrationConfiguration(env) {
  const googleCredentials = Boolean(
    requiredString(env.GOOGLE_SERVICE_ACCOUNT_EMAIL) && requiredString(env.GOOGLE_PRIVATE_KEY),
  );
  return [
    {
      source: "search_console",
      label: "Google Search Console",
      state: googleCredentials && requiredString(env.SEARCH_CONSOLE_SITE_URL) ? "configured" : "not_configured",
      detail: "Requires a read-only Google service account added to the Search Console property.",
    },
    {
      source: "ga4",
      label: "Google Analytics 4",
      state: googleCredentials && /^\d+$/.test(requiredString(env.GA4_PROPERTY_ID)) ? "configured" : "not_configured",
      detail: "Requires the GA4 property ID and the same read-only service account.",
    },
    {
      source: "cloudflare",
      label: "Cloudflare traffic",
      state: requiredString(env.CLOUDFLARE_ANALYTICS_TOKEN) && requiredString(env.CLOUDFLARE_ZONE_ID)
        ? "configured"
        : "not_configured",
      detail: "Requires a zone-scoped Analytics Read API token and the AHC zone ID.",
    },
    {
      source: "internal_search",
      label: "AHC internal search",
      state: env.AHC_ANALYTICS_DB?.prepare ? "configured" : "not_configured",
      detail: "Uses the shared D1 database bound to the public Pages project and this Worker.",
    },
    {
      source: "facebook",
      label: "Facebook",
      state: "manual_import",
      detail: "CSV import is available without granting broad Meta account permissions.",
    },
    {
      source: "bing",
      label: "Bing Webmaster Tools",
      state: "manual_import",
      detail: "CSV import is available; API automation can be added after the core dashboard is verified.",
    },
  ];
}

async function runTracked(database, source, callback) {
  const startedAt = new Date().toISOString();
  const id = await beginIntegrationRun(database, source, startedAt);
  try {
    const result = await callback();
    await finishIntegrationRun(database, id, result?.skipped ? "skipped" : "success", result?.message ?? "Sync completed.");
    return { source, status: result?.skipped ? "skipped" : "success", ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown integration error.";
    await finishIntegrationRun(database, id, "failed", message);
    return { source, status: "failed", message };
  }
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function titleFromPath(pathname) {
  if (pathname === "/") return "Australian Home Collective";
  const segment = pathname.split("/").filter(Boolean).at(-1) ?? "page";
  const acronyms = new Map([
    ["tv", "TV"],
    ["ai", "AI"],
    ["faq", "FAQ"],
    ["australia", "Australia"],
  ]);
  return segment
    .split("-")
    .map((word) => acronyms.get(word) ?? `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function pageType(pathname) {
  return SITE_TYPES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "page";
}

export async function syncSiteCatalog(database, env, { fetchImpl = fetch } = {}) {
  const siteOrigin = requiredString(env.SITE_ORIGIN) || "https://australianhomecollective.com.au";
  const response = await fetchImpl(new URL("/sitemap.xml", siteOrigin), {
    headers: { Accept: "application/xml,text/xml" },
  });
  if (!response.ok) throw new Error(`Sitemap request failed (${response.status}).`);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
  const pages = urls.flatMap((urlValue) => {
    try {
      const url = new URL(urlValue);
      if (url.origin !== new URL(siteOrigin).origin) return [];
      return [{
        url: url.toString(),
        path: url.pathname,
        title: titleFromPath(url.pathname),
        pageType: pageType(url.pathname),
      }];
    } catch {
      return [];
    }
  });
  const updatedAt = new Date().toISOString();
  await replaceSitePages(database, pages, updatedAt);
  return { message: `${pages.length} sitemap pages refreshed.`, count: pages.length };
}

export async function syncSearchConsole(database, env, { fetchImpl = fetch, now = new Date() } = {}) {
  const history = periodEndingDaysAgo(now, 2, 90);
  const snapshot = periodEndingDaysAgo(now, 2, 28);
  const base = { type: "web", dataState: "final", rowLimit: 25000 };

  const [dailyResponse, pagesResponse, queriesResponse, overallResponse] = await Promise.all([
    querySearchConsole(env, { ...base, startDate: history.start, endDate: history.end, dimensions: ["date"] }, { fetchImpl }),
    querySearchConsole(env, { ...base, startDate: snapshot.start, endDate: snapshot.end, dimensions: ["page"] }, { fetchImpl }),
    querySearchConsole(env, { ...base, startDate: snapshot.start, endDate: snapshot.end, dimensions: ["query"] }, { fetchImpl }),
    querySearchConsole(env, { ...base, startDate: snapshot.start, endDate: snapshot.end }, { fetchImpl }),
  ]);

  const daily = parseSearchConsoleRows(dailyResponse, ["date"]);
  const pages = parseSearchConsoleRows(pagesResponse, ["page"]);
  const queries = parseSearchConsoleRows(queriesResponse, ["query"]);
  const overall = parseSearchConsoleRows(overallResponse, [])[0] ?? {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
  };
  const updatedAt = new Date().toISOString();

  await replaceSearchConsoleDaily(database, daily, updatedAt);
  await replaceSearchConsolePages(database, snapshot.start, snapshot.end, pages, updatedAt);
  await replaceSearchConsoleQueries(database, snapshot.start, snapshot.end, queries, updatedAt);
  await saveSourceSnapshot(database, "search_console", snapshot.start, snapshot.end, overall, updatedAt);

  return { message: `${daily.length} daily rows, ${pages.length} pages and ${queries.length} queries refreshed.` };
}

function ga4Request(startDate, endDate, dimensions, metrics, extras = {}) {
  return {
    dateRanges: [{ startDate, endDate }],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    limit: "10000",
    keepEmptyRows: false,
    ...extras,
  };
}

export async function syncGa4(database, env, { fetchImpl = fetch, now = new Date() } = {}) {
  const history = periodEndingDaysAgo(now, 1, 90);
  const snapshot = periodEndingDaysAgo(now, 1, 28);
  const metrics = ["activeUsers", "sessions", "engagedSessions", "screenPageViews"];

  const [dailyResponse, landingResponse, overallResponse] = await Promise.all([
    runGa4Report(env, ga4Request(history.start, history.end, ["date"], metrics, {
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }), { fetchImpl }),
    runGa4Report(env, ga4Request(snapshot.start, snapshot.end, ["landingPagePlusQueryString"], metrics, {
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    }), { fetchImpl }),
    runGa4Report(env, ga4Request(snapshot.start, snapshot.end, [], metrics), { fetchImpl }),
  ]);

  const daily = parseGa4Rows(dailyResponse, ["date"], metrics).map((row) => ({
    date: `${row.date.slice(0, 4)}-${row.date.slice(4, 6)}-${row.date.slice(6, 8)}`,
    activeUsers: row.activeUsers,
    sessions: row.sessions,
    engagedSessions: row.engagedSessions,
    pageViews: row.screenPageViews,
  }));
  const landing = parseGa4Rows(landingResponse, ["landingPagePlusQueryString"], metrics).map((row) => ({
    path: row.landingPagePlusQueryString,
    activeUsers: row.activeUsers,
    sessions: row.sessions,
    engagedSessions: row.engagedSessions,
    pageViews: row.screenPageViews,
  }));
  const overallRow = parseGa4Rows(overallResponse, [], metrics)[0] ?? {};
  const overall = {
    activeUsers: overallRow.activeUsers ?? 0,
    sessions: overallRow.sessions ?? 0,
    engagedSessions: overallRow.engagedSessions ?? 0,
    pageViews: overallRow.screenPageViews ?? 0,
  };
  const updatedAt = new Date().toISOString();

  await replaceGa4Daily(database, daily, updatedAt);
  await replaceGa4LandingPages(database, snapshot.start, snapshot.end, landing, updatedAt);
  await saveSourceSnapshot(database, "ga4", snapshot.start, snapshot.end, overall, updatedAt);

  return { message: `${daily.length} daily rows and ${landing.length} landing pages refreshed.` };
}

async function cloudflareGraphql(env, query, variables, fetchImpl) {
  const token = requiredString(env.CLOUDFLARE_ANALYTICS_TOKEN);
  if (!token) throw new Error("CLOUDFLARE_ANALYTICS_TOKEN is not configured.");
  const response = await fetchImpl("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Cloudflare Analytics request failed (${response.status}).`);
  if (Array.isArray(body?.errors) && body.errors.length) {
    throw new Error(`Cloudflare Analytics rejected the query: ${String(body.errors[0]?.message ?? "unknown error").slice(0, 300)}`);
  }
  return body?.data?.viewer?.zones?.[0] ?? null;
}

export async function syncCloudflare(database, env, { fetchImpl = fetch, now = new Date() } = {}) {
  const zoneTag = requiredString(env.CLOUDFLARE_ZONE_ID);
  if (!zoneTag) throw new Error("CLOUDFLARE_ZONE_ID is not configured.");
  const end = new Date(now);
  const start = addUtcDays(end, -30);
  const query = `query AhcTraffic($zoneTag: string, $start: Time, $end: Time) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        hourly: httpRequestsAdaptiveGroups(
          limit: 5000
          orderBy: [datetimeHour_ASC]
          filter: { datetime_geq: $start, datetime_lt: $end, requestSource: "eyeball" }
        ) {
          count
          sum { visits edgeResponseBytes }
          dimensions { datetimeHour }
        }
        topPaths: httpRequestsAdaptiveGroups(
          limit: 100
          orderBy: [count_DESC]
          filter: { datetime_geq: $start, datetime_lt: $end, requestSource: "eyeball" }
        ) {
          count
          sum { visits edgeResponseBytes }
          dimensions { clientRequestPath }
        }
      }
    }
  }`;
  const zone = await cloudflareGraphql(env, query, {
    zoneTag,
    start: start.toISOString(),
    end: end.toISOString(),
  }, fetchImpl);
  if (!zone) throw new Error("Cloudflare Analytics returned no zone data.");

  const hourly = Array.isArray(zone.hourly) ? zone.hourly.map((row) => ({
    hour: row.dimensions?.datetimeHour,
    requests: Number(row.count ?? 0),
    visits: Number(row.sum?.visits ?? 0),
    bytes: Number(row.sum?.edgeResponseBytes ?? 0),
  })).filter((row) => row.hour) : [];
  const paths = Array.isArray(zone.topPaths) ? zone.topPaths.map((row) => ({
    path: row.dimensions?.clientRequestPath ?? "/",
    requests: Number(row.count ?? 0),
    visits: Number(row.sum?.visits ?? 0),
    bytes: Number(row.sum?.edgeResponseBytes ?? 0),
  })) : [];
  const snapshot = {
    requests: hourly.reduce((total, row) => total + row.requests, 0),
    visits: hourly.reduce((total, row) => total + row.visits, 0),
    bytes: hourly.reduce((total, row) => total + row.bytes, 0),
  };
  const updatedAt = new Date().toISOString();
  const periodStart = dateOnly(start);
  const periodEnd = dateOnly(addUtcDays(end, -1));

  await replaceCloudflareHourly(database, hourly, updatedAt);
  await replaceCloudflarePaths(database, periodStart, periodEnd, paths, updatedAt);
  await saveSourceSnapshot(database, "cloudflare", periodStart, periodEnd, snapshot, updatedAt);

  return { message: `${hourly.length} hourly rows and ${paths.length} paths refreshed.` };
}

export async function syncAll(env, options = {}) {
  const database = requireDatabase(env);
  const states = integrationConfiguration(env);
  const configured = new Map(states.map((item) => [item.source, item.state]));
  const results = [];

  results.push(await runTracked(database, "site_catalog", () => syncSiteCatalog(database, env, options)));

  const automated = [
    ["search_console", syncSearchConsole],
    ["ga4", syncGa4],
    ["cloudflare", syncCloudflare],
  ];
  for (const [source, callback] of automated) {
    if (configured.get(source) !== "configured") {
      results.push(await runTracked(database, source, async () => ({
        skipped: true,
        message: "Integration is not configured.",
      })));
      continue;
    }
    results.push(await runTracked(database, source, () => callback(database, env, options)));
  }

  await purgeExpiredData(database, options.now ?? new Date());
  return results;
}

export const __test = {
  addUtcDays,
  dateOnly,
  periodEndingDaysAgo,
  titleFromPath,
  pageType,
  decodeXml,
};
