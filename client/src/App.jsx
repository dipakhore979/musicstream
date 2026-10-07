import { lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import GuestRoute from "./components/auth/GuestRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import NotFound from "./pages/NotFound.jsx";
import InfoPage from "./pages/InfoPage.jsx";
import { useAuthStore } from "./store/authStore.js";

// Everything except the first screens loads on demand, which keeps the initial download small.
const Search = lazy(() => import("./pages/Search.jsx"));
const Library = lazy(() => import("./pages/Library.jsx"));
const AlbumPage = lazy(() => import("./pages/AlbumPage.jsx"));
const ArtistPage = lazy(() => import("./pages/ArtistPage.jsx"));
const PlaylistPage = lazy(() => import("./pages/PlaylistPage.jsx"));
const LikedSongsPage = lazy(() => import("./pages/LikedSongsPage.jsx"));
const Browse = lazy(() => import("./pages/Browse.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const DownloadPage = lazy(() => import("./pages/DownloadPage.jsx"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage.jsx"));

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  // Restore the session once when the app loads.
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        {/* AppLayout stays mounted across navigation, which keeps the player alive. */}
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="library" element={<Library />} />
          <Route path="liked" element={<LikedSongsPage />} />
          <Route path="playlists/:id" element={<PlaylistPage />} />
          <Route path="albums/:id" element={<AlbumPage />} />
          <Route path="artists/:id" element={<ArtistPage />} />
          <Route path="browse/:type" element={<Browse />} />
          <Route path="profile" element={<Profile />} />
          <Route path="premium" element={<InfoPage title="MusicStream Premium"><p>This is a portfolio project, so there is no paid plan. Everything is free to listen to.</p></InfoPage>} />
          <Route path="support" element={<InfoPage title="Support"><p>Questions or problems? Contact the site administrator.</p></InfoPage>} />
          <Route path="download" element={<DownloadPage />} />

          {/* Non-admins who open /admin are redirected Home; the API enforces the role too. */}
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
