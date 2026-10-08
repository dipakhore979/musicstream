import { ZodError } from "zod";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { isProd } from "../config/env.js";

// Normalizes every error type into the same JSON shape: { success:false, message, errors? }.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let message = "Internal server error";
  let errors;
  let code;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
    code = err.code;
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    errors = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value for ${field}`;
  } else if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    status = 401;
    message = "Invalid or expired token";
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  } else if (err?.name === "MulterError") {
    status = 400;
    message = err.message;
  }

  if (status >= 500) console.error(err);

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (code) body.code = code;
  // Never leak stack traces in production.
  if (!isProd && status >= 500) body.stack = err.stack;

  res.status(status).json(body);
}
