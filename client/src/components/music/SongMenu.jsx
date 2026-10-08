import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Disc3, ListMusic, ListPlus, MoreHorizontal, Plus, StepForward, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../lib/api.js";
import { usePlayerStore } from "../../store/playerStore.js";
import { useLibraryStore } from "../../store/libraryStore.js";

const item = "menu-item flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-white/10";

// The "…" menu on every song row. Pass onRemoveFromPlaylist when the row is inside a playlist.
export default function SongMenu({ song, onRemoveFromPlaylist }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("main"); // "main" | "playlists"
  const [openUp, setOpenUp] = useState(false);
  const ref = useRef(null);

  const playNext = usePlayerStore((s) => s.playNext);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playlists = useLibraryStore((s) => s.playlists);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);
  const addSongToPlaylist = useLibraryStore((s) => s.addSongToPlaylist);

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
      setOpenUp(window.innerHeight - rect.bottom < 320);
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
          className={`absolute right-0 z-30 w-60 rounded-md bg-surface-highlight p-1 shadow-2xl ${
            openUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {view === "main" ? (
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
          ) : (
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
        </div>
      )}
    </div>
  );
}
