// Express 4 doesn't catch rejected promises from async handlers; this forwards them to next().
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
