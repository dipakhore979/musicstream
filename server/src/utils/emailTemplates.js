import { OTP_TTL_MINUTES } from "./otp.js";
import { sendMail } from "./mailer.js";

// Names are user-controlled, so escape them before putting them in HTML.
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function layout(innerHtml) {
  return `<div style="background:#000;padding:24px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#121212;border-radius:12px;padding:32px;color:#fff">
    <div style="font-size:20px;font-weight:bold;margin-bottom:24px"><span style="color:#fff">Music</span><span style="color:#1db954">Stream</span></div>
    ${innerHtml}
    <p style="color:#6a6a6a;font-size:12px;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>`;
}

function otpEmail({ name, code, purpose }) {
  const first = name.split(" ")[0];
  const reset = purpose === "reset_password";
  const subject = reset ? "Reset your MusicStream password" : "Your MusicStream verification code";
  const intro = reset
    ? "We received a request to reset your password. Enter this code to continue:"
    : "Welcome to MusicStream! Enter this code to verify your email address:";

  const text = `Hi ${first},\n\n${intro}\n\n${code}\n\nThis code expires in ${OTP_TTL_MINUTES} minutes. If you didn't request it, you can safely ignore this email.\n\n- MusicStream`;
  const html = layout(`
    <p style="margin:0 0 8px;font-size:16px">Hi ${escapeHtml(first)},</p>
    <p style="margin:0 0 24px;color:#b3b3b3;font-size:15px">${intro}</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:10px;background:#282828;border-radius:8px;padding:16px;text-align:center">${code}</div>
    <p style="margin:24px 0 0;color:#b3b3b3;font-size:14px">This code expires in ${OTP_TTL_MINUTES} minutes.</p>`);
  return { subject, text, html };
}

export const sendOtpEmail = ({ user, code, purpose }) =>
  sendMail({ to: user.email, ...otpEmail({ name: user.name, code, purpose }) });

// Heads-up for the account owner, so a malicious reset doesn't go unnoticed.
export function sendPasswordChangedEmail(user) {
  const first = user.name.split(" ")[0];
  const text = `Hi ${first},\n\nThe password for your MusicStream account was just changed. If this was you, no action is needed. If it wasn't, reset your password straight away.\n\n- MusicStream`;
  const html = layout(`
    <p style="margin:0 0 8px;font-size:16px">Hi ${escapeHtml(first)},</p>
    <p style="margin:0;color:#b3b3b3;font-size:15px">The password for your MusicStream account was just changed. If this was you, no action is needed. If it wasn't, reset your password straight away.</p>`);
  return sendMail({ to: user.email, subject: "Your MusicStream password was changed", text, html });
}
