import crypto from "node:crypto";
import Otp from "../models/Otp.js";
import { env } from "../config/env.js";
import { ApiError } from "./ApiError.js";

export const OTP_TTL_MINUTES = 10;
const OTP_TTL_MS = OTP_TTL_MINUTES * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000; // one code per minute...
const MAX_SENDS_PER_HOUR = 5; // ...and five per hour
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5; // wrong guesses before the code is burned

const generateCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

// HMAC with a server-side secret: a leaked database alone can't be used to brute-force the 6 digits.
const hashCode = (userId, purpose, code) =>
  crypto.createHmac("sha256", `${env.JWT_SECRET}:otp`).update(`${userId}:${purpose}:${code}`).digest("hex");

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// One message for every failure, so responses never reveal whether an email is registered.
export const invalidCode = () => new ApiError(400, "Invalid or expired code", undefined, "OTP_INVALID");

export const isOtpThrottle = (err) => err instanceof ApiError && String(err.code).startsWith("OTP_");

const cooldown = () => new ApiError(429, "Please wait a minute before requesting another code", undefined, "OTP_COOLDOWN");
const limit = () => new ApiError(429, "Too many codes requested. Please try again later.", undefined, "OTP_LIMIT");

// Creates (or replaces) the user's code and returns it so the caller can email it.
export async function issueOtp(user, purpose) {
  const now = new Date();
  const code = generateCode();
  const codeHash = hashCode(user._id, purpose, code);
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  // Atomic "replace if allowed": matches only when the cooldown has passed and the hourly cap isn't hit.
  const replaced = await Otp.findOneAndUpdate(
    {
      user: user._id,
      purpose,
      lastSentAt: { $lte: new Date(now.getTime() - RESEND_COOLDOWN_MS) },
      sendCount: { $lt: MAX_SENDS_PER_HOUR },
    },
    { $set: { codeHash, expiresAt, attempts: 0, lastSentAt: now }, $inc: { sendCount: 1 } },
    { new: true }
  );
  if (replaced) return code;

  const existing = await Otp.findOne({ user: user._id, purpose });
  if (existing) throw existing.sendCount >= MAX_SENDS_PER_HOUR ? limit() : cooldown();

  try {
    await Otp.create({
      user: user._id,
      purpose,
      codeHash,
      expiresAt,
      lastSentAt: now,
      purgeAt: new Date(now.getTime() + SEND_WINDOW_MS),
    });
  } catch (err) {
    if (err.code === 11000) throw cooldown(); // two requests raced; the other one won
    throw err;
  }
  return code;
}

// Checks a submitted code. The attempt counter is bumped atomically BEFORE comparing, so parallel
// guesses can't sneak past the limit. Success deletes the code (single use).
export async function consumeOtp(userId, purpose, submitted) {
  const doc = await Otp.findOneAndUpdate(
    { user: userId, purpose, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true }
  );
  if (!doc) throw invalidCode();

  if (!safeEqual(doc.codeHash, hashCode(userId, purpose, submitted))) {
    const left = MAX_ATTEMPTS - doc.attempts;
    throw new ApiError(
      400,
      left > 0
        ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
        : "Too many incorrect attempts. Please request a new code.",
      undefined,
      "OTP_INVALID"
    );
  }
  await Otp.deleteOne({ _id: doc._id });
}

export const discardOtp = (userId, purpose) => Otp.deleteOne({ user: userId, purpose });
export const discardAllOtps = (userId) => Otp.deleteMany({ user: userId });
