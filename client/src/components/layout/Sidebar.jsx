import { NavLink } from "react-router-dom";
import { Disc3, Heart, Music, Podcast, ShieldCheck, SquarePlus, Users } from "lucide-react";
import toast from "react-hot-toast";
import SearchInput from "../search/SearchInput.jsx";
import { NAV_ITEMS } from "./navItems.js";
import { useAuthStore } from "../../store/authStore.js";
import { useLibraryStore } from "../../store/libraryStore.js";
import { useCreatePlaylist } from "../../hooks/useCreatePlaylist.js";
import { useInstallApp } from "../../hooks/useInstallApp.js";

// Main links (serif, bold)
const primaryClass = ({ isActive }) =>
  `flex items-center gap-4 rounded-sm px-3 py-2.5 text-sm font-bold transition-colors hover:text-white ${
    isActive ? "text-white" : "text-white/80"
  }`;

// Secondary list (sans-serif, small, highlighted on hover)
const rowClass = ({ isActive }) =>
  `flex w-full items-center gap-4 rounded-sm px-3 py-3 text-left transition-colors hover:bg-[#1c1c1c] hover:text-white ${
    isActive ? "bg-[#1c1c1c] text-white" : "text-muted"
  }`;

export default function Sidebar() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const playlists = useLibraryStore((s) => s.playlists);
  const createPlaylist = useCreatePlaylist();
  const { installed, install } = useInstallApp();
  const [home, search, library] = NAV_ITEMS;

  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-white/10 bg-black md:flex lg:w-56">
      <div className="px-4 pb-4 pt-5">
        <SearchInput id="sidebar-search" compact />
      </div>

      <nav className="flex flex-col px-2 pb-3">
        {[home, search, library].map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={primaryClass}>
            <Icon size={18} />
            {label === "Library" ? "Your Library" : label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-2 border-t border-white/20" />

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3 font-sans text-xs">
        <button onClick={createPlaylist} className={rowClass({ isActive: false })}>
          <SquarePlus size={18} /> Create Playlist
        </button>
        <NavLink to="/liked" className={rowClass}>
          <Heart size={18} /> Liked Songs
        </NavLink>

        {playlists.map((p) => (
          <NavLink key={p.id} to={`/playlists/${p.id}`} className={rowClass}>
            <Music size={18} className="shrink-0" />
            <span className="truncate">{p.name}</span>
          </NavLink>
        ))}

        <NavLink to="/browse/albums" className={rowClass}>
          <Disc3 size={18} /> Albums
        </NavLink>
        <NavLink to="/browse/artists" className={rowClass}>
          <Users size={18} /> Artists
        </NavLink>
        <button onClick={() => toast("Podcasts are coming soon")} className={rowClass({ isActive: false })}>
          <Podcast size={18} /> Podcasts
        </button>
        {isAdmin && (
          <NavLink to="/admin" className={rowClass}>
            <ShieldCheck size={18} /> Admin panel
          </NavLink>
        )}
      </nav>

      {/* Hidden once the app is installed */}
      {!installed && (
        <>
          <div className="mx-2 border-t border-white/20" />
          <div className="p-5">
            <button
              onClick={install}
              className="rounded-full border border-white/30 px-5 py-2 font-sans text-xs text-white transition hover:border-white hover:bg-white/10"
            >
              Install App
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
