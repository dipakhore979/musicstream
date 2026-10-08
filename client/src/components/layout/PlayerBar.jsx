import { Link } from "react-router-dom";
import { ListMusic, Loader2, Pause, Play, SkipForward, X } from "lucide-react";
import CoverImage from "../music/CoverImage.jsx";
import LikeButton from "../music/LikeButton.jsx";
import PlayerControls from "../player/PlayerControls.jsx";
import SeekBar from "../player/SeekBar.jsx";
import VolumeControl from "../player/VolumeControl.jsx";
import { getSongCover } from "../../lib/format.js";
import { selectCurrentSong, usePlayerStore, useProgressStore } from "../../store/playerStore.js";

// Stops playback, empties the queue and hides the player.
function CloseButton({ className = "" }) {
  const reset = usePlayerStore((s) => s.reset);
  return (
    <button type="button" onClick={reset} aria-label="Close player" title="Close player" className={`icon-btn ${className}`}>
      <X size={18} />
    </button>
  );
}

function MiniProgress() {
  const currentTime = useProgressStore((s) => s.currentTime);
  const duration = useProgressStore((s) => s.duration);
  const pct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
  return (
    <div className="absolute inset-x-3 top-0 h-0.5 overflow-hidden rounded-full bg-white/20">
      <div className="h-full bg-white" style={{ width: `${pct}%` }} />
    </div>
  );
}

function MiniPlayer({ song }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const setSheetOpen = usePlayerStore((s) => s.setSheetOpen);
  const buffering = useProgressStore((s) => s.buffering) && isPlaying;

  return (
    <div className="relative flex h-16 items-center gap-1 px-3 md:hidden">
      <MiniProgress />
      <button onClick={() => setSheetOpen(true)} aria-label="Open player" className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <CoverImage src={getSongCover(song)} className="h-11 w-11 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{song.title}</p>
          <p className="truncate text-xs text-muted">{song.artist?.name}</p>
        </div>
      </button>
      <LikeButton song={song} size={22} />
      <button onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} className="rounded-full p-2">
        {buffering ? <Loader2 size={24} className="animate-spin" /> : isPlaying ? <Pause size={24} className="fill-white" /> : <Play size={24} className="fill-white" />}
      </button>
      <button onClick={() => next()} aria-label="Next" className="rounded-full p-2">
        <SkipForward size={22} className="fill-white" />
      </button>
      <CloseButton />
    </div>
  );
}

export default function PlayerBar() {
  const song = usePlayerStore(selectCurrentSong);
  const queueOpen = usePlayerStore((s) => s.queueOpen);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);

  // Nothing queued: no player bar at all. It slides up when you start a song.
  if (!song) return null;

  return (
    <footer className="shrink-0 animate-slide-up border-t border-white/10 bg-black">
      {/* Desktop / tablet */}
      <div className="hidden h-20 grid-cols-[1fr_minmax(0,40rem)_1fr] items-center gap-4 px-4 md:grid">
        <div className="flex min-w-0 items-center gap-3">
          <CoverImage src={getSongCover(song)} className="h-14 w-14 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{song.title}</p>
            {song.artist && (
              <Link to={`/artists/${song.artist.id}`} className="truncate text-xs text-muted hover:text-white hover:underline">
                {song.artist.name}
              </Link>
            )}
          </div>
          <LikeButton song={song} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <PlayerControls />
          <SeekBar />
        </div>

        <div className="flex items-center justify-end gap-1">
          <button
            onClick={toggleQueue}
            aria-label="Queue"
            aria-pressed={queueOpen}
            className={`rounded-full p-2 transition-all duration-200 hover:scale-110 hover:bg-white/10 ${queueOpen ? "text-brand" : "text-muted hover:text-white"}`}
          >
            <ListMusic size={20} />
          </button>
          <VolumeControl />
          <CloseButton className="ml-1" />
        </div>
      </div>

      {/* Phones: mini player (tap to expand) */}
      <MiniPlayer song={song} />
    </footer>
  );
}
