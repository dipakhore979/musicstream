// Operational errors carry an HTTP status so the central handler can respond correctly.
export class ApiError extends Error {
  constructor(statusCode, message, errors = undefined, code = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code; // lets the client react to specific cases without parsing messages
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = "Bad request", errors) { return new ApiError(400, msg, errors); }
  static unauthorized(msg = "Unauthorized") { return new ApiError(401, msg); }
  static forbidden(msg = "Forbidden") { return new ApiError(403, msg); }
  static notFound(msg = "Resource not found") { return new ApiError(404, msg); }
  static conflict(msg = "Conflict") { return new ApiError(409, msg); }
}
