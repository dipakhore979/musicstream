import { api } from "./api.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The link points at a file that the server flagged as "attachment", so the browser saves it
// to the Downloads folder instead of opening a player.
function saveFromUrl(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadSong(song) {
  if (song.downloadable === false) throw new Error("Downloads are turned off for this song");
  const { data } = await api.get(`/songs/${song.id}/download`);
  saveFromUrl(data.data.url, data.data.filename);
}

// One file per song, started a moment apart. Browsers may ask once to allow multiple downloads.
export async function downloadSongs(songs, onProgress) {
  let done = 0;
  let failed = 0;
  for (const song of songs) {
    try {
      await downloadSong(song);
    } catch {
      failed++;
    }
    done++;
    onProgress?.(done, songs.length);
    if (done < songs.length) await sleep(800);
  }
  return { done, failed };
}
