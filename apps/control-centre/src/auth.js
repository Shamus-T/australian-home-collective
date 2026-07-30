const encoder = new TextEncoder();
const jwksMemoryCache = new Map();
const JWKS_TTL_MS = 60 * 60 * 1000;

export class AccessConfigurationError extends Error {}
export class AccessAuthorisationError extends Error {}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJsonPart(value) {
  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
  } catch {
    throw new AccessAuthorisationError("The Access token is malformed.");
  }
}

function normaliseTeamDomain(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.includes("REPLACE_WITH")) {
    throw new AccessConfigurationError("ACCESS_TEAM_DOMAIN is not configured.");
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new AccessConfigurationError("ACCESS_TEAM_DOMAIN is not valid.");
  }

  if (url.protocol !== "https:" || !url.hostname.endsWith(".cloudflareaccess.com")) {
    throw new AccessConfigurationError("ACCESS_TEAM_DOMAIN must be a Cloudflare Access team domain.");
  }

  return url.origin;
}

function configuredAudience(value) {
  const audience = typeof value === "string" ? value.trim() : "";
  if (!audience || audience.includes("REPLACE_WITH")) {
    throw new AccessConfigurationError("ACCESS_AUD is not configured.");
  }
  return audience;
}

function audienceMatches(tokenAudience, expectedAudience) {
  return Array.isArray(tokenAudience)
    ? tokenAudience.includes(expectedAudience)
    : tokenAudience === expectedAudience;
}

async function fetchJwks(teamOrigin, fetchImpl) {
  const cached = jwksMemoryCache.get(teamOrigin);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const response = await fetchImpl(`${teamOrigin}/cdn-cgi/access/certs`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new AccessAuthorisationError(`Unable to load Access signing keys (${response.status}).`);
  }

  const value = await response.json();
  if (!Array.isArray(value?.keys)) {
    throw new AccessAuthorisationError("Access signing keys were not valid.");
  }

  jwksMemoryCache.set(teamOrigin, { value, expiresAt: Date.now() + JWKS_TTL_MS });
  return value;
}

async function verifySignature(token, header, teamOrigin, fetchImpl) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  const jwks = await fetchJwks(teamOrigin, fetchImpl);
  const jwk = jwks.keys.find((candidate) => candidate.kid === header.kid);
  if (!jwk) {
    jwksMemoryCache.delete(teamOrigin);
    const refreshed = await fetchJwks(teamOrigin, fetchImpl);
    const refreshedJwk = refreshed.keys.find((candidate) => candidate.kid === header.kid);
    if (!refreshedJwk) throw new AccessAuthorisationError("The Access signing key was not found.");
    return verifyWithJwk(refreshedJwk);
  }

  return verifyWithJwk(jwk);

  async function verifyWithJwk(selectedJwk) {
    const key = await crypto.subtle.importKey(
      "jwk",
      selectedJwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const verified = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      base64UrlToBytes(encodedSignature),
      encoder.encode(`${encodedHeader}.${encodedPayload}`),
    );
    if (!verified) throw new AccessAuthorisationError("The Access token signature was not valid.");
  }
}

export async function authoriseRequest(request, env, { fetchImpl = fetch, now = Date.now() } = {}) {
  const bypass = typeof env.DEV_BYPASS_TOKEN === "string" ? env.DEV_BYPASS_TOKEN.trim() : "";
  if (bypass && request.headers.get("X-AHC-Dev-Token") === bypass) {
    return { sub: "local-development", email: "local@development.invalid", dev: true };
  }

  const teamOrigin = normaliseTeamDomain(env.ACCESS_TEAM_DOMAIN);
  const expectedAudience = configuredAudience(env.ACCESS_AUD);
  const token = request.headers.get("Cf-Access-Jwt-Assertion")?.trim() ?? "";
  if (!token) throw new AccessAuthorisationError("Cloudflare Access authentication is required.");

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new AccessAuthorisationError("The Access token is malformed.");
  }

  const header = decodeJsonPart(parts[0]);
  const payload = decodeJsonPart(parts[1]);
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    throw new AccessAuthorisationError("The Access token algorithm was not accepted.");
  }

  await verifySignature(token, header, teamOrigin, fetchImpl);

  const nowSeconds = Math.floor(now / 1000);
  if (payload.iss !== teamOrigin) throw new AccessAuthorisationError("The Access token issuer was not valid.");
  if (!audienceMatches(payload.aud, expectedAudience)) {
    throw new AccessAuthorisationError("The Access token audience was not valid.");
  }
  if (!Number.isFinite(payload.exp) || payload.exp <= nowSeconds) {
    throw new AccessAuthorisationError("The Access token has expired.");
  }
  if (Number.isFinite(payload.nbf) && payload.nbf > nowSeconds + 30) {
    throw new AccessAuthorisationError("The Access token is not active yet.");
  }

  return payload;
}

export const __test = {
  audienceMatches,
  base64UrlToBytes,
  decodeJsonPart,
  normaliseTeamDomain,
  configuredAudience,
  clearJwksCache() {
    jwksMemoryCache.clear();
  },
};
