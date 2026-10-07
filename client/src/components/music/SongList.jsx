import { Clock } from "lucide-react";
import SongRow from "./SongRow.jsx";
import { songGridCols } from "./songGrid.js";
import { usePlayerStore } from "../../store/playerStore.js";

// Playing a row queues the whole list, starting from that row.
// Pass onRemove(song) on playlist pages to add "Remove from this playlist" to each row's menu.
export default function SongList({ songs, showAlbum = true, showHeader = false, onRemove }) {
  const playSongs = usePlayerStore((s) => s.playSongs);

  return (
    <div className="flex flex-col">
      {showHeader && (
        <div
          className={`mb-2 hidden items-center gap-3 border-b border-white/10 px-2 pb-2 text-xs font-medium uppercase tracking-wider text-muted md:grid ${songGridCols(showAlbum)}`}
        >
          <span className="text-center text-sm">#</span>
          <span>Title</span>
          {showAlbum && <span>Album</span>}
          <span />
          <Clock size={16} aria-label="Duration" />
          <span />
        </div>
      )}
      {songs.map((song, i) => (
        <SongRow
          key={song.id}
          song={song}
          index={i}
          showAlbum={showAlbum}
          onPlay={() => playSongs(songs, i)}
          onRemoveFromPlaylist={onRemove}
        />
      ))}
    </div>
  );
}
