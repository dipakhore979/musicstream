import { Heart } from "lucide-react";
import CoverImage from "../music/CoverImage.jsx";
import PlaylistCover from "../playlist/PlaylistCover.jsx";

export function LikedCover({ className = "", iconSize = "45%" }) {
  return (
    <div className={`flex items-center justify-center rounded-md bg-gradient-to-br from-[#450af5] to-[#c4efd9] ${className}`}>
      <Heart size={iconSize} className="fill-white text-white" />
    </div>
  );
}

// Renders the right cover for any library item (liked songs, playlist, album or artist).
export default function ItemCover({ item, className = "" }) {
  if (item.kind === "liked") return <LikedCover className={className} />;
  if (item.kind === "playlist") return <PlaylistCover covers={item.covers} className={className} />;
  return <CoverImage src={item.image} rounded={item.round} alt="" className={className} />;
}
