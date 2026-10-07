import { Heart } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore.js";

export default function LikeButton({ song, size = 18, hideUntilHover = false, className = "" }) {
  const liked = useLibraryStore((s) => s.likedIds.has(song.id));
  const toggleLike = useLibraryStore((s) => s.toggleLike);

  // In song rows an un-liked heart only appears on hover (desktop), a liked one always shows.
  const hidden = hideUntilHover && !liked ? "md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100" : "";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleLike(song);
      }}
      aria-label={liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
      aria-pressed={liked}
      className={`shrink-0 rounded-full p-1.5 transition hover:scale-110 ${
        liked ? "text-brand" : "text-muted hover:text-white"
      } ${hidden} ${className}`}
    >
      <Heart size={size} className={liked ? "fill-brand" : ""} />
    </button>
  );
}
