import { Link } from "react-router-dom";
import CoverImage from "./CoverImage.jsx";
import PlayButton from "./PlayButton.jsx";

// Card in the "Enjoy Your Music" style: a 4:3 picture, a small title, and a centred description.
// `fluid` fills a grid cell instead of the fixed width used in scrolling shelves.
// `cover` lets callers supply their own artwork (playlist mosaic, liked-songs heart).
// (`round` is accepted for older callers but cards are now always rectangular.)
export default function MediaCard({ to, image, title, subtitle, fluid = false, onPlay, cover }) {
  const width = fluid ? "w-full" : "w-40 shrink-0 md:w-44";

  return (
    <div className={`group relative transition-transform duration-300 hover:-translate-y-1 ${width}`}>
      <div className="relative">
        <Link to={to} tabIndex={-1} aria-hidden="true" className="block overflow-hidden rounded-sm transition-shadow duration-300 group-hover:shadow-[0_14px_30px_-10px_rgba(0,0,0,0.95)]">
          {cover ? (
            <div className="aspect-[4/3] w-full">{cover}</div>
          ) : (
            <CoverImage
              src={image}
              alt=""
              className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.03]"
            />
          )}
        </Link>
        {onPlay && (
          <PlayButton
            size="sm"
            onClick={onPlay}
            label={`Play ${title}`}
            className="absolute bottom-2 right-2 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
          />
        )}
      </div>
      <Link to={to} className="mt-2 block truncate text-sm font-semibold text-white/90 transition-colors group-hover:text-white hover:underline">
        {title}
      </Link>
      {subtitle && <p className="mt-2 line-clamp-2 text-center text-sm text-muted">{subtitle}</p>}
    </div>
  );
}
