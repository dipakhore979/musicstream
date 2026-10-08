import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuthStore } from "../store/authStore.js";
import { useLibraryStore } from "../store/libraryStore.js";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import HeroBackdrop from "../components/ui/HeroBackdrop.jsx";
import { LikedCover } from "../components/library/ItemCover.jsx";
import SongList from "../components/music/SongList.jsx";
import PlayAllButtons from "../components/music/PlayAllButtons.jsx";
import DownloadAllButton from "../components/music/DownloadAllButton.jsx";
import { SongListSkeleton } from "../components/music/Skeletons.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import LoadMore from "../components/ui/LoadMore.jsx";

export default function LikedSongsPage() {
  const user = useAuthStore((s) => s.user);
  const total = useLibraryStore((s) => s.likedIds.size);
  const list = usePaginatedList("/likes", {}, { limit: 50 });

  // Rows stay visible if you un-like them here (so a mis-click is easy to undo); they vanish on next visit.
  const empty = !list.loading && !list.error && list.items.length === 0;

  return (
    <div className="relative min-h-full">
      <HeroBackdrop color="rgb(80, 56, 160)" />

      <div className="relative px-4 pb-8 pt-8 md:px-8">
        <header className="mb-6 flex flex-col items-center gap-5 text-center md:flex-row md:items-end md:text-left">
          <LikedCover className="h-48 w-48 shrink-0 shadow-[0_4px_60px_rgba(0,0,0,0.5)] md:h-56 md:w-56" iconSize="40%" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Playlist</p>
            <h1 className="my-2 text-4xl font-black tracking-tight md:text-6xl lg:text-7xl">Liked Songs</h1>
            <p className="text-sm">
              <span className="font-bold">{user?.name}</span>
              <span className="text-white/70"> • {total} song{total === 1 ? "" : "s"}</span>
            </p>
          </div>
        </header>

        {list.loading && <SongListSkeleton count={6} />}
        {list.error && (
          <EmptyState title="Couldn't load your liked songs" message={list.error}
            action={<button className="btn-outline" onClick={list.reload}>Try again</button>} />
        )}
        {empty && (
          <EmptyState
            icon={Heart}
            title="Songs you like will appear here"
            message="Save songs by tapping the heart icon."
            action={<Link to="/browse/songs" className="btn-primary">Browse songs</Link>}
          />
        )}
        {list.items.length > 0 && (
          <>
            <PlayAllButtons songs={list.items}>
              <DownloadAllButton songs={list.items} />
            </PlayAllButtons>
            <SongList songs={list.items} showHeader />
            <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
          </>
        )}
      </div>
    </div>
  );
}
