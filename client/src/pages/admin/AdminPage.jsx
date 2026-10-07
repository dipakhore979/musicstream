import { useState } from "react";
import { useAdminOptions } from "../../hooks/useAdminOptions.js";
import AdminSongs from "./AdminSongs.jsx";
import AdminAlbums from "./AdminAlbums.jsx";
import AdminArtists from "./AdminArtists.jsx";

const TABS = [
  { id: "songs", label: "Songs" },
  { id: "albums", label: "Albums" },
  { id: "artists", label: "Artists" },
];

export default function AdminPage() {
  const [tab, setTab] = useState("songs");
  const options = useAdminOptions();

  return (
    <div className="p-4 pb-8 md:p-8">
      <h1 className="mb-1 text-2xl font-bold md:text-3xl">Admin panel</h1>
      <p className="mb-5 text-sm text-muted">
        Create artists first, then albums, then upload songs.
      </p>

      <div role="tablist" className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-white text-black" : "bg-surface-highlight hover:bg-white/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "songs" && <AdminSongs {...options} />}
      {tab === "albums" && <AdminAlbums {...options} />}
      {tab === "artists" && <AdminArtists {...options} />}
    </div>
  );
}
