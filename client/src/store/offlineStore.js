import { create } from "zustand";
import { useAuthStore } from "./authStore.js";
import * as db from "../lib/offlineDb.js";

const keyOf = (userId, songId) => `${userId}:${songId}`;

async function ensureSpace(bytes) {
  if (!bytes || !navigator.storage?.estimate) return;
  const { quota = 0, usage = 0 } = await navigator.storage.estimate();
  if (quota && quota - usage < bytes * 1.1) {
    const error = new Error("Not enough storage space on this device");
    error.name = "QuotaExceededError";
    throw error;
  }
}

// Downloads the audio into memory while reporting progress (0-100).
async function fetchAudio(url, onProgress) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    // A network failure, or the audio host refusing cross-origin reads.
    throw new Error("Couldn't download inside the app. Check your connection, or use “Save to device”.");
  }
  if (!response.ok) throw new Error(`Download failed (${response.status})`);

  const total = Number(response.headers.get("content-length")) || 0;
  await ensureSpace(total);

  const type = response.headers.get("content-type") || "audio/mpeg";
  if (!response.body || !total) {
    const blob = await response.blob();
    onProgress?.(100);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress?.(Math.min(100, Math.round((received / total) * 100)));
  }
  return new Blob(chunks, { type });
}

// Songs the current user saved INSIDE the app for offline playback.
export const useOfflineStore = create((set, get) => ({
  userId: null,
  songs: [], // full song objects, newest download first
  ids: new Set(), // fast "is this downloaded?" lookups for hearts, rows and menus
  bytes: 0,
  ready: false,
  unsupported: false, // e.g. private windows that block IndexedDB
  busy: new Set(), // songs being downloaded right now

  init: async (userId) => {
    try {
      const rows = (await db.getAllMeta()).filter((r) => r.userId === userId).sort((a, b) => b.savedAt - a.savedAt);
      set({
        userId,
        songs: rows.map((r) => r.song),
        ids: new Set(rows.map((r) => r.song.id)),
        bytes: rows.reduce((sum, r) => sum + r.size, 0),
        ready: true,
        unsupported: false,
      });
    } catch {
      set({ userId, songs: [], ids: new Set(), bytes: 0, ready: true, unsupported: true });
    }
  },

  // Downloads one song after another. onProgress({ index, total, pct, song }) fires when the % changes.
  download: async (songs, onProgress) => {
    const userId = get().userId ?? useAuthStore.getState().user?.id;
    if (!userId) throw new Error("Please log in first");
    if (get().unsupported) {
      throw new Error("Offline downloads aren't available in this browser mode (private windows often block them)");
    }

    // Ask the browser not to clear our downloads when it needs space (it may say no).
    navigator.storage?.persist?.()?.catch?.(() => {});

    let done = 0;
    let failed = 0;
    let lastError = null;

    for (let index = 0; index < songs.length; index++) {
      const song = songs[index];
      if (get().busy.has(song.id)) continue;
      set((s) => ({ busy: new Set(s.busy).add(song.id) }));

      try {
        let lastPct = -1;
        const blob = await fetchAudio(song.audio.url, (pct) => {
          if (pct === lastPct) return;
          lastPct = pct;
          onProgress?.({ index, total: songs.length, pct, song });
        });
        await db.putSong({ key: keyOf(userId, song.id), userId, song, size: blob.size, savedAt: Date.now() }, blob);
        set((s) => ({
          songs: [song, ...s.songs.filter((x) => x.id !== song.id)],
          ids: new Set(s.ids).add(song.id),
          bytes: s.bytes + blob.size,
        }));
        done++;
      } catch (err) {
        failed++;
        lastError = err;
      } finally {
        set((s) => {
          const busy = new Set(s.busy);
          busy.delete(song.id);
          return { busy };
        });
      }
    }
    return { done, failed, lastError };
  },

  removeMany: async (songIds) => {
    const { userId } = get();
    if (!userId || !songIds.length) return;
    await db.deleteSongs(songIds.map((id) => keyOf(userId, id)));
    await get().init(userId); // re-read, so counts and sizes stay exact
  },

  remove: (songId) => get().removeMany([songId]),
  clearAll: () => get().removeMany(get().songs.map((s) => s.id)),
}));

// A temporary blob: URL for the player, or null when the song isn't saved (or its copy has gone missing).
export async function getOfflineAudioUrl(songId) {
  const { ids, userId } = useOfflineStore.getState();
  if (!userId || !ids.has(songId)) return null;
  try {
    const blob = await db.getBlob(keyOf(userId, songId));
    if (!blob) {
      useOfflineStore.getState().remove(songId); // the browser cleared it; fix our records
      return null;
    }
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
