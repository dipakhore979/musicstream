import { Loader2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { selectCurrentSong, usePlayerStore, useProgressStore } from "../../store/playerStore.js";

function IconButton({ label, active, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`relative rounded-full p-2 transition ${
        active ? "text-brand" : "text-muted hover:text-white"
      } disabled:opacity-40 disabled:hover:text-muted`}
    >
      {children}
      {active && <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />}
    </button>
  );
}

export default function PlayerControls({ big = false }) {
  const hasSong = usePlayerStore((s) => Boolean(selectCurrentSong(s)));
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const buffering = useProgressStore((s) => s.buffering) && isPlaying;

  const icon = big ? 28 : 20;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;
  const repeatLabel = { off: "Enable repeat", all: "Repeat one", one: "Disable repeat" }[repeat];

  return (
    <div className={`flex items-center justify-center ${big ? "gap-5" : "gap-2"}`}>
      <IconButton label={shuffle ? "Disable shuffle" : "Enable shuffle"} active={shuffle} onClick={toggleShuffle}>
        <Shuffle size={icon} />
      </IconButton>
      <IconButton label="Previous" onClick={previous} disabled={!hasSong}>
        <SkipBack size={icon} className="fill-current" />
      </IconButton>
      <button
        type="button"
        onClick={togglePlay}
        disabled={!hasSong}
        aria-label={isPlaying ? "Pause" : "Play"}
        className={`flex items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 ${
          big ? "h-16 w-16" : "h-9 w-9"
        }`}
      >
        {buffering ? (
          <Loader2 size={icon} className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={icon} className="fill-black" />
        ) : (
          <Play size={icon} className="ml-0.5 fill-black" />
        )}
      </button>
      <IconButton label="Next" onClick={() => next()} disabled={!hasSong}>
        <SkipForward size={icon} className="fill-current" />
      </IconButton>
      <IconButton label={repeatLabel} active={repeat !== "off"} onClick={cycleRepeat}>
        <RepeatIcon size={icon} />
      </IconButton>
    </div>
  );
}
