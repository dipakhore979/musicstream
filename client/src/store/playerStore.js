import { create } from "zustand";
import { persist } from "zustand/middleware";
import { audio } from "../lib/audio.js";

// currentTime/duration update ~4x per second, so they live in their own store.
// Only components that select them (the seek bar) re-render, and nothing gets persisted on every tick.
export const useProgressStore = create(() => ({ currentTime: 0, duration: 0, buffering: false }));

function shuffleArray(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const selectCurrentSong = (s) => s.queue[s.currentIndex] ?? null;

/*
  queue         the order songs will actually play in (what the Queue panel shows)
  originalQueue the un-shuffled order, so turning shuffle off restores it
                (when shuffle is off it simply mirrors `queue`)
  playId        bumped whenever a *new track must start loading*. The audio engine reloads on this,
                which also handles the same song appearing twice in a row.
*/
export const usePlayerStore = create(
  persist(
    (set, get) => ({
      queue: [],
      originalQueue: [],
      currentIndex: -1,
      playId: 0,
      isPlaying: false,

      shuffle: false,
      repeat: "off", // "off" | "all" | "one"
      volume: 0.8,
      muted: false,

      queueOpen: false,
      sheetOpen: false,

      // ---------- starting playback ----------
      playSongs: (songs, startIndex = 0) => {
        if (!songs?.length) return;
        const idx = Math.min(Math.max(startIndex, 0), songs.length - 1);
        let queue = songs;
        let index = idx;
        if (get().shuffle) {
          // Keep the chosen song first, shuffle the rest.
          queue = [songs[idx], ...shuffleArray(songs.filter((_, i) => i !== idx))];
          index = 0;
        }
        set((s) => ({ queue, originalQueue: songs, currentIndex: index, isPlaying: true, playId: s.playId + 1 }));
      },

      playShuffled: (songs) => {
        if (!songs?.length) return;
        set({ shuffle: true });
        get().playSongs(songs, Math.floor(Math.random() * songs.length));
      },

      playFromQueue: (index) => {
        if (index < 0 || index >= get().queue.length) return;
        set((s) => ({ currentIndex: index, isPlaying: true, playId: s.playId + 1 }));
      },

      // ---------- transport ----------
      togglePlay: () => {
        const s = get();
        if (!selectCurrentSong(s)) return;
        set({ isPlaying: !s.isPlaying });
      },

      next: ({ auto = false } = {}) => {
        const { queue, currentIndex, repeat } = get();
        if (!queue.length) return;

        // Repeat-one only applies when a track ends by itself; pressing Next still skips.
        if (auto && repeat === "one") {
          audio.currentTime = 0;
          audio.play().catch(() => {});
          return;
        }
        if (currentIndex < queue.length - 1) {
          set((s) => ({ currentIndex: s.currentIndex + 1, isPlaying: true, playId: s.playId + 1 }));
        } else if (repeat === "all") {
          set((s) => ({ currentIndex: 0, isPlaying: true, playId: s.playId + 1 }));
        } else if (auto) {
          // Reached the end of the queue: stop and rewind the last track.
          audio.currentTime = 0;
          set({ isPlaying: false });
          useProgressStore.setState({ currentTime: 0 });
        }
      },

      previous: () => {
        const { queue, currentIndex, repeat } = get();
        if (!queue.length) return;
        // Like Spotify: after 3 seconds, "previous" restarts the track instead of going back.
        if (audio.currentTime > 3 || (currentIndex === 0 && repeat !== "all")) {
          get().seek(0);
          return;
        }
        const index = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
        set((s) => ({ currentIndex: index, isPlaying: true, playId: s.playId + 1 }));
      },

      seek: (time) => {
        if (!Number.isFinite(time)) return;
        audio.currentTime = Math.max(0, time);
        useProgressStore.setState({ currentTime: audio.currentTime });
      },

      // ---------- modes & volume ----------
      toggleShuffle: () => {
        const { shuffle, queue, originalQueue, currentIndex } = get();
        const current = queue[currentIndex];

        if (!shuffle) {
          if (!current) return set({ shuffle: true });
          const rest = queue.filter((_, i) => i !== currentIndex);
          set({ shuffle: true, originalQueue: queue, queue: [current, ...shuffleArray(rest)], currentIndex: 0 });
        } else {
          if (!current) return set({ shuffle: false });
          const at = originalQueue.indexOf(current);
          set({ shuffle: false, queue: originalQueue, currentIndex: at >= 0 ? at : 0 });
        }
      },

      cycleRepeat: () => set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),

      setVolume: (v) => {
        const volume = Math.min(1, Math.max(0, v));
        set({ volume, muted: volume === 0 });
      },
      toggleMute: () => set((s) => ({ muted: !s.muted })),

      // ---------- queue editing ----------
      addToQueue: (song) => {
        if (!selectCurrentSong(get())) return get().playSongs([song]);
        set((s) => {
          const queue = [...s.queue, song];
          return { queue, originalQueue: s.shuffle ? [...s.originalQueue, song] : queue };
        });
      },

      playNext: (song) => {
        if (!selectCurrentSong(get())) return get().playSongs([song]);
        set((s) => {
          const queue = [...s.queue];
          queue.splice(s.currentIndex + 1, 0, song);
          let originalQueue = queue;
          if (s.shuffle) {
            originalQueue = [...s.originalQueue];
            const at = originalQueue.indexOf(s.queue[s.currentIndex]);
            originalQueue.splice(at + 1, 0, song);
          }
          return { queue, originalQueue };
        });
      },

      removeFromQueue: (index) => {
        const s = get();
        if (index < 0 || index >= s.queue.length) return;

        const removed = s.queue[index];
        const queue = s.queue.filter((_, i) => i !== index);
        let originalQueue = queue;
        if (s.shuffle) {
          const at = s.originalQueue.indexOf(removed);
          originalQueue = at >= 0 ? s.originalQueue.filter((_, i) => i !== at) : s.originalQueue;
        }

        if (index < s.currentIndex) {
          set({ queue, originalQueue, currentIndex: s.currentIndex - 1 });
        } else if (index > s.currentIndex) {
          set({ queue, originalQueue });
        } else if (queue.length === 0) {
          set({ queue: [], originalQueue: [], currentIndex: -1, isPlaying: false, playId: s.playId + 1 });
        } else {
          // Removed the playing song: the next one slides into its slot and starts loading.
          set({ queue, originalQueue, currentIndex: Math.min(index, queue.length - 1), playId: s.playId + 1 });
        }
      },

      moveInQueue: (from, to) => {
        const s = get();
        const max = s.queue.length - 1;
        if (from === to || from < 0 || to < 0 || from > max || to > max) return;

        const queue = [...s.queue];
        const [moved] = queue.splice(from, 1);
        queue.splice(to, 0, moved);

        let currentIndex = s.currentIndex;
        if (currentIndex === from) currentIndex = to;
        else if (from < currentIndex && to >= currentIndex) currentIndex -= 1;
        else if (from > currentIndex && to <= currentIndex) currentIndex += 1;

        set({ queue, currentIndex, originalQueue: s.shuffle ? s.originalQueue : queue });
      },

      clearQueue: () => {
        const current = selectCurrentSong(get());
        if (!current) return;
        set({ queue: [current], originalQueue: [current], currentIndex: 0 });
      },

      // ---------- UI ----------
      setQueueOpen: (open) => set({ queueOpen: open }),
      toggleQueue: () => set((s) => ({ queueOpen: !s.queueOpen })),
      setSheetOpen: (open) => set({ sheetOpen: open }),

      // Called when the app layout unmounts (logout) so music doesn't keep playing after sign-out.
      reset: () => {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        set((s) => ({
          queue: [], originalQueue: [], currentIndex: -1, isPlaying: false,
          queueOpen: false, sheetOpen: false, playId: s.playId + 1,
        }));
        useProgressStore.setState({ currentTime: 0, duration: 0, buffering: false });
      },
    }),
    {
      name: "musicstream-player",
      version: 1,
      // Only remember preferences. The queue is deliberately not restored (songs may have been deleted).
      partialize: (s) => ({ volume: s.volume, muted: s.muted, shuffle: s.shuffle, repeat: s.repeat }),
    }
  )
);
