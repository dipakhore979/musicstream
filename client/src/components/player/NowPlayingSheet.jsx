import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ListMusic } from "lucide-react";
import CoverImage from "../music/CoverImage.jsx";
import LikeButton from "../music/LikeButton.jsx";
import PlayerControls from "./PlayerControls.jsx";
import SeekBar from "./SeekBar.jsx";
import { getSongCover } from "../../lib/format.js";
import { selectCurrentSong, usePlayerStore } from "../../store/playerStore.js";

// Full-screen player for phones; opened by tapping the mini player.
export default function NowPlayingSheet() {
  const open = usePlayerStore((s) => s.sheetOpen);
  const song = usePlayerStore(selectCurrentSong);
  const { setSheetOpen, setQueueOpen } = usePlayerStore.getState();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setSheetOpen]);

  if (!open || !song) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gradient-to-b from-surface-highlight to-black px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] md:hidden">
      <div className="flex items-center justify-between">
        <button onClick={() => setSheetOpen(false)} aria-label="Close player" className="rounded-full p-2">
          <ChevronDown size={28} />
        </button>
        <span className="text-xs font-bold uppercase tracking-wide">Now playing</span>
        <button
          onClick={() => setQueueOpen(true)}
          aria-label="Open queue"
          className="rounded-full p-2"
        >
          <ListMusic size={24} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center py-6">
        <CoverImage src={getSongCover(song)} alt={song.title} className="aspect-square w-full max-w-sm shadow-2xl" />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
        <h2 className="truncate text-2xl font-bold">{song.title}</h2>
        {song.artist && (
          <Link
            to={`/artists/${song.artist.id}`}
            onClick={() => setSheetOpen(false)}
            className="text-muted hover:text-white"
          >
            {song.artist.name}
          </Link>
        )}
        </div>
        <LikeButton song={song} size={26} />
      </div>

      <SeekBar />
      <div className="mt-4">
        <PlayerControls big />
      </div>
    </div>
  );
}
