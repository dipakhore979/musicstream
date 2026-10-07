import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AUTH_COOKIE, verifyToken } from "../utils/token.js";

function extractToken(req) {
  if (req.cookies?.[AUTH_COOKIE]) return req.cookies[AUTH_COOKIE];
  const header = req.headers.authorization;
  // The Bearer fallback makes the API easy to test with curl/Postman.
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

// Requires a valid session and attaches the fresh user document to req.user.
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized("Please log in to continue");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized("Your session has expired, please log in again");
  }

  // Loading the user on every request means deleted accounts and role changes take effect immediately.
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized("This account no longer exists");

  req.user = user;
  next();
});

// Usage: router.post("/", protect, restrictTo("admin"), handler)
export const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You don't have permission to do that"));
    }
    next();
  };
