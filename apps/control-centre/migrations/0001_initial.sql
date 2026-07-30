PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS search_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK (event_type IN ('search', 'result_click')),
  query TEXT NOT NULL,
  result_count INTEGER,
  origin_path TEXT NOT NULL DEFAULT '/search/',
  selected_path TEXT,
  session_id TEXT,
  device TEXT NOT NULL DEFAULT 'unknown' CHECK (device IN ('desktop', 'mobile', 'tablet', 'unknown')),
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_events_occurred_at
  ON search_events (occurred_at);
CREATE INDEX IF NOT EXISTS idx_search_events_query
  ON search_events (query COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_search_events_type_date
  ON search_events (event_type, occurred_at);

CREATE TABLE IF NOT EXISTS integration_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'skipped', 'failed')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  message TEXT
);

CREATE INDEX IF NOT EXISTS idx_integration_runs_source_started
  ON integration_runs (source, started_at DESC);

CREATE TABLE IF NOT EXISTS source_snapshots (
  source TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (source, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS search_console_daily (
  metric_date TEXT PRIMARY KEY,
  clicks REAL NOT NULL,
  impressions REAL NOT NULL,
  ctr REAL NOT NULL,
  position REAL NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS search_console_pages (
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  page TEXT NOT NULL,
  clicks REAL NOT NULL,
  impressions REAL NOT NULL,
  ctr REAL NOT NULL,
  position REAL NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (period_start, period_end, page)
);

CREATE INDEX IF NOT EXISTS idx_search_console_pages_period_impressions
  ON search_console_pages (period_start, period_end, impressions DESC);

CREATE TABLE IF NOT EXISTS search_console_queries (
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  query TEXT NOT NULL,
  clicks REAL NOT NULL,
  impressions REAL NOT NULL,
  ctr REAL NOT NULL,
  position REAL NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (period_start, period_end, query)
);

CREATE INDEX IF NOT EXISTS idx_search_console_queries_period_impressions
  ON search_console_queries (period_start, period_end, impressions DESC);

CREATE TABLE IF NOT EXISTS ga4_daily (
  metric_date TEXT PRIMARY KEY,
  active_users REAL NOT NULL,
  sessions REAL NOT NULL,
  engaged_sessions REAL NOT NULL,
  page_views REAL NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ga4_landing_pages (
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  path TEXT NOT NULL,
  active_users REAL NOT NULL,
  sessions REAL NOT NULL,
  engaged_sessions REAL NOT NULL,
  page_views REAL NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (period_start, period_end, path)
);

CREATE INDEX IF NOT EXISTS idx_ga4_landing_period_sessions
  ON ga4_landing_pages (period_start, period_end, sessions DESC);

CREATE TABLE IF NOT EXISTS cloudflare_hourly (
  metric_hour TEXT PRIMARY KEY,
  requests REAL NOT NULL,
  visits REAL NOT NULL,
  bytes REAL NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cloudflare_paths (
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  path TEXT NOT NULL,
  requests REAL NOT NULL,
  visits REAL NOT NULL,
  bytes REAL NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (period_start, period_end, path)
);

CREATE INDEX IF NOT EXISTS idx_cloudflare_paths_period_requests
  ON cloudflare_paths (period_start, period_end, requests DESC);

CREATE TABLE IF NOT EXISTS site_pages (
  url TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  title TEXT NOT NULL,
  page_type TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_pages_type
  ON site_pages (page_type, path);

CREATE TABLE IF NOT EXISTS manual_daily (
  source TEXT NOT NULL CHECK (source IN ('facebook', 'bing')),
  metric_date TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (source, metric_date)
);
