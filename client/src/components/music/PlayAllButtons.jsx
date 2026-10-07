import { Play, Shuffle } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore.js";

// Big green Play + Shuffle for album / artist / playlist pages. `children` adds extra actions beside them.
export default function PlayAllButtons({ songs, children }) {
  const playSongs = usePlayerStore((s) => s.playSongs);
  const playShuffled = usePlayerStore((s) => s.playShuffled);
  const hasSongs = songs?.length > 0;

  if (!hasSongs && !children) return null;

  return (
    <div className="mb-6 flex items-center justify-center gap-4 md:justify-start">
      {hasSongs && (
        <>
          <button
            onClick={() => playSongs(songs, 0)}
            aria-label="Play all"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-black transition hover:scale-105 hover:bg-brand-hover"
          >
            <Play size={26} className="ml-0.5 fill-black" />
          </button>
          <button
            onClick={() => playShuffled(songs)}
            aria-label="Shuffle play"
            className="rounded-full p-2 text-muted transition hover:text-white"
          >
            <Shuffle size={28} />
          </button>
        </>
      )}
      {children}
    </div>
  );
}
