import { useCallback, useEffect, useState } from "react";
import { api, getErrorMessage } from "../lib/api.js";
import toast from "react-hot-toast";

// Artists/albums for the admin <select> dropdowns (first 100 of each).
export function useAdminOptions() {
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);

  const reload = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        api.get("/artists", { params: { limit: 100 } }),
        api.get("/albums", { params: { limit: 100 } }),
      ]);
      setArtists(a.data.data);
      setAlbums(b.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { artists, albums, reload };
}
