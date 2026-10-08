import { Suspense, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import MobileNav from "./MobileNav.jsx";
import PlayerBar from "./PlayerBar.jsx";
import TopBar from "./TopBar.jsx";
import OfflineBanner from "./OfflineBanner.jsx";
import AudioEngine from "../player/AudioEngine.jsx";
import QueuePanel from "../player/QueuePanel.jsx";
import NowPlayingSheet from "../player/NowPlayingSheet.jsx";
import ErrorBoundary from "../ui/ErrorBoundary.jsx";
import { PageSpinner } from "../ui/Spinner.jsx";
import { useLibraryStore } from "../../store/libraryStore.js";
import { useOfflineStore } from "../../store/offlineStore.js";
import { useAuthStore } from "../../store/authStore.js";
import { useSearchHistoryStore } from "../../store/searchHistoryStore.js";

// This layout stays mounted while routes change inside <Outlet />, so the player never restarts.
export default function AppLayout() {
  const load = useLibraryStore((s) => s.load);
  const reset = useLibraryStore((s) => s.reset);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const initOffline = useOfflineStore((s) => s.init);

  // Read this account's downloaded songs from device storage.
  useEffect(() => {
    if (userId) initOffline(userId);
  }, [userId, initOffline]);

  // Opened with no connection? Go straight to the songs that work without one.
  useEffect(() => {
    if (!navigator.onLine && window.location.pathname === "/") navigate("/downloads", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load likes + playlists once per session; clear them on logout (when this layout unmounts).
  useEffect(() => {
    load();
    return () => {
      reset();
      useSearchHistoryStore.getState().clear();
    };
  }, [load, reset]);

  // New page: scroll back to the top.
  useEffect(() => {
    document.getElementById("main")?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-full flex-col bg-black">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:font-sans focus:text-sm focus:text-black"
      >
        Skip to content
      </a>
      <OfflineBanner />
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto bg-black outline-none">
          {/* A crash on one page shouldn't take down the sidebar or the music; pages also load lazily. */}
          <ErrorBoundary compact resetKey={pathname}>
            <Suspense fallback={<PageSpinner />}>
              <div key={pathname} className="animate-fade-up min-h-full">
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <PlayerBar />
      <MobileNav />

      <AudioEngine />
      <QueuePanel />
      <NowPlayingSheet />
    </div>
  );
}
