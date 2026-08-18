export class DatabaseConfigurationError extends Error {}

export const SEARCH_TRACKING_CORRECTED_FROM = "2026-08-01T11:15:00.000Z";
export const AFFILIATE_TRACKING_FULL_DAY_FROM = "2026-08-19";

const EFFECTIVE_SEARCHES_CTE = `
  WITH reporting_searches AS (
    SELECT id, query, result_count, session_id, occurred_at
    FROM search_events
    WHERE event_type = 'search' AND occurred_at >= ?
  ),
  effective_searches AS (
    SELECT candidate.*
    FROM reporting_searches candidate
    WHERE candidate.occurred_at >= ?
      OR candidate.session_id IS NULL
      OR candidate.session_id = ''
      OR NOT EXISTS (
        SELECT 1
        FROM reporting_searches later
        WHERE later.session_id = candidate.session_id
          AND later.occurred_at > candidate.occurred_at
          AND unixepoch(later.occurred_at) - unixepoch(candidate.occurred_at) <= 2
          AND length(later.query) > length(candidate.query)
          AND LOWER(substr(later.query, 1, length(candidate.query))) = LOWER(candidate.query)
          AND NOT EXISTS (
            SELECT 1
            FROM search_events attributed_click
            WHERE attributed_click.event_type = 'result_click'
              AND attributed_click.session_id = candidate.session_id
              AND LOWER(attributed_click.query) = LOWER(candidate.query)
              AND attributed_click.occurred_at >= candidate.occurred_at
              AND attributed_click.occurred_at <= later.occurred_at
          )
      )
  )`;

export function requireDatabase(env) {
  const database = env.AHC_ANALYTICS_DB;
  if (!database?.prepare) {
    throw new DatabaseConfigurationError("AHC_ANALYTICS_DB is not configured.");
  }
  return database;
}

export async function batchStatements(database, statements, chunkSize = 50) {
  for (let index = 0; index < statements.length; index += chunkSize) {
    await database.batch(statements.slice(index, index + chunkSize));
  }
}

export async function beginIntegrationRun(database, source, startedAt = new Date().toISOString()) {
  const result = await database
    .prepare("INSERT INTO integration_runs (source, status, started_at) VALUES (?, 'running', ?)")
    .bind(source, startedAt)
    .run();
  return result.meta?.last_row_id ?? null;
}

export async function finishIntegrationRun(database, id, status, message, completedAt = new Date().toISOString()) {
  if (!id) return;
  await database
    .prepare("UPDATE integration_runs SET status = ?, message = ?, completed_at = ? WHERE id = ?")
    .bind(status, message?.slice(0, 1000) ?? null, completedAt, id)
    .run();
}

export async function saveSourceSnapshot(database, source, periodStart, periodEnd, payload, updatedAt) {
  await database
    .prepare(
      `INSERT INTO source_snapshots (source, period_start, period_end, payload_json, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (source, period_start, period_end) DO UPDATE SET
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`,
    )
    .bind(source, periodStart, periodEnd, JSON.stringify(payload), updatedAt)
    .run();
}

export async function replaceSearchConsoleDaily(database, rows, updatedAt) {
  if (!rows.length) return;
  const statements = rows.map((row) =>
    database
      .prepare(
        `INSERT INTO search_console_daily (metric_date, clicks, impressions, ctr, position, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (metric_date) DO UPDATE SET
           clicks = excluded.clicks,
           impressions = excluded.impressions,
           ctr = excluded.ctr,
           position = excluded.position,
           updated_at = excluded.updated_at`,
      )
      .bind(row.date, row.clicks, row.impressions, row.ctr, row.position, updatedAt),
  );
  await batchStatements(database, statements);
}

async function replacePeriodTable(database, {
  table,
  periodStart,
  periodEnd,
  rows,
  columns,
  values,
  updatedAt,
}) {
  await database
    .prepare(`DELETE FROM ${table} WHERE period_start = ? AND period_end = ?`)
    .bind(periodStart, periodEnd)
    .run();
  if (!rows.length) return;

  const placeholders = ["?", "?", ...columns.map(() => "?"), "?"].join(", ");
  const sql = `INSERT INTO ${table} (period_start, period_end, ${columns.join(", ")}, updated_at) VALUES (${placeholders})`;
  const statements = rows.map((row) =>
    database.prepare(sql).bind(periodStart, periodEnd, ...values(row), updatedAt),
  );
  await batchStatements(database, statements);
}

export function replaceSearchConsolePages(database, periodStart, periodEnd, rows, updatedAt) {
  return replacePeriodTable(database, {
    table: "search_console_pages",
    periodStart,
    periodEnd,
    rows,
    columns: ["page", "clicks", "impressions", "ctr", "position"],
    values: (row) => [row.page, row.clicks, row.impressions, row.ctr, row.position],
    updatedAt,
  });
}

export function replaceSearchConsoleQueries(database, periodStart, periodEnd, rows, updatedAt) {
  return replacePeriodTable(database, {
    table: "search_console_queries",
    periodStart,
    periodEnd,
    rows,
    columns: ["query", "clicks", "impressions", "ctr", "position"],
    values: (row) => [row.query, row.clicks, row.impressions, row.ctr, row.position],
    updatedAt,
  });
}

export async function replaceGa4Daily(database, rows, updatedAt) {
  if (!rows.length) return;
  const statements = rows.map((row) =>
    database
      .prepare(
        `INSERT INTO ga4_daily (metric_date, active_users, sessions, engaged_sessions, page_views, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (metric_date) DO UPDATE SET
           active_users = excluded.active_users,
           sessions = excluded.sessions,
           engaged_sessions = excluded.engaged_sessions,
           page_views = excluded.page_views,
           updated_at = excluded.updated_at`,
      )
      .bind(row.date, row.activeUsers, row.sessions, row.engagedSessions, row.pageViews, updatedAt),
  );
  await batchStatements(database, statements);
}

export function replaceGa4LandingPages(database, periodStart, periodEnd, rows, updatedAt) {
  return replacePeriodTable(database, {
    table: "ga4_landing_pages",
    periodStart,
    periodEnd,
    rows,
    columns: ["path", "active_users", "sessions", "engaged_sessions", "page_views"],
    values: (row) => [row.path, row.activeUsers, row.sessions, row.engagedSessions, row.pageViews],
    updatedAt,
  });
}

export function replaceGa4Pages(database, periodStart, periodEnd, rows, updatedAt) {
  return replacePeriodTable(database, {
    table: "ga4_pages",
    periodStart,
    periodEnd,
    rows,
    columns: ["path", "sessions", "page_views"],
    values: (row) => [row.path, row.sessions, row.pageViews],
    updatedAt,
  });
}

export async function replaceCloudflareHourly(database, rows, updatedAt) {
  if (!rows.length) return;
  const statements = rows.map((row) =>
    database
      .prepare(
        `INSERT INTO cloudflare_hourly (metric_hour, requests, visits, bytes, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (metric_hour) DO UPDATE SET
           requests = excluded.requests,
           visits = excluded.visits,
           bytes = excluded.bytes,
           updated_at = excluded.updated_at`,
      )
      .bind(row.hour, row.requests, row.visits, row.bytes, updatedAt),
  );
  await batchStatements(database, statements);
}

export function replaceCloudflarePaths(database, periodStart, periodEnd, rows, updatedAt) {
  return replacePeriodTable(database, {
    table: "cloudflare_paths",
    periodStart,
    periodEnd,
    rows,
    columns: ["path", "requests", "visits", "bytes"],
    values: (row) => [row.path, row.requests, row.visits, row.bytes],
    updatedAt,
  });
}

export async function replaceSitePages(database, pages, updatedAt) {
  if (!pages.length) return;
  const statements = pages.map((page) =>
    database
      .prepare(
        `INSERT INTO site_pages (url, path, title, page_type, last_seen_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (url) DO UPDATE SET
           path = excluded.path,
           title = excluded.title,
           page_type = excluded.page_type,
           last_seen_at = excluded.last_seen_at,
           updated_at = excluded.updated_at`,
      )
      .bind(page.url, page.path, page.title, page.pageType, updatedAt, updatedAt),
  );
  await batchStatements(database, statements);
}

export async function importManualDaily(database, source, rows, updatedAt) {
  const statements = rows.map((row) =>
    database
      .prepare(
        `INSERT INTO manual_daily (source, metric_date, payload_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (source, metric_date) DO UPDATE SET
           payload_json = excluded.payload_json,
           updated_at = excluded.updated_at`,
      )
      .bind(source, row.date, JSON.stringify(row), updatedAt),
  );
  await batchStatements(database, statements);
}

export async function purgeExpiredData(database, now = new Date()) {
  const searchCutoff = new Date(now);
  searchCutoff.setUTCDate(searchCutoff.getUTCDate() - 400);
  const runCutoff = new Date(now);
  runCutoff.setUTCDate(runCutoff.getUTCDate() - 180);

  await database.batch([
    database.prepare("DELETE FROM search_events WHERE occurred_at < ?").bind(searchCutoff.toISOString()),
    database.prepare("DELETE FROM affiliate_clicks WHERE occurred_at < ?").bind(searchCutoff.toISOString()),
    database.prepare("DELETE FROM integration_runs WHERE started_at < ?").bind(runCutoff.toISOString()),
  ]);
}

function parsePayload(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function results(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function clampDays(value) {
  const parsed = Number.parseInt(value, 10);
  return [7, 28, 90].includes(parsed) ? parsed : 28;
}

function brisbanePeriodBounds(periodStart, periodEnd) {
  if (
    typeof periodStart !== "string"
    || typeof periodEnd !== "string"
    || !/^\d{4}-\d{2}-\d{2}$/.test(periodStart)
    || !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)
  ) {
    return null;
  }
  const start = new Date(`${periodStart}T00:00:00+10:00`);
  const inclusiveEnd = new Date(`${periodEnd}T00:00:00+10:00`);
  if (!Number.isFinite(start.valueOf()) || !Number.isFinite(inclusiveEnd.valueOf()) || start > inclusiveEnd) {
    return null;
  }
  inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() + 1);
  return { start: start.toISOString(), end: inclusiveEnd.toISOString() };
}

export function buildAffiliateOverview({
  summaryRow = {},
  guideRows = [],
  productRows = [],
  ctrPageRows = [],
  ctrClickRows = [],
  selectedDays = 28,
} = {}) {
  const firstCtrPage = ctrPageRows[0] ?? null;
  const ctrWindow = firstCtrPage
    ? { periodStart: firstCtrPage.period_start, periodEnd: firstCtrPage.period_end }
    : null;
  const ctrAvailable = Boolean(
    ctrWindow
    && ctrWindow.periodStart >= AFFILIATE_TRACKING_FULL_DAY_FROM
    && brisbanePeriodBounds(ctrWindow.periodStart, ctrWindow.periodEnd),
  );
  const pageMap = new Map(ctrPageRows.map((row) => [row.path, row]));
  const ctrClickMap = new Map(ctrClickRows.map((row) => [row.guide_path, Number(row.clicks ?? 0)]));

  const guides = guideRows.map((row) => {
    const page = ctrAvailable ? pageMap.get(row.guide_path) : null;
    const pageViews = page ? Number(page.page_views ?? 0) : null;
    const ctrClicks = page ? (ctrClickMap.get(row.guide_path) ?? 0) : null;
    return {
      guidePath: row.guide_path,
      title: row.title || row.guide_path,
      clicks: Number(row.clicks ?? 0),
      clickingSessions: Number(row.clicking_sessions ?? 0),
      productsClicked: Number(row.products_clicked ?? 0),
      lastClickedAt: row.last_clicked_at ?? null,
      ctrClicks,
      pageViews,
      articleToMerchantCtr: pageViews > 0 && ctrClicks !== null ? ctrClicks / pageViews : null,
    };
  });

  return {
    selectedDays,
    totalClicks: Number(summaryRow.clicks ?? 0),
    clickingSessions: Number(summaryRow.clicking_sessions ?? 0),
    firstClickedAt: summaryRow.first_clicked_at ?? null,
    lastClickedAt: summaryRow.last_clicked_at ?? null,
    trackingFullDayFrom: AFFILIATE_TRACKING_FULL_DAY_FROM,
    ctr: {
      status: ctrAvailable ? "available" : "unavailable",
      denominator: "GA4 page views",
      periodStart: ctrWindow?.periodStart ?? null,
      periodEnd: ctrWindow?.periodEnd ?? null,
      usesSelectedPeriod: false,
    },
    guides,
    products: productRows.map((row) => ({
      productId: row.product_id,
      productName: row.product_name,
      guidePath: row.guide_path,
      affiliateNetwork: row.affiliate_network,
      merchant: row.merchant,
      destinationHost: row.destination_host,
      clicks: Number(row.clicks ?? 0),
      clickingSessions: Number(row.clicking_sessions ?? 0),
      lastClickedAt: row.last_clicked_at ?? null,
    })),
  };
}

function buildActions({ internalSearches, gscPages, integrations }) {
  const actions = [];

  for (const search of internalSearches) {
    if (search.no_results >= 2) {
      actions.push({
        priority: "high",
        type: "content-gap",
        title: `Investigate “${search.query}”`,
        detail: `${search.no_results} no-result searches in the selected period.`,
      });
    }
  }

  for (const page of gscPages) {
    const hasUsefulVisibility = page.impressions >= 20;
    const hasLowCtr = page.ctr < 0.02;

    if (hasUsefulVisibility && hasLowCtr && page.position > 0 && page.position <= 10) {
      actions.push({
        priority: "medium",
        type: "ctr",
        title: `Review title and search snippet for ${page.page}`,
        detail: `Average position ${page.position.toFixed(1)} with ${Math.round(page.impressions)} impressions and ${(page.ctr * 100).toFixed(1)}% CTR: visibility is strong enough to test the title and snippet.`,
      });
    } else if (hasUsefulVisibility && hasLowCtr && page.position > 10 && page.position <= 20) {
      actions.push({
        priority: "medium",
        type: "ranking",
        title: `Investigate ranking and search snippet for ${page.page}`,
        detail: `Average position ${page.position.toFixed(1)} with ${Math.round(page.impressions)} impressions and ${(page.ctr * 100).toFixed(1)}% CTR: improve ranking signals and review the snippet together.`,
      });
    } else if (hasUsefulVisibility && hasLowCtr && page.position > 20) {
      actions.push({
        priority: "medium",
        type: "ranking",
        title: `Strengthen ranking, content and authority for ${page.page}`,
        detail: `Average position ${page.position.toFixed(1)} with ${Math.round(page.impressions)} impressions and ${(page.ctr * 100).toFixed(1)}% CTR: focus on content, internal links and authority before treating CTR as a snippet problem.`,
      });
    } else if (hasUsefulVisibility && page.position >= 8 && page.position <= 20) {
      actions.push({
        priority: "medium",
        type: "ranking",
        title: `Strengthen ${page.page}`,
        detail: `Average position ${page.position.toFixed(1)} with ${Math.round(page.impressions)} impressions.`,
      });
    }
  }

  for (const integration of integrations) {
    if (integration.state === "not_configured" && integration.source !== "facebook" && integration.source !== "bing") {
      actions.push({
        priority: "setup",
        type: "integration",
        title: `Connect ${integration.label}`,
        detail: integration.detail,
      });
    }
  }

  const order = { high: 0, medium: 1, setup: 2 };
  return actions.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 12);
}

export async function loadOverview(database, { days = 28, integrations = [] } = {}) {
  const selectedDays = clampDays(days);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - selectedDays);
  const sinceIso = since.toISOString();

  const [
    snapshotsResult,
    internalSummaryResult,
    internalQueriesResult,
    internalClicksResult,
    gscPagesResult,
    gscQueriesResult,
    ga4LandingResult,
    cloudflarePathsResult,
    siteCountsResult,
    runsResult,
    manualResult,
    affiliateSummaryResult,
    affiliateGuidesResult,
    affiliateProductsResult,
    affiliateGa4PagesResult,
  ] = await Promise.all([
    database.prepare(
      `SELECT s.source, s.period_start, s.period_end, s.payload_json, s.updated_at
       FROM source_snapshots s
       INNER JOIN (
         SELECT source, MAX(updated_at) AS latest
         FROM source_snapshots
         GROUP BY source
       ) latest ON latest.source = s.source AND latest.latest = s.updated_at`,
    ).all(),
    database.prepare(
      `${EFFECTIVE_SEARCHES_CTE}
       SELECT
         COUNT(*) AS searches,
         SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS no_result_searches,
         COUNT(DISTINCT NULLIF(session_id, '')) AS searching_sessions
       FROM effective_searches`,
    ).bind(sinceIso, SEARCH_TRACKING_CORRECTED_FROM).all(),
    database.prepare(
      `${EFFECTIVE_SEARCHES_CTE}
       SELECT MIN(query) AS query,
         COUNT(*) AS searches,
         SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS no_results,
         MAX(result_count) AS maximum_results
       FROM effective_searches
       GROUP BY LOWER(query)
       ORDER BY searches DESC, no_results DESC, query ASC
       LIMIT 30`,
    ).bind(sinceIso, SEARCH_TRACKING_CORRECTED_FROM).all(),
    database.prepare(
      `SELECT MIN(query) AS query, COUNT(*) AS clicks
       FROM search_events
       WHERE event_type = 'result_click' AND occurred_at >= ?
       GROUP BY LOWER(query)
       ORDER BY clicks DESC
       LIMIT 30`,
    ).bind(sinceIso).all(),
    database.prepare(
      `SELECT page, clicks, impressions, ctr, position
       FROM search_console_pages
       WHERE updated_at = (SELECT MAX(updated_at) FROM search_console_pages)
       ORDER BY impressions DESC
       LIMIT 30`,
    ).all(),
    database.prepare(
      `SELECT query, clicks, impressions, ctr, position
       FROM search_console_queries
       WHERE updated_at = (SELECT MAX(updated_at) FROM search_console_queries)
       ORDER BY impressions DESC
       LIMIT 30`,
    ).all(),
    database.prepare(
      `SELECT path, active_users, sessions, engaged_sessions, page_views
       FROM ga4_landing_pages
       WHERE updated_at = (SELECT MAX(updated_at) FROM ga4_landing_pages)
       ORDER BY sessions DESC
       LIMIT 30`,
    ).all(),
    database.prepare(
      `SELECT path, requests, visits, bytes
       FROM cloudflare_paths
       WHERE updated_at = (SELECT MAX(updated_at) FROM cloudflare_paths)
       ORDER BY requests DESC
       LIMIT 30`,
    ).all(),
    database.prepare(
      `SELECT page_type, COUNT(*) AS total
       FROM site_pages
       GROUP BY page_type
       ORDER BY page_type`,
    ).all(),
    database.prepare(
      `SELECT source, status, started_at, completed_at, message
       FROM integration_runs
       ORDER BY started_at DESC
       LIMIT 20`,
    ).all(),
    database.prepare(
      `SELECT source, metric_date, payload_json, updated_at
       FROM manual_daily
       WHERE metric_date >= ?
       ORDER BY metric_date DESC`,
    ).bind(sinceIso.slice(0, 10)).all(),
    database.prepare(
      `SELECT COUNT(*) AS clicks,
        COUNT(DISTINCT NULLIF(session_id, '')) AS clicking_sessions,
        MIN(occurred_at) AS first_clicked_at,
        MAX(occurred_at) AS last_clicked_at
       FROM affiliate_clicks
       WHERE occurred_at >= ?`,
    ).bind(sinceIso).all(),
    database.prepare(
      `SELECT affiliate.guide_path,
        COALESCE(MAX(site.title), affiliate.guide_path) AS title,
        COUNT(*) AS clicks,
        COUNT(DISTINCT NULLIF(affiliate.session_id, '')) AS clicking_sessions,
        COUNT(DISTINCT affiliate.product_id) AS products_clicked,
        MAX(affiliate.occurred_at) AS last_clicked_at
       FROM affiliate_clicks affiliate
       LEFT JOIN site_pages site ON site.path = affiliate.guide_path
       WHERE affiliate.occurred_at >= ?
       GROUP BY affiliate.guide_path
       ORDER BY COUNT(*) DESC, affiliate.guide_path ASC
       LIMIT 50`,
    ).bind(sinceIso).all(),
    database.prepare(
      `SELECT product_id,
        MAX(product_name) AS product_name,
        MAX(guide_path) AS guide_path,
        MAX(affiliate_network) AS affiliate_network,
        MAX(merchant) AS merchant,
        MAX(destination_host) AS destination_host,
        COUNT(*) AS clicks,
        COUNT(DISTINCT NULLIF(session_id, '')) AS clicking_sessions,
        MAX(occurred_at) AS last_clicked_at
       FROM affiliate_clicks
       WHERE occurred_at >= ?
       GROUP BY product_id
       ORDER BY clicks DESC, product_name ASC
       LIMIT 100`,
    ).bind(sinceIso).all(),
    database.prepare(
      `SELECT period_start, period_end, path, sessions, page_views
       FROM ga4_pages
       WHERE updated_at = (SELECT MAX(updated_at) FROM ga4_pages)
       ORDER BY page_views DESC`,
    ).all(),
  ]);

  const snapshots = Object.fromEntries(
    results(snapshotsResult).map((row) => [row.source, {
      source: row.source,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      updatedAt: row.updated_at,
      data: parsePayload(row.payload_json),
    }]),
  );
  const internalSummary = results(internalSummaryResult)[0] ?? {
    searches: 0,
    no_result_searches: 0,
    searching_sessions: 0,
  };
  const internalSearches = results(internalQueriesResult).map((row) => ({
    query: row.query,
    searches: Number(row.searches ?? 0),
    no_results: Number(row.no_results ?? 0),
    maximum_results: Number(row.maximum_results ?? 0),
  }));
  const clickMap = new Map(results(internalClicksResult).map((row) => [row.query.toLowerCase(), Number(row.clicks ?? 0)]));
  for (const row of internalSearches) row.clicks = clickMap.get(row.query.toLowerCase()) ?? 0;

  const gscPages = results(gscPagesResult).map((row) => ({
    ...row,
    clicks: Number(row.clicks),
    impressions: Number(row.impressions),
    ctr: Number(row.ctr),
    position: Number(row.position),
  }));

  const affiliateGa4Pages = results(affiliateGa4PagesResult);
  const affiliateCtrWindow = affiliateGa4Pages[0] ?? null;
  let affiliateCtrClicks = [];
  if (affiliateCtrWindow?.period_start >= AFFILIATE_TRACKING_FULL_DAY_FROM) {
    const bounds = brisbanePeriodBounds(
      affiliateCtrWindow.period_start,
      affiliateCtrWindow.period_end,
    );
    if (bounds) {
      const affiliateCtrClicksResult = await database.prepare(
        `SELECT guide_path, COUNT(*) AS clicks
         FROM affiliate_clicks
         WHERE occurred_at >= ? AND occurred_at < ?
         GROUP BY guide_path`,
      ).bind(bounds.start, bounds.end).all();
      affiliateCtrClicks = results(affiliateCtrClicksResult);
    }
  }

  const affiliate = buildAffiliateOverview({
    summaryRow: results(affiliateSummaryResult)[0],
    guideRows: results(affiliateGuidesResult),
    productRows: results(affiliateProductsResult),
    ctrPageRows: affiliateGa4Pages,
    ctrClickRows: affiliateCtrClicks,
    selectedDays,
  });

  return {
    generatedAt: new Date().toISOString(),
    days: selectedDays,
    snapshots,
    internalSearch: {
      searches: Number(internalSummary.searches ?? 0),
      noResultSearches: Number(internalSummary.no_result_searches ?? 0),
      searchingSessions: Number(internalSummary.searching_sessions ?? 0),
      trackingCorrectedFrom: SEARCH_TRACKING_CORRECTED_FROM,
      historicalTreatment: "Rapid same-session prefix events before the correction boundary are collapsed for reporting only; raw events are retained.",
      queries: internalSearches,
    },
    searchConsole: {
      pages: gscPages,
      queries: results(gscQueriesResult).map((row) => ({
        ...row,
        clicks: Number(row.clicks),
        impressions: Number(row.impressions),
        ctr: Number(row.ctr),
        position: Number(row.position),
      })),
    },
    ga4: {
      landingPages: results(ga4LandingResult).map((row) => ({
        ...row,
        active_users: Number(row.active_users),
        sessions: Number(row.sessions),
        engaged_sessions: Number(row.engaged_sessions),
        page_views: Number(row.page_views),
      })),
    },
    affiliate,
    cloudflare: {
      paths: results(cloudflarePathsResult).map((row) => ({
        ...row,
        requests: Number(row.requests),
        visits: Number(row.visits),
        bytes: Number(row.bytes),
      })),
    },
    site: {
      counts: results(siteCountsResult).map((row) => ({ pageType: row.page_type, total: Number(row.total) })),
    },
    manual: results(manualResult).map((row) => ({
      source: row.source,
      date: row.metric_date,
      updatedAt: row.updated_at,
      data: parsePayload(row.payload_json),
    })),
    integrations,
    recentRuns: results(runsResult),
    actions: buildActions({ internalSearches, gscPages, integrations }),
  };
}

export const __test = {
  brisbanePeriodBounds,
  buildAffiliateOverview,
  buildActions,
  clampDays,
  effectiveSearchesCte: EFFECTIVE_SEARCHES_CTE,
  parsePayload,
};
