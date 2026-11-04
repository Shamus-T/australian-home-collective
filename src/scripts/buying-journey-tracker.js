import { shouldTrackAnalytics } from './analytics-preference.js';
import { ANALYTICS_SESSION_KEY } from './affiliate-click-tracker.js';
import { sendGoogleAnalyticsEvent } from './google-analytics.js';
import { JOURNEY_VERSION, JOURNEY_GUIDES, classifyJourneySource } from '../lib/buying-journey.mjs';

const SOURCE_KEY = 'ahc-journey-source-v1';
let activeJourney;
export function initialiseBuyingJourney({ windowObject = globalThis.window, documentObject = globalThis.document } = {}) {
  const w = windowObject, d = documentObject;
  if (!w || !d || !shouldTrackAnalytics(w)) return false;
  let sessionId, attribution;
  try {
    sessionId = w.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
    if (!sessionId) { sessionId = w.crypto.randomUUID(); w.sessionStorage.setItem(ANALYTICS_SESSION_KEY, sessionId); }
    const saved = JSON.parse(w.sessionStorage.getItem(SOURCE_KEY) || 'null');
    attribution = saved?.sessionId === sessionId ? saved.attribution : classifyJourneySource(w.location.href, d.referrer);
    w.sessionStorage.setItem(SOURCE_KEY, JSON.stringify({ sessionId, attribution }));
  } catch {
    // Storage-blocked page visits can still be measured, but cannot be joined across pages.
    sessionId = w.crypto.randomUUID(); attribution = classifyJourneySource(w.location.href, d.referrer);
  }
  const guidePath = w.location.pathname.replace(/\/?$/, '/');
  if (!JOURNEY_GUIDES[guidePath] || activeJourney) return false;
  const pageId = w.crypto.randomUUID(), started = w.performance.now(), sent = new Set();
  let visibleMs = 0, previous = started, wasVisible = d.visibilityState === 'visible';
  function record(stage, productId = '', placement = '', eventId = w.crypto.randomUUID()) {
    if (!shouldTrackAnalytics(w) || d.visibilityState !== 'visible') return false;
    const key = `${stage}:${productId}:${placement}`;
    if (sent.has(key)) return false;
    sent.add(key);
    const payload = { eventId, sessionId, pageId, guidePath, version: JOURNEY_VERSION, stage, productId, placement,
      source: attribution.source, medium: attribution.medium, elapsedMs: Math.round(w.performance.now() - started),
      device: w.matchMedia('(max-width: 767px)').matches ? 'mobile' : w.matchMedia('(max-width: 1023px)').matches ? 'tablet' : 'desktop' };
    const body = JSON.stringify(payload);
    try {
      if (!w.navigator.sendBeacon?.('/api/buying-journey', new Blob([body], { type: 'application/json' }))) {
        w.fetch('/api/buying-journey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, credentials: 'same-origin', keepalive: true }).catch(() => {});
      }
    } catch { /* Measurement must not interrupt the page or shopping links. */ }
    // Do not duplicate the existing affiliate_click GA4 event or send session/page IDs to GA4.
    if (stage !== 'retailer_click') sendGoogleAnalyticsEvent(`buying_${stage}`, { guide_path: guidePath, item_id: productId || undefined, journey_version: JOURNEY_VERSION }, w.gtag);
    return true;
  }
  function tick() {
    const now = w.performance.now();
    if (wasVisible) visibleMs += now - previous;
    previous = now; wasVisible = d.visibilityState === 'visible';
    record('guide_view');
    if (visibleMs >= 10000) record('engaged_10s');
  }
  record('guide_view');
  const interval = w.setInterval(tick, 1000);
  d.addEventListener('visibilitychange', tick);
  const timers = new Map(), visible = new Set();
  let observer;
  if (w.IntersectionObserver) {
    observer = new w.IntersectionObserver(entries => {
      for (const entry of entries) {
        const el = entry.target;
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) { visible.delete(el); w.clearTimeout(timers.get(el)); timers.delete(el); continue; }
        visible.add(el); watch(el);
      }
    }, { threshold: [0, 0.5] });
    function watch(el) {
      if (timers.has(el) || d.visibilityState !== 'visible') return;
      timers.set(el, w.setTimeout(() => {
        timers.delete(el);
        if (!visible.has(el) || d.visibilityState !== 'visible') return;
        const card = el.closest('[data-commercial-product-card]');
        record(card ? 'product_view' : 'comparison_view', card ? card.id.replace(/^product-/, '') : '');
      }, 1000));
    }
    d.addEventListener('visibilitychange', () => {
      for (const timer of timers.values()) w.clearTimeout(timer);
      timers.clear();
      if (d.visibilityState === 'visible') for (const el of visible) watch(el);
    });
    // Observe short headings, not whole cards/tables which can exceed a mobile viewport.
    // A reader may jump directly to a later model. Each heading can establish
    // comparison exposure; record() still deduplicates it once per page.
    for (const el of d.querySelectorAll('[data-commercial-product-block] .commercial-product-comparison tbody tr th, [data-commercial-product-card] > h3')) observer.observe(el);
  }
  activeJourney = { record, guidePath };
  w.addEventListener('pageshow', event => { if (event.persisted) { previous = w.performance.now(); wasVisible = d.visibilityState === 'visible'; } });
  w.addEventListener('pagehide', event => { if (!event.persisted) { w.clearInterval(interval); for (const t of timers.values()) w.clearTimeout(t); observer?.disconnect(); } });
  return true;
}

export function recordBuyingJourneyClick(event, link) {
  if (!activeJourney || event.guidePath !== activeJourney.guidePath) return;
  const placement = link.dataset.commercialPlacement === 'stack' ? 'stack' : link.closest('.commercial-product-comparison') ? 'comparison' : link.closest('[data-commercial-product-card]') ? 'card' : 'other';
  activeJourney.record('retailer_click', event.productId, placement, event.eventId);
}
