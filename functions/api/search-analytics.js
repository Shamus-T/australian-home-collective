const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const EVENT_TYPES = new Set(["search", "result_click"]);
const DEVICE_TYPES = new Set(["desktop", "mobile", "tablet", "unknown"]);
const MAX_BODY_BYTES = 4096;
const MAX_QUERY_LENGTH = 120;
const MAX_PATH_LENGTH = 500;
const MAX_SESSION_ID_LENGTH = 80;

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function normaliseWhitespace(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normaliseQuery(value) {
  return normaliseWhitespace(value).toLowerCase().slice(0, MAX_QUERY_LENGTH);
}

function visibleQueryCharacterCount(value) {
  return [...normaliseQuery(value).replace(/\s/gu, "")].length;
}

function normalisePath(value, { selected = false } = {}) {
  if (typeof value !== "string") return "";

  let parsed;
  try {
    parsed = new URL(value, "https://australianhomecollective.com.au");
  } catch {
    return "";
  }

  if (parsed.origin !== "https://australianhomecollective.com.au") return "";

  const pathname = parsed.pathname.slice(0, MAX_PATH_LENGTH);
  if (!pathname.startsWith("/")) return "";
  if (selected && !/^\/(?:guides|categories|seasonal)\//.test(pathname)) return "";

  return pathname;
}

function normaliseSessionId(value) {
  const sessionId = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z0-9_-]{8,80}$/.test(sessionId)
    ? sessionId.slice(0, MAX_SESSION_ID_LENGTH)
    : "";
}

function normaliseDevice(value) {
  return DEVICE_TYPES.has(value) ? value : "unknown";
}

function validateEvent(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "The analytics event was not valid." };
  }

  const eventType = typeof payload.eventType === "string" ? payload.eventType : "";
  const query = normaliseQuery(payload.query);
  const originPath = normalisePath(payload.originPath) || "/search/";
  const selectedPath = payload.selectedPath
    ? normalisePath(payload.selectedPath, { selected: true })
    : "";
  const sessionId = normaliseSessionId(payload.sessionId);
  const device = normaliseDevice(payload.device);
  const resultCount = Number.isInteger(payload.resultCount)
    ? payload.resultCount
    : Number.parseInt(payload.resultCount, 10);

  if (!EVENT_TYPES.has(eventType)) {
    return { error: "The analytics event type was not valid." };
  }
  if (visibleQueryCharacterCount(query) < 3 || query.length > MAX_QUERY_LENGTH) {
    return { error: "The search query was not valid." };
  }
  if (originPath !== "/search/") {
    return { error: "The analytics origin path was not valid." };
  }
  if (eventType === "search" && (!Number.isInteger(resultCount) || resultCount < 0 || resultCount > 1000)) {
    return { error: "The result count was not valid." };
  }
  if (eventType === "result_click" && !selectedPath) {
    return { error: "The selected result path was not valid." };
  }

  return {
    event: {
      eventType,
      query,
      resultCount: eventType === "search" ? resultCount : null,
      originPath,
      selectedPath: eventType === "result_click" ? selectedPath : null,
      sessionId: sessionId || null,
      device,
    },
  };
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;

  const requestUrl = new URL(request.url);
  return origin === requestUrl.origin;
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
      `INSERT INTO search_events (
        event_type,
        query,
        result_count,
        origin_path,
        selected_path,
        session_id,
        device,
        occurred_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      event.eventType,
      event.query,
      event.resultCount,
      event.originPath,
      event.selectedPath,
      event.sessionId,
      event.device,
      occurredAt,
    )
    .run();
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) {
    return json(403, { success: false, message: "This analytics event was not accepted." });
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json(415, { success: false, message: "JSON is required." });
  }

  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 400;
    return json(status, { success: false, message: "The analytics event was not valid." });
  }

  const { event, error } = validateEvent(payload);
  if (error) {
    return json(400, { success: false, message: error });
  }

  const database = env.AHC_ANALYTICS_DB;
  if (!database?.prepare) {
    // Search must remain fully functional before the optional D1 binding is configured.
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }

  try {
    await insertEvent(database, event, new Date().toISOString());
  } catch (error) {
    console.error("AHC search analytics insert failed.", {
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
  normaliseQuery,
  normalisePath,
  normaliseSessionId,
  visibleQueryCharacterCount,
  validateEvent,
};
