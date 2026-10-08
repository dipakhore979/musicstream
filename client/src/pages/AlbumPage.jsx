import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api.js";
import { useDominantColor } from "../hooks/useDominantColor.js";
import HeroBackdrop from "../components/ui/HeroBackdrop.jsx";
import CoverImage from "../components/music/CoverImage.jsx";
import SongList from "../components/music/SongList.jsx";
import PlayAllButtons from "../components/music/PlayAllButtons.jsx";
import DownloadAllButton from "../components/music/DownloadAllButton.jsx";
import { SongListSkeleton } from "../components/music/Skeletons.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { formatTotalDuration } from "../lib/format.js";

export default function AlbumPage() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, album: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, album: null, error: null });
    api
      .get(`/albums/${id}`)
      .then((res) => !cancelled && setState({ loading: false, album: res.data.data, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, album: null, error: getErrorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { loading, album, error } = state;
  const color = useDominantColor(album?.coverImage?.url);

  if (error) return <div className="p-6"><EmptyState title="Couldn't load album" message={error} /></div>;

  const totalSeconds = album?.songs?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
  const count = album?.songs?.length || 0;

  return (
    <div className="relative min-h-full">
      <HeroBackdrop color={color} />

      <div className="relative px-4 pb-8 pt-8 md:px-8">
        <header className="mb-6 flex flex-col items-center gap-5 text-center md:flex-row md:items-end md:text-left">
          {loading ? (
            <div className="skeleton h-48 w-48 shrink-0 md:h-56 md:w-56" />
          ) : (
            <CoverImage
              src={album.coverImage?.url}
              alt={album.title}
              className="h-48 w-48 shrink-0 shadow-[0_4px_60px_rgba(0,0,0,0.5)] md:h-56 md:w-56"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold">Album</p>
            {loading ? (
              <div className="skeleton mt-3 h-12 w-72" />
            ) : (
              <>
                <h1 className="my-2 line-clamp-2 text-4xl font-black tracking-tight md:text-6xl lg:text-7xl">{album.title}</h1>
                {album.description && <p className="mb-2 max-w-2xl text-sm text-white/70">{album.description}</p>}
                <p className="text-sm">
                  <Link to={`/artists/${album.artist?.id}`} className="font-bold hover:underline">
                    {album.artist?.name}
                  </Link>
                  <span className="text-white/70">
                    {album.releaseYear && ` • ${album.releaseYear}`}
                    {` • ${count} song${count === 1 ? "" : "s"}`}
                    {count > 0 && `, ${formatTotalDuration(totalSeconds)}`}
                  </span>
                </p>
              </>
            )}
          </div>
        </header>

        {album && (
          <PlayAllButtons songs={album.songs}>
            <DownloadAllButton songs={album.songs} />
          </PlayAllButtons>
        )}
        {loading && <SongListSkeleton />}
        {album && count === 0 && (
          <EmptyState title="No songs in this album yet" message="Songs added to this album will appear here." />
        )}
        {album && count > 0 && <SongList songs={album.songs} showAlbum={false} showHeader />}
      </div>
    </div>
  );
}
