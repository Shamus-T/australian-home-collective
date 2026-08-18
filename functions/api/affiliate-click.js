const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const DEVICE_TYPES = new Set(["desktop", "mobile", "tablet", "unknown"]);
const AFFILIATE_NETWORKS = new Set(["amazon-australia", "commission-factory", "direct", "other"]);
const AMAZON_AU_HOSTS = new Set(["amazon.com.au", "www.amazon.com.au"]);
const MAX_BODY_BYTES = 4096;

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function normaliseText(value, maximumLength) {
  if (typeof value !== "string") return "";
  const normalised = value.trim().replace(/\s+/gu, " ");
  return normalised.length <= maximumLength ? normalised : "";
}

function normaliseGuidePath(value) {
  const path = normaliseText(value, 500);
  return /^\/guides\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(path) ? path : "";
}

function normaliseProductId(value) {
  const productId = normaliseText(value, 120).toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productId) ? productId : "";
}

function normaliseEventId(value) {
  const eventId = normaliseText(value, 36).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(eventId)
    ? eventId
    : "";
}

function normaliseSessionId(value) {
  const sessionId = normaliseText(value, 80);
  return /^[A-Za-z0-9_-]{8,80}$/.test(sessionId) ? sessionId : "";
}

function normaliseHost(value) {
  const host = normaliseText(value, 253).toLowerCase();
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) {
    return "";
  }
  return host;
}

function validateEvent(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "The affiliate click event was not valid." };
  }

  const eventId = normaliseEventId(payload.eventId);
  const guidePath = normaliseGuidePath(payload.guidePath);
  const productId = normaliseProductId(payload.productId);
  const productName = normaliseText(payload.productName, 200);
  const affiliateNetwork = normaliseText(payload.affiliateNetwork, 80).toLowerCase();
  const merchant = normaliseText(payload.merchant, 120);
  const destinationHost = normaliseHost(payload.destinationHost);
  const sessionId = normaliseSessionId(payload.sessionId);
  const device = DEVICE_TYPES.has(payload.device) ? payload.device : "unknown";

  if (!eventId || !guidePath || !productId || !productName || !merchant || !destinationHost) {
    return { error: "The affiliate click event was not valid." };
  }
  if (!AFFILIATE_NETWORKS.has(affiliateNetwork)) {
    return { error: "The affiliate network was not valid." };
  }
  if (affiliateNetwork === "amazon-australia" && !AMAZON_AU_HOSTS.has(destinationHost)) {
    return { error: "The affiliate destination was not valid." };
  }

  return {
    event: {
      eventId,
      guidePath,
      productId,
      productName,
      affiliateNetwork,
      merchant,
      destinationHost,
      sessionId: sessionId || null,
      device,
    },
  };
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

async function readJson(request) {
  const contentLength = Number.parseInt(request.headers.get("Content-Length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new RangeError("Request body too large.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new RangeError("Request body too large.");
  }
  return JSON.parse(text);
}

async function insertEvent(database, event, occurredAt) {
  await database
    .prepare(
      `INSERT INTO affiliate_clicks (
        event_id,
        guide_path,
        product_id,
        product_name,
        affiliate_network,
        merchant,
        destination_host,
        session_id,
        device,
        occurred_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (event_id) DO NOTHING`,
    )
    .bind(
      event.eventId,
      event.guidePath,
      event.productId,
      event.productName,
      event.affiliateNetwork,
      event.merchant,
      event.destinationHost,
      event.sessionId,
      event.device,
      occurredAt,
    )
    .run();
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) {
    return json(403, { success: false, message: "This affiliate click event was not accepted." });
  }
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json(415, { success: false, message: "JSON is required." });
  }

  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    return json(error instanceof RangeError ? 413 : 400, {
      success: false,
      message: "The affiliate click event was not valid.",
    });
  }

  const { event, error } = validateEvent(payload);
  if (error) return json(400, { success: false, message: error });

  const database = env.AHC_ANALYTICS_DB;
  if (!database?.prepare) {
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }

  try {
    await insertEvent(database, event, new Date().toISOString());
  } catch (error) {
    console.error("AHC affiliate click insert failed.", {
      message: error instanceof Error ? error.message : "Unknown D1 error.",
    });
    return json(503, { success: false, message: "Analytics is temporarily unavailable." });
  }

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

export function onRequest() {
  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}

export const __test = {
  normaliseEventId,
  normaliseGuidePath,
  normaliseHost,
  normaliseProductId,
  normaliseSessionId,
  validateEvent,
};
