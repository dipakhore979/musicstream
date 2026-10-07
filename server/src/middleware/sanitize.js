// Defence in depth against NoSQL operator injection ({"email": {"$ne": null}}):
// strip any key that starts with "$" or contains "." from body, query and params.
// (Zod validation already rejects objects where strings are expected; this is the second layer.)
const MAX_DEPTH = 10;

function clean(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > MAX_DEPTH) return;
  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) delete value[key];
    else clean(value[key], depth + 1);
  }
}

export function sanitize(req, _res, next) {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
}
