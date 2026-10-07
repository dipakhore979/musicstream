// Validates and replaces req[source] with the parsed (trimmed, coerced, unknown-keys-stripped) data.
// A ZodError thrown here is turned into a 400 by the central error handler.
export const validate =
  (schema, source = "body") =>
  (req, _res, next) => {
    req[source] = schema.parse(req[source]);
    next();
  };
