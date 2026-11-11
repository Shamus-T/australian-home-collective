import { testEventSql } from '../apps/control-centre/src/traffic-quality.js';
import { JOURNEY_VERSION, DRYER_VERSION } from '../src/lib/buying-journey.mjs';
export function journeyQuery(start, end, cohort = 'appliances') {
  if (!['appliances', 'dryer'].includes(cohort)) throw Error('Unknown buying-journey cohort');
  const version = cohort === 'dryer' ? DRYER_VERSION : JOURNEY_VERSION;
  for (const value of [start, end]) if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw Error('Use valid YYYY-MM-DD dates');
  if (start > end) throw Error('Start must not follow end');
  const from = new Date(`${start}T00:00:00+10:00`).toISOString(), until = new Date(Date.parse(`${end}T00:00:00+10:00`) + 86400000).toISOString();
  const filtered = `SELECT *, CASE WHEN ${testEventSql()} THEN 1 ELSE 0 END AS is_test FROM buying_journey_events WHERE occurred_at >= '${from}' AND occurred_at < '${until}' AND version = '${version}'`;
  return `-- Inclusive Brisbane dates ${start} to ${end}. Country XX is unknown. Sources are first observed in this browser tab, not GA4 attribution.
-- Raw, identified tests and unclassified evidence remain separate. No sale conversion inferred.
WITH events AS (${filtered})
SELECT guide_path, country, source, medium, device, stage, COUNT(*) AS raw_events,
 SUM(is_test) AS excluded_test_events, SUM(1-is_test) AS unclassified_events,
 COUNT(DISTINCT CASE WHEN is_test=0 THEN session_id END) AS unclassified_tab_sessions
FROM events GROUP BY guide_path,country,source,medium,device,stage;

-- Entry-cohort page visits. Only later events on the same page can complete a stage.
WITH events AS (${filtered}), entries AS (
 SELECT * FROM events WHERE stage='guide_view' AND is_test=0
), pages AS (
 SELECT e.guide_path,e.country,e.source,e.medium,e.device,e.session_id,e.page_id,
 MAX(CASE WHEN x.stage='engaged_10s' THEN 1 ELSE 0 END) AS engaged,
 MAX(CASE WHEN x.stage='comparison_view' THEN 1 ELSE 0 END) AS comparison_seen,
 MAX(CASE WHEN x.stage='product_view' THEN 1 ELSE 0 END) AS product_seen,
 MAX(CASE WHEN x.stage='retailer_click' THEN 1 ELSE 0 END) AS clicked,
 MAX(CASE WHEN x.stage='retailer_click' AND EXISTS(SELECT 1 FROM events c WHERE c.page_id=e.page_id AND c.is_test=0 AND c.stage='comparison_view' AND c.elapsed_ms<=x.elapsed_ms) THEN 1 ELSE 0 END) AS clicked_after_comparison,
 MAX(CASE WHEN x.stage='retailer_click' AND EXISTS(SELECT 1 FROM events p WHERE p.page_id=e.page_id AND p.is_test=0 AND p.stage='product_view' AND p.product_id=x.product_id AND p.elapsed_ms<=x.elapsed_ms) THEN 1 ELSE 0 END) AS clicked_after_product
 FROM entries e LEFT JOIN events x ON x.page_id=e.page_id AND x.guide_path=e.guide_path AND x.is_test=0 AND x.elapsed_ms>=e.elapsed_ms
 GROUP BY e.page_id
)
SELECT guide_path,country,source,medium,device,COUNT(*) AS measured_page_visits,
 COUNT(DISTINCT session_id) AS unclassified_tab_sessions, SUM(engaged) AS engaged_visits,
 SUM(comparison_seen) AS comparison_seen_visits, SUM(product_seen) AS product_seen_visits,
 SUM(clicked) AS clicking_visits, COUNT(DISTINCT CASE WHEN clicked=1 THEN session_id END) AS clicking_tab_sessions,
 SUM(CASE WHEN comparison_seen=0 AND clicked=0 THEN 1 ELSE 0 END) AS no_comparison_or_click,
 SUM(CASE WHEN comparison_seen=1 AND clicked=0 THEN 1 ELSE 0 END) AS comparison_without_click,
 SUM(clicked_after_comparison) AS clicked_after_comparison, SUM(clicked_after_product) AS clicked_after_same_product,
 SUM(CASE WHEN clicked=1 AND clicked_after_comparison=0 THEN 1 ELSE 0 END) AS clicked_without_measured_comparison
FROM pages GROUP BY guide_path,country,source,medium,device;

WITH events AS (${filtered})
SELECT guide_path,country,source,medium,product_id,placement,stage,COUNT(*) AS raw_events,
 SUM(is_test) AS excluded_test_events,SUM(1-is_test) AS unclassified_events,
 COUNT(DISTINCT CASE WHEN is_test=0 THEN session_id END) AS unclassified_tab_sessions
FROM events WHERE stage IN ('product_view','retailer_click') GROUP BY guide_path,country,source,medium,product_id,placement,stage;

-- Events with missing entries must not be silently counted as completed funnels.
WITH events AS (${filtered}) SELECT COUNT(*) AS unclassified_events_without_entry
FROM events x WHERE is_test=0 AND stage!='guide_view' AND NOT EXISTS(SELECT 1 FROM events e WHERE e.page_id=x.page_id AND e.stage='guide_view' AND e.is_test=0);
`;
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/buying-journey-report.mjs')) {
  try { if (process.argv.length < 4 || process.argv.length > 5) throw Error('Usage: node scripts/buying-journey-report.mjs YYYY-MM-DD YYYY-MM-DD [dryer]'); console.log(journeyQuery(...process.argv.slice(2))); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
