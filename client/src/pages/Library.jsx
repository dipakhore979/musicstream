import { useState } from "react";
import { Plus } from "lucide-react";
import ItemCover from "../components/library/ItemCover.jsx";
import MediaCard from "../components/music/MediaCard.jsx";
import { GridSkeleton } from "../components/music/Skeletons.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useLibraryItems } from "../hooks/useLibraryItems.js";
import { useCreatePlaylist } from "../hooks/useCreatePlaylist.js";

const CHIPS = [
  { id: "all", label: "All" },
  { id: "playlists", label: "Playlists" },
  { id: "albums", label: "Albums" },
  { id: "artists", label: "Artists" },
];

export default function Library() {
  const [filter, setFilter] = useState("all");
  const { items, loading } = useLibraryItems(filter);
  const createPlaylist = useCreatePlaylist();

  return (
    <div className="px-4 pb-8 pt-6 md:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Your Library</h1>
        <button onClick={createPlaylist} className="btn-outline">
          <Plus size={16} /> Create playlist
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            aria-pressed={filter === c.id}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
              filter === c.id ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <GridSkeleton count={8} />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing here yet" message="Create a playlist or like some songs to get started." />
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <MediaCard
              key={item.key}
              to={item.to}
              title={item.title}
              subtitle={item.subtitle}
              round={item.round}
              fluid
              onPlay={item.onPlay}
              cover={<ItemCover item={item} className="h-full w-full" />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
