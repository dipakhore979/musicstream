import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ListMusic, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../lib/api.js";
import { useDominantColor } from "../hooks/useDominantColor.js";
import { useLibraryStore } from "../store/libraryStore.js";
import { formatTotalDuration, getSongCover } from "../lib/format.js";
import HeroBackdrop from "../components/ui/HeroBackdrop.jsx";
import PlaylistCover from "../components/playlist/PlaylistCover.jsx";
import EditPlaylistModal from "../components/playlist/EditPlaylistModal.jsx";
import SongList from "../components/music/SongList.jsx";
import PlayAllButtons from "../components/music/PlayAllButtons.jsx";
import DownloadAllButton from "../components/music/DownloadAllButton.jsx";
import { SongListSkeleton } from "../components/music/Skeletons.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

// Up to 4 distinct covers for the mosaic header.
function distinctCovers(songs) {
  const urls = [];
  for (const song of songs) {
    const url = getSongCover(song);
    if (url && !urls.includes(url)) urls.push(url);
    if (urls.length === 4) break;
  }
  return urls;
}

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, playlist: null, error: null });
  const [editing, setEditing] = useState(false);
  const removeSongFromPlaylist = useLibraryStore((s) => s.removeSongFromPlaylist);
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, playlist: null, error: null });
    api
      .get(`/playlists/${id}`)
      .then((res) => !cancelled && setState({ loading: false, playlist: res.data.data, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, playlist: null, error: getErrorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { loading, playlist, error } = state;
  const songs = playlist?.songs ?? [];
  const covers = useMemo(() => distinctCovers(songs), [songs]);
  const color = useDominantColor(covers[0]);

  if (error) {
    return (
      <div className="p-6">
        <EmptyState title="Couldn't load playlist" message={error} action={<Link to="/" className="btn-outline">Go home</Link>} />
      </div>
    );
  }

  const totalSeconds = songs.reduce((sum, s) => sum + (s.duration || 0), 0);

  async function handleRemove(song) {
    try {
      await removeSongFromPlaylist(id, song.id);
      setState((s) => ({ ...s, playlist: { ...s.playlist, songs: s.playlist.songs.filter((x) => x.id !== song.id) } }));
      toast.success("Removed from playlist");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${playlist.name}"? This can't be undone.`)) return;
    try {
      await deletePlaylist(id);
      toast.success("Playlist deleted");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const iconBtn = "icon-btn";

  return (
    <div className="relative min-h-full">
      <HeroBackdrop color={color} />

      <div className="relative px-4 pb-8 pt-8 md:px-8">
        <header className="mb-6 flex flex-col items-center gap-5 text-center md:flex-row md:items-end md:text-left">
          {loading ? (
            <div className="skeleton h-48 w-48 shrink-0 md:h-56 md:w-56" />
          ) : (
            <PlaylistCover covers={covers} className="h-48 w-48 shrink-0 shadow-[0_4px_60px_rgba(0,0,0,0.5)] md:h-56 md:w-56" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold">Playlist</p>
            {loading ? (
              <div className="skeleton mt-3 h-12 w-72" />
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="block max-w-full text-left" aria-label="Edit playlist details">
                  <h1 className="my-2 line-clamp-2 text-4xl font-black tracking-tight hover:underline md:text-6xl lg:text-7xl">
                    {playlist.name}
                  </h1>
                </button>
                {playlist.description && <p className="mb-2 max-w-2xl text-sm text-white/70">{playlist.description}</p>}
                <p className="text-sm">
                  <span className="font-bold">{playlist.owner?.name}</span>
                  <span className="text-white/70">
                    {` • ${songs.length} song${songs.length === 1 ? "" : "s"}`}
                    {songs.length > 0 && `, ${formatTotalDuration(totalSeconds)}`}
                  </span>
                </p>
              </>
            )}
          </div>
        </header>

        {playlist && (
          <PlayAllButtons songs={songs}>
            <DownloadAllButton songs={songs} />
            <button onClick={() => setEditing(true)} aria-label="Edit details" title="Edit details" className={iconBtn}>
              <Pencil size={22} />
            </button>
            <button onClick={handleDelete} aria-label="Delete playlist" title="Delete playlist" className={`${iconBtn} hover:!text-red-400`}>
              <Trash2 size={22} />
            </button>
          </PlayAllButtons>
        )}

        {loading && <SongListSkeleton />}
        {playlist && songs.length === 0 && (
          <EmptyState
            icon={ListMusic}
            title="This playlist is empty"
            message="Find songs and choose “Add to playlist” from the ••• menu."
            action={<Link to="/browse/songs" className="btn-primary">Browse songs</Link>}
          />
        )}
        {playlist && songs.length > 0 && <SongList songs={songs} showHeader onRemove={handleRemove} />}
      </div>

      {editing && playlist && (
        <EditPlaylistModal
          playlist={playlist}
          onClose={() => setEditing(false)}
          onSaved={(updated) => setState((s) => ({ ...s, playlist: { ...s.playlist, ...updated } }))}
        />
      )}
    </div>
  );
}
