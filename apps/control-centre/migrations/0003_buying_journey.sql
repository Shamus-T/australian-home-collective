CREATE TABLE IF NOT EXISTS buying_journey_events (
  event_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, page_id TEXT NOT NULL,
  guide_path TEXT NOT NULL, version TEXT NOT NULL, stage TEXT NOT NULL,
  product_id TEXT NOT NULL DEFAULT '', placement TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL, medium TEXT NOT NULL, country TEXT NOT NULL, device TEXT NOT NULL,
  elapsed_ms INTEGER NOT NULL, occurred_at TEXT NOT NULL,
  UNIQUE(page_id, stage, product_id, placement)
);
CREATE INDEX IF NOT EXISTS idx_journey_occurred ON buying_journey_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_journey_page ON buying_journey_events(page_id, elapsed_ms);
CREATE TRIGGER IF NOT EXISTS prune_buying_journey AFTER INSERT ON buying_journey_events BEGIN
  DELETE FROM buying_journey_events WHERE occurred_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-400 days');
END;
