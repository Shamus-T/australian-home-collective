CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  guide_path TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  affiliate_network TEXT NOT NULL,
  merchant TEXT NOT NULL,
  destination_host TEXT NOT NULL,
  session_id TEXT,
  device TEXT NOT NULL DEFAULT 'unknown' CHECK (device IN ('desktop', 'mobile', 'tablet', 'unknown')),
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_occurred_at
  ON affiliate_clicks (occurred_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_guide_date
  ON affiliate_clicks (guide_path, occurred_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product_date
  ON affiliate_clicks (product_id, occurred_at);

CREATE TABLE IF NOT EXISTS ga4_pages (
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  path TEXT NOT NULL,
  sessions REAL NOT NULL,
  page_views REAL NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (period_start, period_end, path)
);

CREATE INDEX IF NOT EXISTS idx_ga4_pages_period_views
  ON ga4_pages (period_start, period_end, page_views DESC);
