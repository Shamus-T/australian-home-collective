// Reporting exclusions only: raw evidence remains in D1.
export const CONFIRMED_TEST_EVENT_IDS = ['cb6429d2-ed43-46e2-8966-23c16428d114'];
export const CONFIRMED_TEST_SESSION_IDS = ['qa_d1_receipt_20261007_1791375294310'];
export const TEST_SESSION_PREFIXES = ['qa', 'test', 'internal'];
export const TRAFFIC_QUALITY_NOTE = 'Known and labelled tests are excluded; remaining clicks have unverified human attribution. Raw events are retained. Merchant clicks, orders and commission are separate reports.';

export function testEventSql(alias = '') {
  if (alias && !/^[a-z_][a-z0-9_]*$/i.test(alias)) throw new Error('Invalid SQL alias');
  const prefix = alias ? `${alias}.` : '';
  const literals = (values) => values.map(value => `'${value.replaceAll("'", "''")}'`).join(', ');
  return `(COALESCE(${prefix}event_id, '') IN (${literals(CONFIRMED_TEST_EVENT_IDS)})
    OR COALESCE(${prefix}session_id, '') IN (${literals(CONFIRMED_TEST_SESSION_IDS)})
    OR ${TEST_SESSION_PREFIXES.map(value => `LOWER(COALESCE(${prefix}session_id, '')) LIKE '${value}%'`).join(' OR ')})`;
}
