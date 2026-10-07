import { Link } from "react-router-dom";
import { Disc3 } from "lucide-react";
import { useAuthStore } from "../store/authStore.js";
import { useLibraryStore } from "../store/libraryStore.js";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import { playAlbumById, playArtistById, playPlaylistById } from "../lib/playback.js";
import ItemCover from "../components/library/ItemCover.jsx";
import Section from "../components/music/Section.jsx";
import MediaCard from "../components/music/MediaCard.jsx";
import SongList from "../components/music/SongList.jsx";
import { GridSkeleton, SongListSkeleton } from "../components/music/Skeletons.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const GRID = "grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-4";
const ErrorLine = ({ message }) => <p className="text-sm text-red-400">Couldn't load this section: {message}</p>;

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const playlists = useLibraryStore((s) => s.playlists);
  const albums = usePaginatedList("/albums", {}, { limit: 8 });
  const artists = usePaginatedList("/artists", {}, { limit: 8 });
  const songs = usePaginatedList("/songs", { sort: "newest" }, { limit: 8 });

  const loaded = !albums.loading && !artists.loading && !songs.loading;
  const nothing = loaded && !albums.error && !artists.error && !songs.error && albums.total + artists.total + songs.total === 0;

  return (
    <div className="px-4 pb-10 pt-6 md:px-8">
      <h1 className="mb-8 text-3xl font-bold md:text-4xl">Enjoy Your Music</h1>

      {nothing ? (
        <EmptyState
          icon={Disc3}
          title="No music yet"
          message={
            user?.role === "admin"
              ? "Upload your first songs from the admin panel."
              : "An admin hasn't uploaded any music yet. Check back soon."
          }
          action={user?.role === "admin" && <Link to="/admin" className="btn-primary">Open admin panel</Link>}
        />
      ) : (
        <>
          {playlists.length > 0 && (
            <Section title="Your Playlists" showAllTo="/library">
              <div className={GRID}>
                {playlists.slice(0, 4).map((p) => {
                  const item = { kind: "playlist", covers: p.covers };
                  return (
                    <MediaCard
                      key={p.id}
                      to={`/playlists/${p.id}`}
                      title={p.name}
                      subtitle={p.description || `${p.songCount} song${p.songCount === 1 ? "" : "s"}`}
                      fluid
                      cover={<ItemCover item={item} className="h-full w-full" />}
                      onPlay={() => playPlaylistById(p.id)}
                    />
                  );
                })}
              </div>
            </Section>
          )}

          <Section title="Albums" showAllTo="/browse/albums">
            {albums.loading ? <GridSkeleton count={4} /> : albums.error ? <ErrorLine message={albums.error} /> : (
              <div className={GRID}>
                {albums.items.map((a) => (
                  <MediaCard
                    key={a.id}
                    to={`/albums/${a.id}`}
                    image={a.coverImage?.url}
                    title={a.title}
                    subtitle={a.description || [a.releaseYear, a.artist?.name].filter(Boolean).join(" • ")}
                    fluid
                    onPlay={() => playAlbumById(a.id)}
                  />
                ))}
                {albums.items.length === 0 && <p className="text-sm text-muted">No albums yet.</p>}
              </div>
            )}
          </Section>

          <Section title="Artists" showAllTo="/browse/artists">
            {artists.loading ? <GridSkeleton count={4} /> : artists.error ? <ErrorLine message={artists.error} /> : (
              <div className={GRID}>
                {artists.items.map((a) => (
                  <MediaCard
                    key={a.id}
                    to={`/artists/${a.id}`}
                    image={a.image?.url}
                    title={a.name}
                    subtitle={a.bio || "Artist"}
                    fluid
                    onPlay={() => playArtistById(a.id)}
                  />
                ))}
                {artists.items.length === 0 && <p className="text-sm text-muted">No artists yet.</p>}
              </div>
            )}
          </Section>

          <Section title="Recently Added" showAllTo="/browse/songs">
            {songs.loading ? <SongListSkeleton /> : songs.error ? <ErrorLine message={songs.error} /> : (
              songs.items.length ? <SongList songs={songs.items} showHeader /> : <p className="text-sm text-muted">No songs yet.</p>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
