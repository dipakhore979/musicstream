import { Link } from "react-router-dom";
import { Pause, Play } from "lucide-react";
import CoverImage from "./CoverImage.jsx";
import LikeButton from "./LikeButton.jsx";
import SongMenu from "./SongMenu.jsx";
import { songGridCols } from "./songGrid.js";
import { formatDuration, getSongCover } from "../../lib/format.js";
import { selectCurrentSong, usePlayerStore } from "../../store/playerStore.js";

function Equalizer({ paused }) {
  return (
    <span className={`eq ${paused ? "paused" : ""}`} aria-hidden="true">
      <span /><span /><span />
    </span>
  );
}

// onPlay() starts playback of this row inside its list (SongList provides it).
// onRemoveFromPlaylist is only passed on playlist pages.
export default function SongRow({ song, index, showAlbum = true, onPlay, onRemoveFromPlaylist }) {
  // Boolean selectors: a row only re-renders when *its own* state changes, not on every tick.
  const isCurrent = usePlayerStore((s) => selectCurrentSong(s)?.id === song.id);
  const isActive = usePlayerStore((s) => s.isPlaying && selectCurrentSong(s)?.id === song.id);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playSongs = usePlayerStore((s) => s.playSongs);

  const handlePlay = () => {
    if (isCurrent) togglePlay();
    else if (onPlay) onPlay();
    else playSongs([song], 0);
  };

  return (
    <div
      className={`group relative grid ${songGridCols(showAlbum)} items-center gap-3 rounded-md px-2 py-2 transition-colors duration-150 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-brand before:transition-opacity hover:bg-gradient-to-r hover:from-white/10 hover:to-transparent hover:before:opacity-100 ${
        isCurrent ? "before:opacity-100" : "before:opacity-0"
      }`}
    >
      <button
        onClick={handlePlay}
        aria-label={isActive ? `Pause ${song.title}` : `Play ${song.title}`}
        className="flex h-8 w-8 items-center justify-center text-muted"
      >
        <span className="group-hover:hidden">{isCurrent ? <Equalizer paused={!isActive} /> : index + 1}</span>
        {isActive ? (
          <Pause size={16} className="hidden fill-white text-white group-hover:block" />
        ) : (
          <Play size={16} className="hidden fill-white text-white group-hover:block" />
        )}
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <CoverImage src={getSongCover(song)} alt="" className="h-10 w-10 shrink-0" />
        <div className="min-w-0">
          <p className={`truncate font-medium ${isCurrent ? "text-brand" : ""}`}>{song.title}</p>
          {song.artist && (
            <Link to={`/artists/${song.artist.id}`} className="truncate text-sm text-muted hover:text-white hover:underline">
              {song.artist.name}
            </Link>
          )}
        </div>
      </div>

      {showAlbum && (
        <div className="hidden min-w-0 md:block">
          {song.album ? (
            <Link to={`/albums/${song.album.id}`} className="truncate text-sm text-muted hover:text-white hover:underline">
              {song.album.title}
            </Link>
          ) : (
            <span className="text-sm text-muted">Single</span>
          )}
        </div>
      )}

      <LikeButton song={song} hideUntilHover />
      <span className="hidden text-sm tabular-nums text-muted md:block">{formatDuration(song.duration)}</span>
      <SongMenu song={song} onRemoveFromPlaylist={onRemoveFromPlaylist} />
    </div>
  );
}
