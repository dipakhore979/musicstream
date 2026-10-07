import rateLimit from "express-rate-limit";
import { isProd } from "../config/env.js";

// Slows down password guessing. Successful requests don't count against the limit.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 15 : 100,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again in a few minutes." },
});

const json429 = (message) => ({ success: false, message });

// Search runs several queries per request, so it gets its own budget.
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json429("You're searching too fast, please slow down."),
});

// Stops anyone inflating play counts by looping the play endpoint.
export const playLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json429("Too many requests, please slow down."),
});

// Uploads cost bandwidth and Cloudinary storage, so cap them per IP.
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isProd ? 60 : 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json429("Upload limit reached, please try again later."),
});
