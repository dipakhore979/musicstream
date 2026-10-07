import { allowedOrigins } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/*
  CSRF defence for cookie authentication. In production the API and the frontend live on different
  sites, so the auth cookie is SameSite=None, which means the browser would attach it to forged
  requests from other websites. Two layers stop that:
   1. The Origin header, when present, must be one of our frontends.
   2. State-changing requests must carry a custom header (X-Requested-With). A plain HTML form on
      another site can't set it, and a cross-site fetch that sets it triggers a CORS preflight,
      which our allow-list rejects.
  Requests authenticated with an Authorization header (curl, Postman) don't use the cookie, so they
  aren't CSRF-able and skip the check.
*/
export function csrfGuard(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.headers.authorization?.startsWith("Bearer ")) return next();

  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) {
    return next(ApiError.forbidden("Request origin is not allowed"));
  }
  if (!req.headers["x-requested-with"]) {
    return next(ApiError.forbidden("Missing required request header"));
  }
  next();
}
