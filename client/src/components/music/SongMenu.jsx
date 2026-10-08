import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, CircleArrowDown, Disc3, Download, ListMusic, ListPlus, MoreHorizontal, Plus, StepForward, Trash2, User,
} from "lucide-react";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../lib/api.js";
import { downloadInApp, removeFromApp, saveToDevice } from "../../lib/offlineActions.js";
import { usePlayerStore } from "../../store/playerStore.js";
import { useLibraryStore } from "../../store/libraryStore.js";
import { useOfflineStore } from "../../store/offlineStore.js";

const item = "menu-item flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-white/10";
const choice = "menu-item flex w-full items-start gap-3 rounded px-3 py-2 text-left text-sm hover:bg-white/10";

// The "…" menu on every song row. Pass onRemoveFromPlaylist when the row is inside a playlist.
export default function SongMenu({ song, onRemoveFromPlaylist }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("main"); // "main" | "playlists" | "download"
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef(null);

  const playNext = usePlayerStore((s) => s.playNext);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playlists = useLibraryStore((s) => s.playlists);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);
  const addSongToPlaylist = useLibraryStore((s) => s.addSongToPlaylist);
  const savedInApp = useOfflineStore((s) => s.ids.has(song.id));

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      // Flip the menu upwards when there isn't room below the button.
      const rect = ref.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 340);
      setView("main");
    }
    setOpen((o) => !o);
  }

  const run = (fn, message) => () => {
    fn(song);
    toast.success(message);
    setOpen(false);
  };

  async function addTo(playlist) {
    setOpen(false);
    try {
      await addSongToPlaylist(playlist.id, song);
      toast.success(`Added to ${playlist.name}`);
    } catch (err) {
      if (err.response?.status === 409) toast(`Already in ${playlist.name}`);
      else toast.error(getErrorMessage(err));
    }
  }

  async function addToNew() {
    setOpen(false);
    try {
      const playlist = await createPlaylist();
      await addSongToPlaylist(playlist.id, song);
      toast.success(`Added to ${playlist.name}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function removeFromPlaylist() {
    setOpen(false);
    await onRemoveFromPlaylist(song);
  }

  const act = (fn) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label={`More options for ${song.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full p-1.5 text-muted transition-all duration-200 hover:scale-110 hover:bg-white/10 hover:text-white md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-30 w-64 rounded-md bg-surface-highlight p-1 shadow-2xl ${
            openUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {view === "main" && (
            <>
              <button role="menuitem" className={item} onClick={run(playNext, "Will play next")}>
                <StepForward size={16} /> Play next
              </button>
              <button role="menuitem" className={item} onClick={run(addToQueue, "Added to queue")}>
                <ListPlus size={16} /> Add to queue
              </button>
              <button role="menuitem" className={item} onClick={() => setView("playlists")}>
                <ListMusic size={16} /> Add to playlist
              </button>
              {song.downloadable !== false && (
                <button role="menuitem" className={item} onClick={() => setView("download")}>
                  {savedInApp ? <CircleArrowDown size={16} className="text-brand" /> : <Download size={16} />}
                  {savedInApp ? "Downloaded" : "Download"}
                </button>
              )}
              {onRemoveFromPlaylist && (
                <button role="menuitem" className={`${item} text-red-400`} onClick={removeFromPlaylist}>
                  <Trash2 size={16} /> Remove from this playlist
                </button>
              )}
              <div className="my-1 border-t border-white/10" />
              {song.artist && (
                <Link role="menuitem" to={`/artists/${song.artist.id}`} className={item} onClick={() => setOpen(false)}>
                  <User size={16} /> Go to artist
                </Link>
              )}
              {song.album && (
                <Link role="menuitem" to={`/albums/${song.album.id}`} className={item} onClick={() => setOpen(false)}>
                  <Disc3 size={16} /> Go to album
                </Link>
              )}
            </>
          )}

          {view === "playlists" && (
            <>
              <button className="flex w-full items-center gap-2 px-2 py-2 text-sm font-semibold text-muted hover:text-white" onClick={() => setView("main")}>
                <ChevronLeft size={16} /> Add to playlist
              </button>
              <button role="menuitem" className={item} onClick={addToNew}>
                <Plus size={16} /> New playlist
              </button>
              <div className="max-h-56 overflow-y-auto">
                {playlists.map((p) => (
                  <button key={p.id} role="menuitem" className={item} onClick={() => addTo(p)}>
                    <ListMusic size={16} className="shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
                {playlists.length === 0 && <p className="px-3 py-2 text-xs text-muted">You have no playlists yet.</p>}
              </div>
            </>
          )}

          {view === "download" && (
            <>
              <button className="flex w-full items-center gap-2 px-2 py-2 text-sm font-semibold text-muted hover:text-white" onClick={() => setView("main")}>
                <ChevronLeft size={16} /> Download
              </button>

              {savedInApp ? (
                <>
                  <p className="flex items-center gap-2 px-3 py-2 text-sm text-brand">
                    <CircleArrowDown size={16} /> Downloaded in the app
                  </p>
                  <button role="menuitem" className={`${item} text-red-400`} onClick={act(() => removeFromApp([song.id]))}>
                    <Trash2 size={16} /> Remove app download
                  </button>
                </>
              ) : (
                <button role="menuitem" className={choice} onClick={act(() => downloadInApp([song]))}>
                  <CircleArrowDown size={18} className="mt-0.5 shrink-0" />
                  <span>
                    Download in app
                    <span className="block text-xs text-muted">Listen offline inside MusicStream</span>
                  </span>
                </button>
              )}

              <button role="menuitem" className={choice} onClick={act(() => saveToDevice([song]))}>
                <Download size={18} className="mt-0.5 shrink-0" />
                <span>
                  Save to device
                  <span className="block text-xs text-muted">Audio file in your Downloads folder</span>
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
