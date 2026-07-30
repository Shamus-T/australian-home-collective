import {
  AccessAuthorisationError,
  AccessConfigurationError,
  authoriseRequest,
} from "./auth.js";
import {
  DatabaseConfigurationError,
  importManualDaily,
  loadOverview,
  requireDatabase,
} from "./db.js";
import { integrationConfiguration, syncAll } from "./sync.js";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const MAX_JSON_BYTES = 1_000_000;

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function errorResponse(error) {
  if (error instanceof AccessConfigurationError || error instanceof DatabaseConfigurationError) {
    console.error(error.message);
    return json(503, { success: false, message: "The Control Centre is not fully configured." });
  }
  if (error instanceof AccessAuthorisationError) {
    return json(403, { success: false, message: "Cloudflare Access authentication is required." });
  }
  console.error("AHC Control Centre request failed.", error);
  return json(500, { success: false, message: "The Control Centre could not complete this request." });
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

async function readJson(request) {
  const declaredLength = Number.parseInt(request.headers.get("Content-Length") ?? "0", 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BYTES) {
    throw new RangeError("Request body too large.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BYTES) {
    throw new RangeError("Request body too large.");
  }
  return JSON.parse(text);
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function finiteNumber(value, { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
}

function validateManualRows(source, rows) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 1000) {
    throw new TypeError("The import must contain between 1 and 1,000 rows.");
  }

  return rows.map((row, index) => {
    if (!row || typeof row !== "object" || !validDate(row.date)) {
      throw new TypeError(`Row ${index + 1} has an invalid date.`);
    }

    if (source === "facebook") {
      const reach = finiteNumber(row.reach);
      const engagements = finiteNumber(row.engagements);
      const linkClicks = finiteNumber(row.linkClicks);
      const followers = finiteNumber(row.followers);
      if ([reach, engagements, linkClicks, followers].includes(null)) {
        throw new TypeError(`Facebook row ${index + 1} contains an invalid metric.`);
      }
      return { date: row.date, reach, engagements, linkClicks, followers };
    }

    if (source === "bing") {
      const clicks = finiteNumber(row.clicks);
      const impressions = finiteNumber(row.impressions);
      const ctr = finiteNumber(row.ctr, { maximum: 1 });
      const position = finiteNumber(row.position, { maximum: 1000 });
      if ([clicks, impressions, ctr, position].includes(null)) {
        throw new TypeError(`Bing row ${index + 1} contains an invalid metric.`);
      }
      return { date: row.date, clicks, impressions, ctr, position };
    }

    throw new TypeError("The import source was not recognised.");
  });
}

async function handleApi(request, env, claims) {
  const url = new URL(request.url);
  const database = requireDatabase(env);

  if (url.pathname === "/api/overview" && request.method === "GET") {
    const overview = await loadOverview(database, {
      days: url.searchParams.get("days"),
      integrations: integrationConfiguration(env),
    });
    return json(200, { success: true, viewer: { email: claims.email ?? null }, ...overview });
  }

  if (url.pathname === "/api/integrations" && request.method === "GET") {
    return json(200, { success: true, integrations: integrationConfiguration(env) });
  }

  if (url.pathname === "/api/sync" && request.method === "POST") {
    if (!sameOrigin(request)) return json(403, { success: false, message: "The sync request was not accepted." });
    const results = await syncAll(env);
    const failed = results.some((result) => result.status === "failed");
    return json(failed ? 207 : 200, { success: !failed, results });
  }

  if (url.pathname === "/api/import" && request.method === "POST") {
    if (!sameOrigin(request)) return json(403, { success: false, message: "The import request was not accepted." });
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
        message: "The import data was not valid.",
      });
    }

    const source = typeof payload?.source === "string" ? payload.source.trim().toLowerCase() : "";
    let rows;
    try {
      rows = validateManualRows(source, payload?.rows);
    } catch (error) {
      return json(400, { success: false, message: error instanceof Error ? error.message : "The import data was not valid." });
    }

    await importManualDaily(database, source, rows, new Date().toISOString());
    return json(200, { success: true, source, imported: rows.length });
  }

  if (url.pathname.startsWith("/api/")) {
    return json(404, { success: false, message: "API route not found." });
  }

  return null;
}

async function handleRequest(request, env) {
  const claims = await authoriseRequest(request, env);
  const apiResponse = await handleApi(request, env, claims);
  if (apiResponse) return apiResponse;

  const assetResponse = await env.ASSETS.fetch(request);
  const headers = new Headers(assetResponse.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; connect-src 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'; form-action 'self'");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  return new Response(assetResponse.body, { status: assetResponse.status, headers });
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      return errorResponse(error);
    }
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      syncAll(env, { now: new Date(controller.scheduledTime) }).then((results) => {
        const failed = results.filter((result) => result.status === "failed");
        if (failed.length) console.error("AHC Control Centre scheduled sync completed with failures.", failed);
      }),
    );
  },
};

export const __test = {
  finiteNumber,
  validDate,
  validateManualRows,
  sameOrigin,
};
