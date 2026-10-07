import { ListMusic } from "lucide-react";
import CoverImage from "../music/CoverImage.jsx";

// 4+ distinct covers -> 2x2 mosaic (like Spotify). Otherwise the first cover, or a placeholder.
export default function PlaylistCover({ covers = [], className = "" }) {
  if (covers.length >= 4) {
    return (
      <div className={`grid grid-cols-2 grid-rows-2 overflow-hidden rounded-md bg-surface-highlight ${className}`}>
        {covers.slice(0, 4).map((url, i) => (
          <img key={i} src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ))}
      </div>
    );
  }
  return <CoverImage src={covers[0]} icon={ListMusic} className={className} />;
}
