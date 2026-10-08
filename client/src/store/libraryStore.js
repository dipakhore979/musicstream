import { create } from "zustand";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../lib/api.js";

// The user's library: which songs they've liked (for every heart in the UI) and their playlists.
export const useLibraryStore = create((set, get) => ({
  likedIds: new Set(),
  playlists: [],
  loaded: false,

  load: async () => {
    try {
      const [likes, lists] = await Promise.all([
        api.get("/likes/ids"),
        api.get("/playlists", { params: { limit: 100 } }),
      ]);
      set({ likedIds: new Set(likes.data.data), playlists: lists.data.data, loaded: true });
    } catch (err) {
      set({ loaded: true });
      if (err.response) toast.error(getErrorMessage(err)); // stay quiet when simply offline
    }
  },

  reset: () => set({ likedIds: new Set(), playlists: [], loaded: false }),

  refreshPlaylists: async () => {
    try {
      const { data } = await api.get("/playlists", { params: { limit: 100 } });
      set({ playlists: data.data });
    } catch {
      /* the sidebar list will refresh on the next action */
    }
  },

  // ---- likes (optimistic: the heart flips instantly, and rolls back if the request fails) ----
  toggleLike: async (song) => {
    const wasLiked = get().likedIds.has(song.id);
    const apply = (liked) =>
      set((s) => {
        const next = new Set(s.likedIds);
        liked ? next.add(song.id) : next.delete(song.id);
        return { likedIds: next };
      });

    apply(!wasLiked);
    try {
      if (wasLiked) await api.delete(`/likes/${song.id}`);
      else await api.put(`/likes/${song.id}`);
      toast.success(wasLiked ? "Removed from Liked Songs" : "Added to Liked Songs");
    } catch (err) {
      apply(wasLiked);
      toast.error(getErrorMessage(err));
    }
  },

  // ---- playlists ----
  createPlaylist: async (payload = {}) => {
    const { data } = await api.post("/playlists", payload);
    set((s) => ({ playlists: [data.data, ...s.playlists] }));
    return data.data;
  },

  updatePlaylist: async (id, patch) => {
    const { data } = await api.patch(`/playlists/${id}`, patch);
    set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? { ...p, ...data.data } : p)) }));
    return data.data;
  },

  deletePlaylist: async (id) => {
    await api.delete(`/playlists/${id}`);
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
  },

  addSongToPlaylist: async (playlistId, song) => {
    await api.post(`/playlists/${playlistId}/songs`, { songId: song.id });
    get().refreshPlaylists(); // updates song counts and cover mosaics
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    await api.delete(`/playlists/${playlistId}/songs/${songId}`);
    get().refreshPlaylists();
  },
}));
