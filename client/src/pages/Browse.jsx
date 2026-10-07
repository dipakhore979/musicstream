import { useParams } from "react-router-dom";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import MediaCard from "../components/music/MediaCard.jsx";
import SongList from "../components/music/SongList.jsx";
import { GridSkeleton, SongListSkeleton } from "../components/music/Skeletons.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import LoadMore from "../components/ui/LoadMore.jsx";
import NotFound from "./NotFound.jsx";
import { playAlbumById, playArtistById } from "../lib/playback.js";

const CONFIG = {
  albums: { title: "Albums", url: "/albums", params: {} },
  artists: { title: "Artists", url: "/artists", params: {} },
  songs: { title: "All songs", url: "/songs", params: { sort: "newest" } },
};

function BrowseList({ type }) {
  const cfg = CONFIG[type];
  const list = usePaginatedList(cfg.url, cfg.params, { limit: 24 });

  return (
    <div className="p-4 pb-8 md:p-8">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{cfg.title}</h1>

      {list.loading && (type === "songs" ? <SongListSkeleton count={8} /> : <GridSkeleton />)}
      {list.error && <EmptyState title="Something went wrong" message={list.error} action={<button className="btn-outline" onClick={list.reload}>Try again</button>} />}
      {!list.loading && !list.error && list.items.length === 0 && (
        <EmptyState title={`No ${type} yet`} message="Nothing has been added here yet." />
      )}

      {!list.loading && list.items.length > 0 && (
        <>
          {type === "songs" && <SongList songs={list.items} showHeader />}
          {type === "albums" && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {list.items.map((a) => (
                <MediaCard key={a.id} to={`/albums/${a.id}`} image={a.coverImage?.url} title={a.title}
                  subtitle={[a.releaseYear, a.artist?.name].filter(Boolean).join(" • ")} fluid
                  onPlay={() => playAlbumById(a.id)} />
              ))}
            </div>
          )}
          {type === "artists" && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {list.items.map((a) => (
                <MediaCard key={a.id} to={`/artists/${a.id}`} image={a.image?.url} title={a.name} subtitle="Artist" round fluid
                  onPlay={() => playArtistById(a.id)} />
              ))}
            </div>
          )}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
        </>
      )}
    </div>
  );
}

export default function Browse() {
  const { type } = useParams();
  if (!CONFIG[type]) return <NotFound />;
  // key resets the list state when switching between albums/artists/songs
  return <BrowseList key={type} type={type} />;
}
