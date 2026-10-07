import { useMemo } from "react";
import { usePaginatedList } from "./usePaginatedList.js";
import { useLibraryStore } from "../store/libraryStore.js";
import { playAlbumById, playArtistById, playLikedSongs, playPlaylistById } from "../lib/playback.js";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// One unified list (Liked Songs, playlists, albums, artists) used by the sidebar and the Library page.
export function useLibraryItems(filter = "all") {
  const playlists = useLibraryStore((s) => s.playlists);
  const likedCount = useLibraryStore((s) => s.likedIds.size);
  const loadedLibrary = useLibraryStore((s) => s.loaded);
  const albums = usePaginatedList("/albums", {}, { limit: 50 });
  const artists = usePaginatedList("/artists", {}, { limit: 50 });

  const items = useMemo(() => {
    const liked = {
      key: "liked", kind: "liked", to: "/liked", title: "Liked Songs",
      subtitle: `Playlist • ${plural(likedCount, "song")}`, onPlay: playLikedSongs,
    };
    const pl = playlists.map((p) => ({
      key: `p-${p.id}`, kind: "playlist", to: `/playlists/${p.id}`, covers: p.covers, title: p.name,
      subtitle: `Playlist • ${plural(p.songCount, "song")}`, onPlay: () => playPlaylistById(p.id),
    }));
    const al = albums.items.map((a) => ({
      key: `a-${a.id}`, kind: "album", to: `/albums/${a.id}`, image: a.coverImage?.url, title: a.title,
      subtitle: `Album • ${a.artist?.name ?? ""}`, onPlay: () => playAlbumById(a.id),
    }));
    const ar = artists.items.map((a) => ({
      key: `r-${a.id}`, kind: "artist", to: `/artists/${a.id}`, image: a.image?.url, title: a.name,
      subtitle: "Artist", round: true, onPlay: () => playArtistById(a.id),
    }));

    if (filter === "playlists") return [liked, ...pl];
    if (filter === "albums") return al;
    if (filter === "artists") return ar;
    return [liked, ...pl, ...al, ...ar];
  }, [playlists, likedCount, albums.items, artists.items, filter]);

  return {
    items,
    loading: albums.loading || artists.loading || !loadedLibrary,
    reloadCatalog: () => {
      albums.reload();
      artists.reload();
    },
  };
}
