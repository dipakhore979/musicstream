import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getErrorMessage } from "../lib/api.js";
import { useLibraryStore } from "../store/libraryStore.js";

// Creates "My Playlist #N" and jumps straight to it, where the name can be edited.
export function useCreatePlaylist() {
  const navigate = useNavigate();
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);

  return useCallback(async () => {
    try {
      const playlist = await createPlaylist();
      navigate(`/playlists/${playlist.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, [createPlaylist, navigate]);
}
