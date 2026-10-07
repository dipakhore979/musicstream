// Every success response uses { success: true, message?, data, meta? } for a predictable client contract.
export function sendSuccess(res, { data = null, message, statusCode = 200, meta } = {}) {
  const body = { success: true };
  if (message) body.message = message;
  body.data = data;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

// Shared pagination helpers for list endpoints (used from Phase 3).
export function getPagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPageMeta({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) || 1 };
}
