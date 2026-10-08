import { useState } from "react";
import { Heart } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore.js";

export default function LikeButton({ song, size = 18, hideUntilHover = false, className = "" }) {
  const liked = useLibraryStore((s) => s.likedIds.has(song.id));
  const toggleLike = useLibraryStore((s) => s.toggleLike);
  const [pop, setPop] = useState(false); // plays the "heart pop" only at the moment you like a song

  // In song rows an un-liked heart only appears on hover (desktop), a liked one always shows.
  const hidden = hideUntilHover && !liked ? "md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100" : "";

  function handleClick(e) {
    e.stopPropagation();
    if (!liked) {
      setPop(true);
      setTimeout(() => setPop(false), 450);
    }
    toggleLike(song);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
      aria-pressed={liked}
      className={`shrink-0 rounded-full p-1.5 transition-all duration-200 hover:scale-110 hover:bg-white/10 ${
        liked ? "text-brand" : "text-muted hover:text-white"
      } ${hidden} ${className}`}
    >
      <Heart size={size} className={`${liked ? "fill-brand" : ""} ${pop ? "animate-heart-pop" : ""}`} />
    </button>
  );
}
