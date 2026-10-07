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
