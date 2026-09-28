import assert from "node:assert/strict";
import test from "node:test";
import nodemailer from "nodemailer";

import { onRequest, onRequestPost } from "../functions/api/contact.js";

const env = {
  TURNSTILE_SECRET_KEY: "turnstile-secret",
  CLOUDFLARE_ACCOUNT_ID: "account-id",
  CLOUDFLARE_EMAIL_API_TOKEN: "email-token",
  CONTACT_VERIFIED_DESTINATION_EMAIL: "verified-destination@example.net",
  CONTACT_FROM_EMAIL: "contact@australianhomecollective.com.au",
};

test("SMTP sends only to the configured inbox with visitor Reply-To and verified TLS", async (t) => {
  const smtpEnv = { ...env, CONTACT_SMTP_PASSWORD: "test-secret" };
  delete smtpEnv.CLOUDFLARE_ACCOUNT_ID;
  delete smtpEnv.CLOUDFLARE_EMAIL_API_TOKEN;
  let options, email, closed = false;
  t.mock.method(nodemailer, "createTransport", (configuration) => {
    options = configuration;
    return {
      sendMail: async (message) => {
        email = message;
        return { accepted: [smtpEnv.CONTACT_VERIFIED_DESTINATION_EMAIL] };
      },
      close: () => { closed = true; },
    };
  });
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.match(String(url), /turnstile\/v0\/siteverify$/);
    return Response.json({ success: true, action: "contact", hostname: "australianhomecollective.com.au" });
  });
  const response = await onRequestPost({ request: contactRequest({ to: "attacker@example.net" }), env: smtpEnv });
  assert.equal(response.status, 200);
  assert.equal(email.to, smtpEnv.CONTACT_VERIFIED_DESTINATION_EMAIL);
  assert.equal(email.from.address, smtpEnv.CONTACT_FROM_EMAIL);
  assert.deepEqual(email.replyTo, { address: "taylor@example.net", name: "Taylor Example" });
  assert.equal(options.host, "ventraip.email");
  assert.equal(options.port, 465);
  assert.equal(options.secure, true);
  assert.equal(options.tls.rejectUnauthorized, true);
  assert.equal(options.auth.user, smtpEnv.CONTACT_FROM_EMAIL);
  assert.equal(options.auth.pass, "test-secret");
  assert.equal(closed, true);
});

test("SMTP rejection is a visible failure and does not leak the password or message into logs", async (t) => {
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  t.mock.method(nodemailer, "createTransport", () => ({
    sendMail: async () => { throw Object.assign(new Error("test-secret private enquiry"), { code: "EAUTH", responseCode: 535 }); },
    close() {},
  }));
  t.mock.method(globalThis, "fetch", async () => Response.json({ success: true, action: "contact", hostname: "australianhomecollective.com.au" }));
  const response = await onRequestPost({ request: contactRequest(), env: { ...env, CONTACT_SMTP_PASSWORD: "test-secret" } });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).success, false);
  assert.match(JSON.stringify(logs), /EAUTH/);
  assert.doesNotMatch(JSON.stringify(logs), /test-secret|private enquiry/);
});

test("SMTP success requires acceptance of the intended recipient", async (t) => {
  t.mock.method(nodemailer, "createTransport", () => ({
    sendMail: async () => ({ accepted: ["someone-else@example.net"] }),
    close() {},
  }));
  t.mock.method(globalThis, "fetch", async () => Response.json({ success: true, action: "contact", hostname: "australianhomecollective.com.au" }));
  const response = await onRequestPost({ request: contactRequest(), env: { ...env, CONTACT_SMTP_PASSWORD: "test-secret" } });
  assert.equal(response.status, 502);
});

function contactRequest(overrides = {}) {
  const formData = new FormData();
  formData.set("name", "Taylor Example");
  formData.set("email", "taylor@example.net");
  formData.set("enquiry_type", "Guide suggestion");
  formData.set("message", "Please publish a guide about compact entryway storage.");
  formData.set("cf-turnstile-response", "valid-token");

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return new Request("https://australianhomecollective.com.au/api/contact", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Origin: "https://australianhomecollective.com.au",
    },
    body: formData,
  });
}

test("rejects cross-origin submissions", async () => {
  const request = contactRequest();
  request.headers.set("Origin", "https://example.net");

  const response = await onRequestPost({ request, env });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).success, false);
});

test("requires the Cloudflare production configuration", async () => {
  const response = await onRequestPost({ request: contactRequest(), env: {} });

  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /temporarily unavailable/i);
});

test("requires a valid Turnstile token", async (t) => {
  let emailApiCalled = false;
  t.mock.method(globalThis, "fetch", async (input) => {
    if (String(input).includes("siteverify")) {
      return Response.json({
        success: false,
        action: "contact",
        hostname: "australianhomecollective.com.au",
      });
    }
    emailApiCalled = true;
    return Response.json({ success: true });
  });

  const response = await onRequestPost({ request: contactRequest(), env });

  assert.equal(response.status, 400);
  assert.equal(emailApiCalled, false);
});

test("rejects invalid contact details before verifying Turnstile", async (t) => {
  let fetchCalled = false;
  t.mock.method(globalThis, "fetch", async () => {
    fetchCalled = true;
    return Response.json({ success: true });
  });

  const response = await onRequestPost({
    request: contactRequest({ email: "bad\r\nbcc@example.net" }),
    env,
  });
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.equal(result.success, false);
  assert.equal(fetchCalled, false);
});

test("verifies Turnstile and sends the enquiry through Cloudflare Email Service", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (input, init) => {
    requests.push({ input: String(input), init });

    if (String(input).includes("siteverify")) {
      return Response.json({
        success: true,
        action: "contact",
        hostname: "australianhomecollective.com.au",
      });
    }

    return Response.json({
      success: true,
      result: {
        delivered: [env.CONTACT_VERIFIED_DESTINATION_EMAIL],
        queued: [],
        permanent_bounces: [],
      },
    });
  });

  const response = await onRequestPost({ request: contactRequest(), env });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.equal(requests.length, 2);
  assert.match(requests[1].input, /accounts\/account-id\/email\/sending\/send$/);

  const email = JSON.parse(requests[1].init.body);
  assert.equal(email.to, env.CONTACT_VERIFIED_DESTINATION_EMAIL);
  assert.equal(email.from.address, env.CONTACT_FROM_EMAIL);
  assert.deepEqual(email.reply_to, {
    address: "taylor@example.net",
    name: "Taylor Example",
  });
  assert.match(email.text, /compact entryway storage/);
});

test("ignores browser-supplied recipients and sends only to the verified destination", async (t) => {
  const emailBodies = [];
  t.mock.method(globalThis, "fetch", async (input, init) => {
    if (String(input).includes("siteverify")) {
      return Response.json({
        success: true,
        action: "contact",
        hostname: "australianhomecollective.com.au",
      });
    }

    emailBodies.push(JSON.parse(init.body));
    return Response.json({
      success: true,
      result: {
        delivered: [env.CONTACT_VERIFIED_DESTINATION_EMAIL],
        queued: [],
        permanent_bounces: [],
      },
    });
  });

  const response = await onRequestPost({
    request: contactRequest({
      to: "attacker@example.com",
      cc: "attacker@example.com",
      bcc: "attacker@example.com",
      CONTACT_VERIFIED_DESTINATION_EMAIL: "attacker@example.com",
    }),
    env,
  });

  assert.equal(response.status, 200);
  assert.equal(emailBodies.length, 1);
  assert.equal(emailBodies[0].to, env.CONTACT_VERIFIED_DESTINATION_EMAIL);
  assert.equal(emailBodies[0].cc, undefined);
  assert.equal(emailBodies[0].bcc, undefined);
});

test("keeps email-provider errors private", async (t) => {
  t.mock.method(globalThis, "fetch", async (input) => {
    if (String(input).includes("siteverify")) {
      return Response.json({
        success: true,
        action: "contact",
        hostname: "australianhomecollective.com.au",
      });
    }

    return Response.json(
      {
        success: false,
        errors: [
          {
            code: 10102,
            message: "email.sending.error.authentication.forbidden",
          },
        ],
        result: null,
      },
      { status: 403 },
    );
  });

  const response = await onRequestPost({ request: contactRequest(), env });
  const result = await response.json();

  assert.equal(response.status, 502);
  assert.equal(result.success, false);
  assert.equal(result.message, "We could not send your message. Please email contact@australianhomecollective.com.au directly.");
  assert.doesNotMatch(JSON.stringify(result), /forbidden|10102|authentication/i);
});

test("returns a method-not-allowed response for non-POST requests", async () => {
  const response = onRequest();

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST");
});
