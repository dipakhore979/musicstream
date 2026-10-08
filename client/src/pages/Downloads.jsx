import { Link } from "react-router-dom";
import { CircleArrowDown, Download, Trash2, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import { useOfflineStore } from "../store/offlineStore.js";
import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import { formatBytes } from "../lib/format.js";
import PlayAllButtons from "../components/music/PlayAllButtons.jsx";
import SongList from "../components/music/SongList.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

// Songs saved inside the app. Everything on this page works with no internet connection.
export default function Downloads() {
  const songs = useOfflineStore((s) => s.songs);
  const bytes = useOfflineStore((s) => s.bytes);
  const ready = useOfflineStore((s) => s.ready);
  const unsupported = useOfflineStore((s) => s.unsupported);
  const clearAll = useOfflineStore((s) => s.clearAll);
  const online = useOnlineStatus();

  async function handleClearAll() {
    if (!window.confirm(`Remove all ${songs.length} downloaded songs from this device?`)) return;
    await clearAll();
    toast.success("Downloads removed");
  }

  return (
    <div className="px-4 pb-10 pt-6 md:px-8">
      <header className="mb-6 flex items-center gap-4 md:gap-6">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand to-emerald-900 shadow-2xl md:h-32 md:w-32">
          <CircleArrowDown size={48} className="text-black" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold">Available offline</p>
          <h1 className="my-1 text-3xl font-black tracking-tight md:text-5xl">Downloads</h1>
          <p className="text-sm text-white/70">
            {songs.length} song{songs.length === 1 ? "" : "s"}
            {songs.length > 0 && ` • ${formatBytes(bytes)}`} • plays without internet
          </p>
        </div>
      </header>

      {!online && (
        <p className="mb-4 flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 font-sans text-sm text-muted">
          <WifiOff size={16} /> You're offline. Only downloaded songs will play.
        </p>
      )}

      {unsupported && (
        <EmptyState
          icon={Download}
          title="Downloads aren't available here"
          message="This browser mode blocks offline storage (private or incognito windows often do). Open MusicStream in a normal window, or use “Save to device”."
        />
      )}

      {!unsupported && ready && songs.length === 0 && (
        <EmptyState
          icon={CircleArrowDown}
          title="Nothing downloaded yet"
          message="Open any song's ••• menu, or an album or playlist, and choose Download → Download in app."
          action={online && <Link to="/browse/songs" className="btn-primary">Browse songs</Link>}
        />
      )}

      {songs.length > 0 && (
        <>
          <PlayAllButtons songs={songs}>
            <button onClick={handleClearAll} aria-label="Remove all downloads" title="Remove all downloads" className="icon-btn hover:!text-red-400">
              <Trash2 size={22} />
            </button>
          </PlayAllButtons>
          <SongList songs={songs} showHeader />
        </>
      )}
    </div>
  );
}
