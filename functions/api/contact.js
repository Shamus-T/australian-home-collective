const ALLOWED_ENQUIRY_TYPES = new Set([
  "Correction to product or brand information",
  "Australian status label update",
  "Guide suggestion",
  "General website feedback",
  "Brand submission",
]);

const EXPECTED_TURNSTILE_ACTION = "contact";
const ACCEPTED_TURNSTILE_HOSTNAMES = new Set([
  "australianhomecollective.com.au",
  "www.australianhomecollective.com.au",
]);

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function wantsJson(request) {
  return request.headers.get("Accept")?.includes("application/json");
}

function respond(request, status, message, fragment) {
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ success: status < 400, message }), {
      status,
      headers: JSON_HEADERS,
    });
  }

  const location = new URL(`/contact/#${fragment}`, request.url);
  return Response.redirect(location, 303);
}

function value(formData, field) {
  const entry = formData.get(field);
  return typeof entry === "string" ? entry.trim() : "";
}

function isValidEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasSingleLineText(value) {
  return !/[\r\n\u0000-\u001f\u007f]/.test(value);
}

function validateSubmission({ name, email, enquiryType, message }) {
  if (name.length < 2 || name.length > 100 || !hasSingleLineText(name)) {
    return "Please enter a valid name.";
  }
  if (!isValidEmail(email) || !hasSingleLineText(email)) {
    return "Please enter a valid email address.";
  }
  if (!ALLOWED_ENQUIRY_TYPES.has(enquiryType)) {
    return "Please select a valid enquiry type.";
  }
  if (message.length < 10 || message.length > 5000) {
    return "Please enter a message between 10 and 5,000 characters.";
  }
  return null;
}

function requiredEmail(env, key) {
  const email = typeof env[key] === "string" ? env[key].trim() : "";
  return isValidEmail(email) && hasSingleLineText(email) ? email : "";
}

function normalizeHostname(hostname) {
  return typeof hostname === "string" ? hostname.trim().toLowerCase().replace(/\.$/, "") : "";
}

function isAcceptedTurnstileHostname(hostname, requestHostname) {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedRequestHostname = normalizeHostname(requestHostname);

  return (
    ACCEPTED_TURNSTILE_HOSTNAMES.has(normalizedHostname) ||
    (normalizedRequestHostname && normalizedHostname === normalizedRequestHostname)
  );
}

function turnstileFailureSummary(result, reason) {
  return {
    reason,
    errorCodes: Array.isArray(result?.["error-codes"]) ? result["error-codes"] : [],
    action: typeof result?.action === "string" ? result.action : null,
    hostname: typeof result?.hostname === "string" ? result.hostname : null,
  };
}

async function verifyTurnstile({ token, secret, remoteIp, expectedHostname }) {
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    return { success: false, reason: `siteverify-http-${response.status}`, result: null };
  }

  const result = await response.json();
  if (result.success !== true) {
    return { success: false, reason: "siteverify-rejected", result };
  }
  if (result.action !== EXPECTED_TURNSTILE_ACTION) {
    return { success: false, reason: "unexpected-action", result };
  }
  if (!isAcceptedTurnstileHostname(result.hostname, expectedHostname)) {
    return { success: false, reason: "unexpected-hostname", result };
  }

  return { success: true, reason: null, result };
}

async function sendEmail({ env, name, email, enquiryType, message }) {
  const destinationEmail = requiredEmail(env, "CONTACT_VERIFIED_DESTINATION_EMAIL");
  const fromEmail = requiredEmail(env, "CONTACT_FROM_EMAIL");
  const text = [
    "New Australian Home Collective contact enquiry",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Enquiry type: ${enquiryType}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/email/sending/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_EMAIL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: destinationEmail,
        from: {
          address: fromEmail,
          name: "Australian Home Collective website",
        },
        reply_to: { address: email, name },
        subject: `[Contact] ${enquiryType} — ${name}`,
        text,
      }),
    },
  );

  if (!response.ok) return false;

  const result = await response.json();
  return (
    result.success === true &&
    (result.result?.delivered?.includes(destinationEmail) ||
      result.result?.queued?.includes(destinationEmail))
  );
}

export async function onRequestPost({ request, env }) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");

  if (origin && origin !== requestUrl.origin) {
    return respond(request, 403, "This form submission was not accepted.", "contact-error");
  }

  const requiredConfiguration = [
    "TURNSTILE_SECRET_KEY",
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_EMAIL_API_TOKEN",
    "CONTACT_VERIFIED_DESTINATION_EMAIL",
    "CONTACT_FROM_EMAIL",
  ];

  if (
    requiredConfiguration.some((key) => !env[key]) ||
    !requiredEmail(env, "CONTACT_VERIFIED_DESTINATION_EMAIL") ||
    !requiredEmail(env, "CONTACT_FROM_EMAIL")
  ) {
    console.error("Contact form is missing required Cloudflare configuration.");
    return respond(
      request,
      503,
      "The contact form is temporarily unavailable. Please try again later.",
      "contact-error",
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return respond(request, 400, "The form submission was not valid.", "contact-error");
  }

  if (value(formData, "website")) {
    return respond(request, 200, "Thanks — your message has been sent.", "contact-sent");
  }

  const submission = {
    name: value(formData, "name"),
    email: value(formData, "email"),
    enquiryType: value(formData, "enquiry_type"),
    message: value(formData, "message"),
  };
  const validationError = validateSubmission(submission);

  if (validationError) {
    return respond(request, 400, validationError, "contact-error");
  }

  const turnstileToken = value(formData, "cf-turnstile-response");
  if (!turnstileToken) {
    return respond(
      request,
      400,
      "Please complete the verification check and try again.",
      "contact-error",
    );
  }

  let turnstileVerification = { success: false, reason: "not-verified", result: null };
  try {
    turnstileVerification = await verifyTurnstile({
      token: turnstileToken,
      secret: env.TURNSTILE_SECRET_KEY,
      remoteIp: request.headers.get("CF-Connecting-IP"),
      expectedHostname: requestUrl.hostname,
    });
  } catch (error) {
    console.error("Turnstile verification request failed.", {
      message: error instanceof Error ? error.message : "Unknown Turnstile verification error.",
    });
  }

  if (!turnstileVerification.success) {
    console.error(
      "Turnstile verification failed.",
      turnstileFailureSummary(turnstileVerification.result, turnstileVerification.reason),
    );
    return respond(
      request,
      400,
      "Verification failed. Please refresh the page and try again.",
      "contact-error",
    );
  }

  let emailSent = false;
  try {
    emailSent = await sendEmail({ env, ...submission });
  } catch (error) {
    console.error("Cloudflare Email Service request failed.", error);
  }

  if (!emailSent) {
    return respond(
      request,
      502,
      "We could not send your message. Please try again.",
      "contact-error",
    );
  }

  return respond(request, 200, "Thanks — your message has been sent.", "contact-sent");
}

export function onRequest() {
  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}
