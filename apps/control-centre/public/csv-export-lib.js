const FORMULA_PREFIX = /^\s*[=+\-@]/u;
const FILENAME_TIME_ZONE = "Australia/Brisbane";

export const UTF8_BOM = "\uFEFF";

function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.valueOf())) throw new TypeError("A valid export date is required.");
  return date;
}

function exportTimestamp(value) {
  return validDate(value).toISOString();
}

export function filenameDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: FILENAME_TIME_ZONE,
  }).formatToParts(validDate(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function escapeCsvValue(value) {
  let text = "";
  if (typeof value === "string") {
    text = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  } else if (typeof value === "number") {
    text = Number.isFinite(value) ? String(value) : "";
  } else if (value !== null && value !== undefined) {
    text = String(value);
  }
  return `"${text.replaceAll('"', '""')}"`;
}

export function createCsv(headers, rows = []) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");
}

function snapshot(dashboard, source) {
  return dashboard?.snapshots?.[source] ?? {};
}

function sourceMetadata(source) {
  return [
    { header: "period_start", value: (_row, dashboard) => snapshot(dashboard, source).periodStart ?? null },
    { header: "period_end", value: (_row, dashboard) => snapshot(dashboard, source).periodEnd ?? null },
    { header: "source_updated_at", value: (_row, dashboard) => snapshot(dashboard, source).updatedAt ?? null },
  ];
}

function manualRows(dashboard, source) {
  return (dashboard?.manual ?? [])
    .filter((row) => row.source === source)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const CSV_EXPORT_DEFINITIONS = {
  "ga4-landing-pages": {
    label: "GA4 landing pages",
    filenameStem: "ahc-ga4-landing-pages",
    rows: (dashboard) => dashboard?.ga4?.landingPages ?? [],
    columns: [
      { header: "path", value: (row) => row.path },
      { header: "active_users", value: (row) => row.active_users },
      { header: "sessions", value: (row) => row.sessions },
      { header: "engaged_sessions", value: (row) => row.engaged_sessions },
      { header: "page_views", value: (row) => row.page_views },
      ...sourceMetadata("ga4"),
    ],
  },
  "search-console-pages": {
    label: "Search Console pages",
    filenameStem: "ahc-search-console-pages",
    rows: (dashboard) => dashboard?.searchConsole?.pages ?? [],
    columns: [
      { header: "page", value: (row) => row.page },
      { header: "clicks", value: (row) => row.clicks },
      { header: "impressions", value: (row) => row.impressions },
      { header: "ctr", value: (row) => row.ctr },
      { header: "position", value: (row) => row.position },
      ...sourceMetadata("search_console"),
    ],
  },
  "search-console-queries": {
    label: "Search Console queries",
    filenameStem: "ahc-search-console-queries",
    rows: (dashboard) => dashboard?.searchConsole?.queries ?? [],
    columns: [
      { header: "query", value: (row) => row.query },
      { header: "clicks", value: (row) => row.clicks },
      { header: "impressions", value: (row) => row.impressions },
      { header: "ctr", value: (row) => row.ctr },
      { header: "position", value: (row) => row.position },
      ...sourceMetadata("search_console"),
    ],
  },
  "cloudflare-paths": {
    label: "Cloudflare paths",
    filenameStem: "ahc-cloudflare-paths",
    rows: (dashboard) => dashboard?.cloudflare?.paths ?? [],
    columns: [
      { header: "path", value: (row) => row.path },
      { header: "requests", value: (row) => row.requests },
      { header: "visits", value: (row) => row.visits },
      { header: "bytes", value: (row) => row.bytes },
      ...sourceMetadata("cloudflare"),
    ],
  },
  "onsite-search": {
    label: "AHC internal search",
    filenameStem: "ahc-onsite-search",
    rows: (dashboard) => dashboard?.internalSearch?.queries ?? [],
    columns: [
      { header: "query", value: (row) => row.query },
      { header: "searches", value: (row) => row.searches },
      { header: "no_results", value: (row) => row.no_results },
      { header: "clicks", value: (row) => row.clicks },
      { header: "maximum_results", value: (row) => row.maximum_results },
      { header: "selected_days", value: (_row, dashboard) => dashboard?.days ?? null },
      { header: "tracking_corrected_from", value: (_row, dashboard) => dashboard?.internalSearch?.trackingCorrectedFrom ?? null },
      { header: "export_generated_at", value: (_row, _dashboard, generatedAt) => generatedAt },
    ],
  },
  "affiliate-guides": {
    label: "affiliate performance by guide",
    filenameStem: "ahc-affiliate-guides",
    rows: (dashboard) => dashboard?.affiliate?.guides ?? [],
    columns: [
      { header: "guide_path", value: (row) => row.guidePath },
      { header: "title", value: (row) => row.title },
      { header: "clicks", value: (row) => row.clicks },
      { header: "clicking_sessions", value: (row) => row.clickingSessions },
      { header: "products_clicked", value: (row) => row.productsClicked },
      { header: "ctr_clicks", value: (row) => row.ctrClicks },
      { header: "ga4_page_views", value: (row) => row.pageViews },
      { header: "article_to_merchant_ctr", value: (row) => row.articleToMerchantCtr },
      { header: "selected_days", value: (_row, dashboard) => dashboard?.affiliate?.selectedDays ?? null },
      { header: "ctr_period_start", value: (_row, dashboard) => dashboard?.affiliate?.ctr?.periodStart ?? null },
      { header: "ctr_period_end", value: (_row, dashboard) => dashboard?.affiliate?.ctr?.periodEnd ?? null },
      { header: "export_generated_at", value: (_row, _dashboard, generatedAt) => generatedAt },
    ],
  },
  "affiliate-products": {
    label: "affiliate performance by product",
    filenameStem: "ahc-affiliate-products",
    rows: (dashboard) => dashboard?.affiliate?.products ?? [],
    columns: [
      { header: "product_id", value: (row) => row.productId },
      { header: "product_name", value: (row) => row.productName },
      { header: "guide_path", value: (row) => row.guidePath },
      { header: "merchant", value: (row) => row.merchant },
      { header: "affiliate_network", value: (row) => row.affiliateNetwork },
      { header: "destination_host", value: (row) => row.destinationHost },
      { header: "clicks", value: (row) => row.clicks },
      { header: "clicking_sessions", value: (row) => row.clickingSessions },
      { header: "last_clicked_at", value: (row) => row.lastClickedAt },
      { header: "selected_days", value: (_row, dashboard) => dashboard?.affiliate?.selectedDays ?? null },
      { header: "export_generated_at", value: (_row, _dashboard, generatedAt) => generatedAt },
    ],
  },
  facebook: {
    label: "Facebook data",
    filenameStem: "ahc-facebook",
    rows: (dashboard) => manualRows(dashboard, "facebook"),
    columns: [
      { header: "date", value: (row) => row.date },
      { header: "reach", value: (row) => row.data?.reach },
      { header: "engagements", value: (row) => row.data?.engagements },
      { header: "link_clicks", value: (row) => row.data?.linkClicks },
      { header: "followers", value: (row) => row.data?.followers },
      { header: "selected_days", value: (_row, dashboard) => dashboard?.days ?? null },
      { header: "source_updated_at", value: (row) => row.updatedAt },
      { header: "export_generated_at", value: (_row, _dashboard, generatedAt) => generatedAt },
    ],
  },
  bing: {
    label: "Bing data",
    filenameStem: "ahc-bing",
    rows: (dashboard) => manualRows(dashboard, "bing"),
    columns: [
      { header: "date", value: (row) => row.date },
      { header: "clicks", value: (row) => row.data?.clicks },
      { header: "impressions", value: (row) => row.data?.impressions },
      { header: "ctr", value: (row) => row.data?.ctr },
      { header: "position", value: (row) => row.data?.position },
      { header: "selected_days", value: (_row, dashboard) => dashboard?.days ?? null },
      { header: "source_updated_at", value: (row) => row.updatedAt },
      { header: "export_generated_at", value: (_row, _dashboard, generatedAt) => generatedAt },
    ],
  },
};

export function buildCsvExport(key, dashboard, { generatedAt = new Date() } = {}) {
  const definition = CSV_EXPORT_DEFINITIONS[key];
  if (!definition) throw new TypeError(`Unknown CSV export: ${key}`);
  const timestamp = exportTimestamp(generatedAt);
  const sourceRows = definition.rows(dashboard);
  const rows = sourceRows.map((row) =>
    definition.columns.map((column) => column.value(row, dashboard, timestamp))
  );
  return {
    csv: createCsv(definition.columns.map((column) => column.header), rows),
    filename: `${definition.filenameStem}-${filenameDate(timestamp)}.csv`,
    label: definition.label,
    rowCount: rows.length,
  };
}
