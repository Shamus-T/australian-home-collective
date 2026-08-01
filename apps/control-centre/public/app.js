const period = document.querySelector("#period");
const syncButton = document.querySelector("#sync");
const statusElement = document.querySelector("#status");
let dashboard = null;

function setStatus(message, type = "") {
  statusElement.textContent = message;
  statusElement.className = `status${type ? ` is-${type}` : ""}`;
}

async function fetchJson(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok && response.status !== 207) {
    throw new Error(body?.message ?? `Request failed (${response.status}).`);
  }
  return body;
}

function number(value, maximumFractionDigits = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits }).format(numeric);
}

function percent(value, fractionDigits = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return `${(numeric * 100).toFixed(fractionDigits)}%`;
}

function bytes(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let amount = numeric;
  let unit = 0;
  while (amount >= 1000 && unit < units.length - 1) {
    amount /= 1000;
    unit += 1;
  }
  return `${amount.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function element(tag, attributes = {}, text = null) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (name === "className") node.className = value;
    else if (name.startsWith("data-")) node.setAttribute(name, value);
    else node[name] = value;
  }
  if (text !== null) node.textContent = text;
  return node;
}

function renderMetricCards(targetId, cards) {
  const target = document.querySelector(targetId);
  target.replaceChildren();
  for (const card of cards) {
    const article = element("article", { className: "metric-card" });
    article.append(
      element("p", {}, card.label),
      element("strong", {}, card.value),
      element("small", {}, card.detail),
    );
    target.append(article);
  }
}

function renderTable(targetId, columns, rows) {
  const table = document.querySelector(targetId);
  table.replaceChildren();
  const thead = element("thead");
  const headingRow = element("tr");
  for (const column of columns) {
    headingRow.append(element("th", { className: column.numeric ? "number" : "" }, column.label));
  }
  thead.append(headingRow);
  const tbody = element("tbody");

  if (!rows.length) {
    const row = element("tr");
    const cell = element("td", { colSpan: columns.length, className: "empty" }, "No data is available for this section yet.");
    row.append(cell);
    tbody.append(row);
  } else {
    for (const item of rows) {
      const row = element("tr");
      for (const column of columns) {
        const value = column.render ? column.render(item) : item[column.key];
        row.append(element("td", {
          className: [column.numeric ? "number" : "", column.path ? "path" : ""].filter(Boolean).join(" "),
        }, value ?? "—"));
      }
      tbody.append(row);
    }
  }

  table.append(thead, tbody);
}

function snapshot(source) {
  return dashboard?.snapshots?.[source]?.data ?? {};
}

function renderOverview() {
  const cloudflare = snapshot("cloudflare");
  const searchConsole = snapshot("search_console");
  const ga4 = snapshot("ga4");
  const internal = dashboard.internalSearch;

  renderMetricCards("#metric-cards", [
    { label: "Cloudflare visits", value: number(cloudflare.visits), detail: "Broad site-traffic measure" },
    { label: "Google search clicks", value: number(searchConsole.clicks), detail: "Search Console discovery" },
    { label: "Google impressions", value: number(searchConsole.impressions), detail: `CTR ${percent(searchConsole.ctr)}` },
    { label: "GA4 sessions", value: number(ga4.sessions), detail: `${number(ga4.engagedSessions)} engaged sessions` },
    { label: "AHC searches", value: number(internal.searches), detail: `${number(internal.searchingSessions)} anonymous sessions` },
    { label: "No-result searches", value: number(internal.noResultSearches), detail: "Potential content gaps" },
    { label: "Cloudflare requests", value: number(cloudflare.requests), detail: bytes(cloudflare.bytes) },
    { label: "GA4 active users", value: number(ga4.activeUsers), detail: `${number(ga4.pageViews)} page views` },
  ]);

  const actionList = document.querySelector("#actions");
  actionList.replaceChildren();
  if (!dashboard.actions.length) {
    actionList.append(element("li", { className: "empty" }, "No priority action has been detected from the available data."));
  } else {
    for (const action of dashboard.actions) {
      const item = element("li", { "data-priority": action.priority });
      item.append(element("strong", {}, action.title), element("span", {}, action.detail));
      actionList.append(item);
    }
  }

  const counts = document.querySelector("#site-counts");
  counts.replaceChildren();
  for (const item of dashboard.site.counts) {
    const wrapper = element("div");
    wrapper.append(element("dt", {}, item.pageType), element("dd", {}, number(item.total)));
    counts.append(wrapper);
  }
  if (!dashboard.site.counts.length) counts.append(element("p", { className: "empty" }, "Run a sync to load the sitemap inventory."));

  renderTable("#landing-table", [
    { label: "Landing page", key: "path", path: true },
    { label: "Sessions", numeric: true, render: (row) => number(row.sessions) },
    { label: "Engaged", numeric: true, render: (row) => number(row.engaged_sessions) },
    { label: "Users", numeric: true, render: (row) => number(row.active_users) },
    { label: "Views", numeric: true, render: (row) => number(row.page_views) },
  ], dashboard.ga4.landingPages.slice(0, 15));
}

function renderSearch() {
  renderTable("#gsc-pages-table", [
    { label: "Page", key: "page", path: true },
    { label: "Clicks", numeric: true, render: (row) => number(row.clicks) },
    { label: "Impressions", numeric: true, render: (row) => number(row.impressions) },
    { label: "CTR", numeric: true, render: (row) => percent(row.ctr) },
    { label: "Position", numeric: true, render: (row) => number(row.position, 1) },
  ], dashboard.searchConsole.pages);

  renderTable("#gsc-queries-table", [
    { label: "Query", key: "query", path: true },
    { label: "Clicks", numeric: true, render: (row) => number(row.clicks) },
    { label: "Impressions", numeric: true, render: (row) => number(row.impressions) },
    { label: "CTR", numeric: true, render: (row) => percent(row.ctr) },
    { label: "Position", numeric: true, render: (row) => number(row.position, 1) },
  ], dashboard.searchConsole.queries);

  renderTable("#cloudflare-table", [
    { label: "Path", key: "path", path: true },
    { label: "Requests", numeric: true, render: (row) => number(row.requests) },
    { label: "Visits", numeric: true, render: (row) => number(row.visits) },
    { label: "Transfer", numeric: true, render: (row) => bytes(row.bytes) },
  ], dashboard.cloudflare.paths);
}

function renderOnsite() {
  const internal = dashboard.internalSearch;
  const trackingNote = document.querySelector("#onsite-tracking-note");
  const correctedFrom = new Date(internal.trackingCorrectedFrom);
  trackingNote.textContent =
    `Tracking corrected from ${correctedFrom.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Australia/Brisbane",
    })}. Earlier rapid same-session prefixes are collapsed in reporting only; raw events remain intact.`;
  const clickTotal = internal.queries.reduce((total, row) => total + row.clicks, 0);
  const clickRate = internal.searches ? clickTotal / internal.searches : 0;
  renderMetricCards("#onsite-cards", [
    { label: "Searches", value: number(internal.searches), detail: `Last ${dashboard.days} days` },
    { label: "No-result searches", value: number(internal.noResultSearches), detail: "Review repeated phrases first" },
    { label: "Result clicks", value: number(clickTotal), detail: `Approx. ${percent(clickRate)} searches led to a click` },
    { label: "Searching sessions", value: number(internal.searchingSessions), detail: "Anonymous, session-scoped identifiers" },
  ]);
  renderTable("#onsite-table", [
    { label: "Search phrase", key: "query", path: true },
    { label: "Searches", numeric: true, render: (row) => number(row.searches) },
    { label: "No results", numeric: true, render: (row) => number(row.no_results) },
    { label: "Clicks", numeric: true, render: (row) => number(row.clicks) },
    { label: "Max results", numeric: true, render: (row) => number(row.maximum_results) },
  ], internal.queries);
}

function latestManual(source) {
  return dashboard.manual.filter((row) => row.source === source).sort((a, b) => b.date.localeCompare(a.date));
}

function renderSocial() {
  renderTable("#facebook-table", [
    { label: "Date", key: "date" },
    { label: "Reach", numeric: true, render: (row) => number(row.data?.reach) },
    { label: "Engagements", numeric: true, render: (row) => number(row.data?.engagements) },
    { label: "Link clicks", numeric: true, render: (row) => number(row.data?.linkClicks) },
    { label: "Followers", numeric: true, render: (row) => number(row.data?.followers) },
  ], latestManual("facebook"));

  renderTable("#bing-table", [
    { label: "Date", key: "date" },
    { label: "Clicks", numeric: true, render: (row) => number(row.data?.clicks) },
    { label: "Impressions", numeric: true, render: (row) => number(row.data?.impressions) },
    { label: "CTR", numeric: true, render: (row) => percent(row.data?.ctr) },
    { label: "Position", numeric: true, render: (row) => number(row.data?.position, 1) },
  ], latestManual("bing"));
}

function renderIntegrations() {
  const grid = document.querySelector("#integration-grid");
  grid.replaceChildren();
  for (const integration of dashboard.integrations) {
    const card = element("article", { className: "integration-card" });
    card.append(
      element("span", { className: `badge ${integration.state}` }, integration.state.replaceAll("_", " ")),
      element("h3", {}, integration.label),
      element("p", {}, integration.detail),
    );
    grid.append(card);
  }

  renderTable("#runs-table", [
    { label: "Source", key: "source" },
    { label: "Status", key: "status" },
    { label: "Started", render: (row) => new Date(row.started_at).toLocaleString("en-AU") },
    { label: "Message", key: "message", path: true },
  ], dashboard.recentRuns);
}

function render() {
  renderOverview();
  renderSearch();
  renderOnsite();
  renderSocial();
  renderIntegrations();
}

async function load() {
  setStatus("Loading dashboard…");
  try {
    const result = await fetchJson(`/api/overview?days=${encodeURIComponent(period.value)}`);
    dashboard = result;
    render();
    const viewer = result.viewer?.email ? ` Signed in as ${result.viewer.email}.` : "";
    setStatus(`Updated ${new Date(result.generatedAt).toLocaleString("en-AU")}.${viewer}`, "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "The dashboard could not be loaded.", "error");
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field.trim());
      field = "";
    } else if (character === "\n") {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  return rows;
}

function normaliseHeader(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function csvObjects(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("The CSV does not contain any data rows.");
  const headers = rows[0].map(normaliseHeader);
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function firstValue(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== "") return row[name];
  }
  return "";
}

function mapImport(source, rows) {
  if (source === "facebook") {
    return rows.map((row) => ({
      date: firstValue(row, ["date", "day"]),
      reach: firstValue(row, ["reach", "post_reach", "page_reach"]),
      engagements: firstValue(row, ["engagements", "engagement", "post_engagements"]),
      linkClicks: firstValue(row, ["link_clicks", "link_click", "clicks"]),
      followers: firstValue(row, ["followers", "page_followers", "follows"]),
    }));
  }
  return rows.map((row) => {
    let ctr = Number(firstValue(row, ["ctr", "click_through_rate"]));
    if (ctr > 1) ctr /= 100;
    return {
      date: firstValue(row, ["date", "day"]),
      clicks: firstValue(row, ["clicks"]),
      impressions: firstValue(row, ["impressions"]),
      ctr,
      position: firstValue(row, ["position", "average_position"]),
    };
  });
}

for (const tab of document.querySelectorAll("[data-tab]")) {
  tab.addEventListener("click", () => {
    for (const candidate of document.querySelectorAll("[data-tab]")) candidate.classList.toggle("is-active", candidate === tab);
    for (const panel of document.querySelectorAll("[data-panel]")) panel.classList.toggle("is-active", panel.dataset.panel === tab.dataset.tab);
  });
}

period.addEventListener("change", load);
syncButton.addEventListener("click", async () => {
  syncButton.disabled = true;
  setStatus("Synchronising configured data sources…");
  try {
    const result = await fetchJson("/api/sync", { method: "POST" });
    const failures = result.results.filter((item) => item.status === "failed");
    setStatus(failures.length ? `${failures.length} integration(s) failed; completed sources were retained.` : "Synchronisation completed.", failures.length ? "error" : "success");
    await load();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Synchronisation failed.", "error");
  } finally {
    syncButton.disabled = false;
  }
});

for (const form of document.querySelectorAll(".import-form")) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const source = form.dataset.source;
    const input = form.querySelector('input[type="file"]');
    const button = form.querySelector("button");
    const file = input.files?.[0];
    if (!file) return;
    button.disabled = true;
    setStatus(`Importing ${source} data…`);
    try {
      const rows = mapImport(source, csvObjects(await file.text()));
      const result = await fetchJson("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, rows }),
      });
      setStatus(`${result.imported} ${source} rows imported.`, "success");
      input.value = "";
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The CSV import failed.", "error");
    } finally {
      button.disabled = false;
    }
  });
}

load();
