"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type WishlistState = {
  eventIds: string[];
  toggle: (eventId: string) => void;
  has: (eventId: string) => boolean;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      eventIds: [],
      toggle: (eventId) =>
        set((s) => ({
          eventIds: s.eventIds.includes(eventId)
            ? s.eventIds.filter((id) => id !== eventId)
            : [...s.eventIds, eventId],
        })),
      has: (eventId) => get().eventIds.includes(eventId),
      clear: () => set({ eventIds: [] }),
    }),
    {
      name: "evently-wishlist-v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
