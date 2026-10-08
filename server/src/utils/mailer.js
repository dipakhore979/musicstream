import { env } from "../config/env.js";

// "MusicStream <no-reply@example.com>" -> { name, email }
function parseFrom(from) {
  const match = /^(.*)<([^>]+)>\s*$/.exec(from);
  return match
    ? { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() }
    : { name: "", email: from.trim() };
}

async function postJson(url, headers, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email provider responded ${res.status}: ${detail.slice(0, 200)}`);
  }
}

let smtpTransport;
async function sendViaSmtp(msg) {
  if (!smtpTransport) {
    let nodemailer;
    try {
      ({ default: nodemailer } = await import("nodemailer"));
    } catch {
      throw new Error('SMTP needs the "nodemailer" package. Run: npm install nodemailer --prefix server');
    }
    smtpTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  await smtpTransport.sendMail({ from: env.EMAIL_FROM, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
}

// Sends one email through whichever provider EMAIL_PROVIDER selects. Throws if delivery fails.
export async function sendMail(msg) {
  switch (env.EMAIL_PROVIDER) {
    case "console":
      // Development helper: the email (including the code) appears in the server terminal.
      console.log(`\n========== EMAIL (console provider) ==========\nTo: ${msg.to}\nSubject: ${msg.subject}\n\n${msg.text}\n==============================================\n`);
      return;
    case "smtp":
      return sendViaSmtp(msg);
    case "brevo": {
      const from = parseFrom(env.EMAIL_FROM);
      return postJson(
        "https://api.brevo.com/v3/smtp/email",
        { "api-key": env.BREVO_API_KEY },
        {
          sender: { name: from.name || "MusicStream", email: from.email },
          to: [{ email: msg.to }],
          subject: msg.subject,
          htmlContent: msg.html,
          textContent: msg.text,
        }
      );
    }
    case "resend":
      return postJson(
        "https://api.resend.com/emails",
        { Authorization: `Bearer ${env.RESEND_API_KEY}` },
        { from: env.EMAIL_FROM, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }
      );
    default:
      throw new Error(`Unknown EMAIL_PROVIDER: ${env.EMAIL_PROVIDER}`);
  }
}
