import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { User } from "lucide-react";
import { api, getErrorMessage } from "../lib/api.js";
import { useDominantColor } from "../hooks/useDominantColor.js";
import { playAlbumById } from "../lib/playback.js";
import HeroBackdrop from "../components/ui/HeroBackdrop.jsx";
import CoverImage from "../components/music/CoverImage.jsx";
import MediaCard from "../components/music/MediaCard.jsx";
import Section from "../components/music/Section.jsx";
import SongList from "../components/music/SongList.jsx";
import PlayAllButtons from "../components/music/PlayAllButtons.jsx";
import { SongListSkeleton } from "../components/music/Skeletons.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

export default function ArtistPage() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, artist: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, artist: null, error: null });
    api
      .get(`/artists/${id}`)
      .then((res) => !cancelled && setState({ loading: false, artist: res.data.data, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, artist: null, error: getErrorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { loading, artist, error } = state;
  const color = useDominantColor(artist?.image?.url);

  if (error) return <div className="p-6"><EmptyState title="Couldn't load artist" message={error} /></div>;

  return (
    <div className="relative min-h-full">
      <HeroBackdrop color={color} />

      <div className="relative px-4 pb-8 pt-8 md:px-8">
        <header className="mb-6 flex flex-col items-center gap-5 text-center md:flex-row md:items-end md:text-left">
          {loading ? (
            <div className="skeleton h-48 w-48 shrink-0 rounded-full md:h-56 md:w-56" />
          ) : (
            <CoverImage
              src={artist.image?.url}
              alt={artist.name}
              rounded
              icon={User}
              className="h-48 w-48 shrink-0 shadow-[0_4px_60px_rgba(0,0,0,0.5)] md:h-56 md:w-56"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold">Artist</p>
            {loading ? (
              <div className="skeleton mt-3 h-12 w-72" />
            ) : (
              <>
                <h1 className="my-2 line-clamp-2 text-4xl font-black tracking-tight md:text-7xl lg:text-8xl">{artist.name}</h1>
                {artist.bio && <p className="max-w-2xl text-sm text-white/70">{artist.bio}</p>}
              </>
            )}
          </div>
        </header>

        {loading && <SongListSkeleton />}

        {artist && (
          <>
            <PlayAllButtons songs={artist.topSongs} />

            <Section title="Popular">
              {artist.topSongs.length ? <SongList songs={artist.topSongs} /> : <p className="text-sm text-muted">No songs yet.</p>}
            </Section>

            {artist.albums.length > 0 && (
              <Section title="Discography">
                <div className="-mx-3 flex gap-1 overflow-x-auto pb-2">
                  {artist.albums.map((a) => (
                    <MediaCard
                      key={a.id}
                      to={`/albums/${a.id}`}
                      image={a.coverImage?.url}
                      title={a.title}
                      subtitle={a.releaseYear ? String(a.releaseYear) : "Album"}
                      onPlay={() => playAlbumById(a.id)}
                    />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
