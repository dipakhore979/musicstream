import toast from "react-hot-toast";
import { getErrorMessage } from "./api.js";
import { downloadSongs } from "./download.js";
import { useOfflineStore } from "../store/offlineStore.js";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function friendlyError(err) {
  if (err?.name === "QuotaExceededError") return "Your device is out of storage space. Remove some downloads and try again.";
  return err?.userMessage || err?.message || getErrorMessage(err);
}

// Option 1: save inside the app (plays offline in MusicStream itself).
export async function downloadInApp(songs) {
  const { ids } = useOfflineStore.getState();
  const todo = songs.filter((s) => s.downloadable !== false && !ids.has(s.id));
  if (!todo.length) {
    toast("Everything here is already downloaded in the app.");
    return;
  }

  const id = toast.loading(`Downloading ${plural(todo.length, "song")}…`);
  try {
    const { done, failed, lastError } = await useOfflineStore.getState().download(todo, ({ index, total, pct, song }) =>
      toast.loading(`Downloading ${index + 1}/${total}: ${song.title} (${pct}%)`, { id })
    );
    if (done === 0) toast.error(friendlyError(lastError), { id });
    else if (failed > 0) toast.success(`Downloaded ${done}, but ${failed} failed. ${friendlyError(lastError)}`, { id, duration: 6000 });
    else toast.success(`Downloaded ${plural(done, "song")}. They'll play without internet.`, { id });
  } catch (err) {
    toast.error(friendlyError(err), { id });
  }
}

// Option 2: save audio files into the device's Downloads folder.
export async function saveToDevice(songs) {
  const allowed = songs.filter((s) => s.downloadable !== false);
  if (!allowed.length) {
    toast.error("Downloads are turned off for this music");
    return;
  }
  if (
    allowed.length > 1 &&
    !window.confirm(`Save ${allowed.length} songs to your device? Your browser may ask permission to download multiple files.`)
  ) {
    return;
  }

  const id = toast.loading(`Starting ${plural(allowed.length, "download")}…`);
  try {
    const { done, failed } = await downloadSongs(allowed, (d, total) => toast.loading(`Saving ${d}/${total}…`, { id }));
    if (failed === done) toast.error("Couldn't start the downloads. Please try again.", { id });
    else toast.success(`Started ${plural(done - failed, "download")}. Check your Downloads folder.`, { id });
  } catch (err) {
    toast.error(friendlyError(err), { id });
  }
}

export async function removeFromApp(songIds) {
  try {
    await useOfflineStore.getState().removeMany(songIds);
    toast.success(songIds.length === 1 ? "Removed from app downloads" : "Removed app downloads");
  } catch (err) {
    toast.error(friendlyError(err));
  }
}
