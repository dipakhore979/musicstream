import { useState } from "react";
import { formatDuration } from "../../lib/format.js";
import { selectCurrentSong, usePlayerStore, useProgressStore } from "../../store/playerStore.js";

export default function SeekBar() {
  const currentTime = useProgressStore((s) => s.currentTime);
  const loadedDuration = useProgressStore((s) => s.duration);
  const fallbackDuration = usePlayerStore((s) => selectCurrentSong(s)?.duration || 0);
  const seek = usePlayerStore((s) => s.seek);

  // While dragging we show the thumb position locally and only seek on release,
  // otherwise timeupdate events would fight the user's finger.
  const [dragValue, setDragValue] = useState(null);

  const duration = loadedDuration || fallbackDuration;
  const value = Math.min(dragValue ?? currentTime, duration || 0);
  const pct = duration ? (value / duration) * 100 : 0;

  const commit = () => {
    if (dragValue === null) return;
    seek(dragValue);
    setDragValue(null);
  };

  return (
    <div className="flex w-full items-center gap-2 text-xs tabular-nums text-muted">
      <span className="w-10 text-right">{formatDuration(value)}</span>
      <input
        type="range"
        className="range min-w-0 flex-1"
        min={0}
        max={duration || 0}
        step={0.1}
        value={value}
        disabled={!duration}
        aria-label="Seek"
        style={{ "--pct": `${pct}%` }}
        onChange={(e) => setDragValue(Number(e.target.value))}
        onPointerUp={commit}
        onPointerCancel={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
      <span className="w-10">{formatDuration(duration)}</span>
    </div>
  );
}
