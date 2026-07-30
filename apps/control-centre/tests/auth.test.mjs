import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";

import {
  AccessAuthorisationError,
  __test,
  authoriseRequest,
} from "../src/auth.js";

function base64Url(value) {
  return Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");
}

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicJwk = publicKey.export({ format: "jwk" });
publicJwk.kid = "test-key";
publicJwk.alg = "RS256";
publicJwk.use = "sig";

function token(payload) {
  const header = { alg: "RS256", typ: "JWT", kid: "test-key" };
  const unsigned = `${base64Url(header)}.${base64Url(payload)}`;
  return `${unsigned}.${sign("RSA-SHA256", Buffer.from(unsigned), privateKey).toString("base64url")}`;
}

const env = {
  ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
  ACCESS_AUD: "audience-tag",
};
const now = Date.parse("2026-07-30T10:00:00Z");

function request(jwt, headers = {}) {
  return new Request("https://dashboard.example.com/", {
    headers: jwt ? { "Cf-Access-Jwt-Assertion": jwt, ...headers } : headers,
  });
}

const fetchImpl = async () => Response.json({ keys: [publicJwk] });

test.beforeEach(() => __test.clearJwksCache());

test("validates a signed Cloudflare Access JWT", async () => {
  const claims = await authoriseRequest(request(token({
    iss: "https://team.cloudflareaccess.com",
    aud: ["audience-tag"],
    exp: Math.floor(now / 1000) + 600,
    email: "owner@example.com",
  })), env, { fetchImpl, now });

  assert.equal(claims.email, "owner@example.com");
});

test("rejects invalid audience and expired tokens", async () => {
  await assert.rejects(
    authoriseRequest(request(token({
      iss: "https://team.cloudflareaccess.com",
      aud: "wrong",
      exp: Math.floor(now / 1000) + 600,
    })), env, { fetchImpl, now }),
    AccessAuthorisationError,
  );

  __test.clearJwksCache();
  await assert.rejects(
    authoriseRequest(request(token({
      iss: "https://team.cloudflareaccess.com",
      aud: "audience-tag",
      exp: Math.floor(now / 1000) - 1,
    })), env, { fetchImpl, now }),
    /expired/i,
  );
});

test("supports an explicit local-development bypass only when configured", async () => {
  const claims = await authoriseRequest(
    request(null, { "X-AHC-Dev-Token": "local-secret" }),
    { ...env, DEV_BYPASS_TOKEN: "local-secret" },
    { fetchImpl, now },
  );
  assert.equal(claims.dev, true);
});
