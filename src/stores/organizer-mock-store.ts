"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSeedEvents } from "@/mock-data/seed";
import type { DomainEvent, TicketType } from "@/types/domain";

type OrganizerMockState = {
  publishedEvents: DomainEvent[];
  ticketTypesByEventId: Record<string, TicketType[]>;
  addOrReplaceEvent: (ev: DomainEvent, ticketTypes?: TicketType[]) => void;
  removeEvent: (id: string) => void;
  patchEvent: (id: string, patch: Partial<DomainEvent>) => void;
  getExtraTicketTypes: () => TicketType[];
};

export const useOrganizerMockStore = create<OrganizerMockState>()(
  persist(
    (set, get) => ({
      publishedEvents: [],
      ticketTypesByEventId: {},

      addOrReplaceEvent: (ev, ticketTypes) =>
        set((s) => {
          const nextTickets = { ...s.ticketTypesByEventId };
          if (ticketTypes?.length) {
            nextTickets[ev.id] = ticketTypes;
          }
          return {
            publishedEvents: [...s.publishedEvents.filter((e) => e.id !== ev.id), ev],
            ticketTypesByEventId: nextTickets,
          };
        }),

      removeEvent: (id) =>
        set((s) => {
          const nextTickets = { ...s.ticketTypesByEventId };
          delete nextTickets[id];
          return {
            publishedEvents: s.publishedEvents.filter((e) => e.id !== id),
            ticketTypesByEventId: nextTickets,
          };
        }),

      patchEvent: (id, patch) =>
        set((s) => {
          const ts = new Date().toISOString();
          const i = s.publishedEvents.findIndex((e) => e.id === id);
          if (i >= 0) {
            return {
              publishedEvents: s.publishedEvents.map((e) =>
                e.id === id ? { ...e, ...patch, updatedAt: ts } : e,
              ),
            };
          }
          const seed = getSeedEvents().find((e) => e.id === id);
          if (!seed) return s;
          return {
            publishedEvents: [...s.publishedEvents, { ...seed, ...patch, updatedAt: ts }],
          };
        }),

      getExtraTicketTypes: () => {
        const m = get().ticketTypesByEventId;
        return Object.values(m).flat();
      },
    }),
    {
      name: "evently-organizer-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        publishedEvents: s.publishedEvents,
        ticketTypesByEventId: s.ticketTypesByEventId,
      }),
    },
  ),
);

export function getOrganizerPublishedFromStorage(): DomainEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("evently-organizer-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { state?: { publishedEvents?: DomainEvent[] } };
    return parsed.state?.publishedEvents ?? [];
  } catch {
    return [];
  }
}

export function getOrganizerExtraTicketsFromStorage(): TicketType[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("evently-organizer-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { state?: { ticketTypesByEventId?: Record<string, TicketType[]> } };
    const m = parsed.state?.ticketTypesByEventId ?? {};
    return Object.values(m).flat();
  } catch {
    return [];
  }
}
