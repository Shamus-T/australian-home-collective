import nodemailer from "nodemailer";
import tls from "node:tls";

function getSocket(_options, callback) {
  // Let the Workers runtime resolve the hostname; passing Nodemailer's resolved
  // IP to its TCP proxy can fail even when hostname-based TLS connects correctly.
  let settled = false;
  const socket = tls.connect({
    host: "ventraip.email", port: 465,
    servername: "ventraip.email", rejectUnauthorized: true,
  });
  const timer = setTimeout(() => {
    socket.destroy(Object.assign(new Error("SMTP connection timed out"), { code: "ETIMEDOUT" }));
  }, 10000);
  const finish = (error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    socket.removeListener("error", finish);
    socket.removeListener("secureConnect", connected);
    callback(error, error ? undefined : { connection: socket, secured: true });
  };
  const connected = () => finish(null);
  socket.once("error", finish);
  socket.once("secureConnect", connected);
}

// The host and recipient are controlled by the server, never by the submitted form.
export async function sendViaVentraIp({ env, name, email, enquiryType, message }) {
  const from = env.CONTACT_FROM_EMAIL.trim();
  const to = env.CONTACT_VERIFIED_DESTINATION_EMAIL.trim();
  const transport = nodemailer.createTransport({
    host: "ventraip.email",
    port: 465,
    secure: true,
    getSocket,
    auth: { user: from, pass: env.CONTACT_SMTP_PASSWORD },
    tls: { servername: "ventraip.email", rejectUnauthorized: true },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });

  try {
    const result = await transport.sendMail({
      from: { address: from, name: "Australian Home Collective website" },
      to,
      replyTo: { address: email, name },
      subject: `[Contact] ${enquiryType} — ${name}`,
      text: [
        "New Australian Home Collective contact enquiry",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Enquiry type: ${enquiryType}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    });
    return (result.accepted ?? []).some(
      (address) => typeof address === "string" && address.toLowerCase() === to.toLowerCase(),
    );
  } catch (error) {
    // SMTP errors can contain addresses, credentials or submitted text. Log only codes.
    console.error("VentraIP did not accept the contact email.", {
      code: /^[A-Z0-9_]{1,32}$/.test(error?.code ?? "") ? error.code : "SMTP_ERROR",
      responseCode: Number.isInteger(error?.responseCode) ? error.responseCode : null,
    });
    return false;
  } finally {
    transport.close();
  }
}
