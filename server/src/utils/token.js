import jwt from "jsonwebtoken";
import { env, isProd } from "../config/env.js";

export const AUTH_COOKIE = "token";

const UNIT_MS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

function durationToMs(value) {
  const match = /^(\d+)([smhd])$/.exec(value);
  return Number(match[1]) * UNIT_MS[match[2]];
}

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
}

// In production the frontend (Vercel) and API (Render) are on different sites, so the cookie
// must be SameSite=None; Secure. In development both go through the Vite proxy, so Lax is fine.
const baseCookieOptions = {
  httpOnly: true, // JavaScript can't read it, which blunts XSS token theft
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, { ...baseCookieOptions, maxAge: durationToMs(env.JWT_EXPIRES_IN) });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, baseCookieOptions);
}
