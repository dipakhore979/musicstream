import { api } from "./api.js";
import { usePlayerStore } from "../store/playerStore.js";

// Used by the hover play buttons on cards: fetch the songs, then start playing them.
export async function playAlbumById(id) {
  const { data } = await api.get(`/albums/${id}`);
  const songs = data.data.songs;
  if (!songs.length) throw new Error("This album has no songs yet");
  usePlayerStore.getState().playSongs(songs, 0);
}

export async function playArtistById(id) {
  const { data } = await api.get(`/artists/${id}`);
  const songs = data.data.topSongs;
  if (!songs.length) throw new Error("This artist has no songs yet");
  usePlayerStore.getState().playSongs(songs, 0);
}

export async function playPlaylistById(id) {
  const { data } = await api.get(`/playlists/${id}`);
  const songs = data.data.songs;
  if (!songs.length) throw new Error("This playlist is empty");
  usePlayerStore.getState().playSongs(songs, 0);
}

export async function playLikedSongs() {
  const { data } = await api.get("/likes", { params: { limit: 100 } });
  if (!data.data.length) throw new Error("You haven't liked any songs yet");
  usePlayerStore.getState().playSongs(data.data, 0);
}
