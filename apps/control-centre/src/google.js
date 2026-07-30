const encoder = new TextEncoder();
const tokenCache = new Map();

export class GoogleConfigurationError extends Error {}
export class GoogleApiError extends Error {}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function stringToBase64Url(value) {
  return bytesToBase64Url(encoder.encode(value));
}

function pemToArrayBuffer(pem) {
  const body = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  if (!body) throw new GoogleConfigurationError("GOOGLE_PRIVATE_KEY is not valid.");
  try {
    const binary = atob(body);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer;
  } catch {
    throw new GoogleConfigurationError("GOOGLE_PRIVATE_KEY is not valid PKCS#8 data.");
  }
}

function googleConfiguration(env) {
  const email = typeof env.GOOGLE_SERVICE_ACCOUNT_EMAIL === "string"
    ? env.GOOGLE_SERVICE_ACCOUNT_EMAIL.trim()
    : "";
  const privateKey = typeof env.GOOGLE_PRIVATE_KEY === "string" ? env.GOOGLE_PRIVATE_KEY.trim() : "";
  if (!email || !email.includes("@") || !privateKey) {
    throw new GoogleConfigurationError("Google service-account credentials are not configured.");
  }
  return { email, privateKey };
}

async function signJwt(privateKey, claims) {
  const header = { alg: "RS256", typ: "JWT" };
  const unsigned = `${stringToBase64Url(JSON.stringify(header))}.${stringToBase64Url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(unsigned));
  return `${unsigned}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function getGoogleAccessToken(env, scopes, { fetchImpl = fetch, now = Date.now() } = {}) {
  const { email, privateKey } = googleConfiguration(env);
  const scope = [...new Set(scopes)].sort().join(" ");
  const cacheKey = `${email}:${scope}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > now + 60_000) return cached.token;

  const issuedAt = Math.floor(now / 1000);
  const assertion = await signJwt(privateKey, {
    iss: email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: issuedAt,
    exp: issuedAt + 3600,
  });

  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || typeof body?.access_token !== "string") {
    throw new GoogleApiError(`Google OAuth rejected the service account (${response.status}).`);
  }

  const expiresIn = Number(body.expires_in ?? 3600);
  tokenCache.set(cacheKey, {
    token: body.access_token,
    expiresAt: now + Math.max(300, expiresIn) * 1000,
  });
  return body.access_token;
}

async function googleJson(url, accessToken, init, fetchImpl) {
  const response = await fetchImpl(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ? `: ${String(body.error.message).slice(0, 300)}` : "";
    throw new GoogleApiError(`Google API request failed (${response.status})${message}`);
  }
  return body;
}

export async function querySearchConsole(env, requestBody, { fetchImpl = fetch } = {}) {
  const siteUrl = typeof env.SEARCH_CONSOLE_SITE_URL === "string"
    ? env.SEARCH_CONSOLE_SITE_URL.trim()
    : "";
  if (!siteUrl) throw new GoogleConfigurationError("SEARCH_CONSOLE_SITE_URL is not configured.");

  const token = await getGoogleAccessToken(
    env,
    ["https://www.googleapis.com/auth/webmasters.readonly"],
    { fetchImpl },
  );
  return googleJson(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    token,
    { method: "POST", body: JSON.stringify(requestBody) },
    fetchImpl,
  );
}

export async function runGa4Report(env, requestBody, { fetchImpl = fetch } = {}) {
  const propertyId = typeof env.GA4_PROPERTY_ID === "string" ? env.GA4_PROPERTY_ID.trim() : "";
  if (!/^\d+$/.test(propertyId)) throw new GoogleConfigurationError("GA4_PROPERTY_ID is not configured.");

  const token = await getGoogleAccessToken(
    env,
    ["https://www.googleapis.com/auth/analytics.readonly"],
    { fetchImpl },
  );
  return googleJson(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    token,
    { method: "POST", body: JSON.stringify(requestBody) },
    fetchImpl,
  );
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function parseSearchConsoleRows(response, dimensions) {
  return Array.isArray(response?.rows)
    ? response.rows.map((row) => {
        const record = {};
        dimensions.forEach((dimension, index) => {
          record[dimension] = row.keys?.[index] ?? "";
        });
        record.clicks = numeric(row.clicks);
        record.impressions = numeric(row.impressions);
        record.ctr = numeric(row.ctr);
        record.position = numeric(row.position);
        return record;
      })
    : [];
}

export function parseGa4Rows(response, dimensions, metrics) {
  return Array.isArray(response?.rows)
    ? response.rows.map((row) => {
        const record = {};
        dimensions.forEach((dimension, index) => {
          record[dimension] = row.dimensionValues?.[index]?.value ?? "";
        });
        metrics.forEach((metric, index) => {
          record[metric] = numeric(row.metricValues?.[index]?.value);
        });
        return record;
      })
    : [];
}

export const __test = {
  bytesToBase64Url,
  stringToBase64Url,
  pemToArrayBuffer,
  parseSearchConsoleRows,
  parseGa4Rows,
  clearTokenCache() {
    tokenCache.clear();
  },
};
