import { Volume1, Volume2, VolumeX } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore.js";

export default function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const shown = muted ? 0 : volume;
  const Icon = shown === 0 ? VolumeX : shown < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="icon-btn"
      >
        <Icon size={20} />
      </button>
      <input
        type="range"
        className="range w-24"
        min={0}
        max={1}
        step={0.01}
        value={shown}
        aria-label="Volume"
        style={{ "--pct": `${shown * 100}%` }}
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </div>
  );
}
