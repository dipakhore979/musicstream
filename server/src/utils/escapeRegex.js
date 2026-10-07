// Escapes user input before it goes into a RegExp, so "c++" or "(" can't break or abuse the query.
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
