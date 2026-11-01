import { JOURNEY_VERSION, JOURNEY_GUIDES, JOURNEY_STAGES, JOURNEY_SOURCES, JOURNEY_MEDIA } from '../../src/lib/buying-journey.mjs';
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const json = (status, message) => new Response(JSON.stringify({ message }), { status, headers });
const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function validateJourney(p) {
  if (!p || p.version !== JOURNEY_VERSION || !Object.hasOwn(JOURNEY_GUIDES, p.guidePath ?? '') || !JOURNEY_STAGES.includes(p.stage)
    || !uuid(p.eventId) || !uuid(p.pageId) || typeof p.sessionId !== 'string' || !/^[A-Za-z0-9_-]{8,80}$/.test(p.sessionId)
    || !JOURNEY_SOURCES.includes(p.source) || !JOURNEY_MEDIA.includes(p.medium)
    || !Number.isSafeInteger(p.elapsedMs) || p.elapsedMs < 0 || p.elapsedMs > 86400000
    || !['desktop', 'mobile', 'tablet', 'unknown'].includes(p.device)) return false;
  const productStage = ['product_view', 'retailer_click'].includes(p.stage);
  if (productStage ? !JOURNEY_GUIDES[p.guidePath].includes(p.productId) : p.productId !== '') return false;
  return p.stage === 'retailer_click' ? ['comparison', 'card', 'stack', 'other'].includes(p.placement) : p.placement === '';
}
export async function onRequestPost({ request, env }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return json(403, 'Origin not accepted.');
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return json(415, 'JSON required.');
  let p;
  try { const text = await request.text(); if (new TextEncoder().encode(text).length > 4096) return json(413, 'Body too large.'); p = JSON.parse(text); } catch { return json(400, 'Invalid event.'); }
  if (!validateJourney(p)) return json(400, 'Invalid event.');
  if (!env.AHC_ANALYTICS_DB?.prepare) return json(503, 'Collector unavailable.');
  // Country comes from Cloudflare, never a client-supplied country or retained IP.
  const country = /^[A-Z]{2}$/.test(request.cf?.country ?? '') ? request.cf.country : 'XX';
  try {
    await env.AHC_ANALYTICS_DB.prepare(`INSERT INTO buying_journey_events
      (event_id, session_id, page_id, guide_path, version, stage, product_id, placement, source, medium, country, device, elapsed_ms, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`).bind(
      p.eventId, p.sessionId, p.pageId, p.guidePath, p.version, p.stage, p.productId, p.placement, p.source, p.medium, country, p.device, p.elapsedMs, new Date().toISOString()).run();
  } catch { return json(503, 'Collector unavailable.'); }
  return new Response(null, { status: 204, headers });
}
export function onRequest() { return new Response('Method not allowed', { status: 405, headers: { ...headers, Allow: 'POST' } }); }
