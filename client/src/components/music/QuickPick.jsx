import { Link } from "react-router-dom";
import CoverImage from "./CoverImage.jsx";
import PlayButton from "./PlayButton.jsx";

// The compact tiles at the top of Spotify's Home page.
export default function QuickPick({ to, image, title, onPlay, onHover }) {
  return (
    <div
      onMouseEnter={onHover}
      className="group relative flex items-center overflow-hidden rounded-md bg-white/10 transition-colors hover:bg-white/20"
    >
      <Link to={to} className="flex min-w-0 flex-1 items-center gap-3">
        <CoverImage src={image} alt="" className="h-14 w-14 shrink-0 shadow-lg md:h-16 md:w-16" />
        <span className="truncate pr-14 text-sm font-bold md:text-base">{title}</span>
      </Link>
      <PlayButton
        size="sm"
        onClick={onPlay}
        label={`Play ${title}`}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      />
    </div>
  );
}
