import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX = 8;

// Recent searches, kept in this browser only (localStorage).
export const useSearchHistoryStore = create(
  persist(
    (set) => ({
      items: [],
      add: (query) => {
        const q = query.trim();
        if (!q) return;
        set((s) => ({ items: [q, ...s.items.filter((i) => i.toLowerCase() !== q.toLowerCase())].slice(0, MAX) }));
      },
      remove: (query) => set((s) => ({ items: s.items.filter((i) => i !== query) })),
      clear: () => set({ items: [] }),
    }),
    { name: "musicstream-search-history", version: 1 }
  )
);
