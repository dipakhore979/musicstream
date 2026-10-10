export function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// "3 hr 12 min" / "42 min" for album headers.
export function formatTotalDuration(seconds = 0) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${Math.max(mins, 1)} min`;
  return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
}

// A song without its own cover falls back to its album's cover.
export const getSongCover = (song) => song?.coverImage?.url || song?.album?.coverImage?.url || "";

export function formatBytes(bytes = 0) {
  if (!bytes) return "0 MB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 / 1024).toFixed(bytes < 100 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

// Turns "rgb(r, g, b)" or "#rrggbb" into rgba(...) with the given opacity.
export function toRgba(color, alpha = 1) {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
}
