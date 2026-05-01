"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSeedEvents } from "@/mock-data/seed";
import type { DomainEvent, TicketType } from "@/types/domain";

const EMPTY_TICKETS: TicketType[] = [];

let cachedSeedEvents: DomainEvent[] | null = null;
function getCachedSeedEvents(): DomainEvent[] {
  if (cachedSeedEvents === null) cachedSeedEvents = getSeedEvents();
  return cachedSeedEvents;
}

type OrganizerMockState = {
  publishedEvents: DomainEvent[];
  ticketTypesByEventId: Record<string, TicketType[]>;
  addOrReplaceEvent: (ev: DomainEvent, ticketTypes?: TicketType[]) => void;
  removeEvent: (id: string) => void;
  patchEvent: (id: string, patch: Partial<DomainEvent>) => void;
  setTicketTypesForEvent: (eventId: string, list: TicketType[]) => void;
  addOrUpdateTicketType: (eventId: string, ticket: TicketType) => void;
  deleteTicketType: (eventId: string, ticketId: string) => void;
  setEventStatus: (id: string, status: DomainEvent["status"]) => void;
  setEventVisibility: (id: string, visibility: DomainEvent["visibility"]) => void;
  getEventById: (id: string) => DomainEvent | null;
  getTicketTypesForEvent: (eventId: string) => TicketType[];
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

      setTicketTypesForEvent: (eventId, list) =>
        set((s) => ({
          ticketTypesByEventId: { ...s.ticketTypesByEventId, [eventId]: list },
          publishedEvents: s.publishedEvents.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  ticketTypeIds: list.map((t) => t.id),
                  updatedAt: new Date().toISOString(),
                }
              : e,
          ),
        })),

      addOrUpdateTicketType: (eventId, ticket) =>
        set((s) => {
          const current = s.ticketTypesByEventId[eventId] ?? [];
          const exists = current.some((t) => t.id === ticket.id);
          const next = exists
            ? current.map((t) => (t.id === ticket.id ? ticket : t))
            : [...current, ticket];
          return {
            ticketTypesByEventId: { ...s.ticketTypesByEventId, [eventId]: next },
            publishedEvents: s.publishedEvents.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    ticketTypeIds: next.map((t) => t.id),
                    updatedAt: new Date().toISOString(),
                  }
                : e,
            ),
          };
        }),

      deleteTicketType: (eventId, ticketId) =>
        set((s) => {
          const current = s.ticketTypesByEventId[eventId] ?? [];
          const next = current.filter((t) => t.id !== ticketId);
          return {
            ticketTypesByEventId: { ...s.ticketTypesByEventId, [eventId]: next },
            publishedEvents: s.publishedEvents.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    ticketTypeIds: next.map((t) => t.id),
                    updatedAt: new Date().toISOString(),
                  }
                : e,
            ),
          };
        }),

      setEventStatus: (id, status) =>
        set((s) => ({
          publishedEvents: s.publishedEvents.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status,
                  visibility: status === "published" ? (e.visibility === "private" ? "private" : "public") : "unlisted",
                  updatedAt: new Date().toISOString(),
                }
              : e,
          ),
        })),

      setEventVisibility: (id, visibility) =>
        set((s) => ({
          publishedEvents: s.publishedEvents.map((e) =>
            e.id === id ? { ...e, visibility, updatedAt: new Date().toISOString() } : e,
          ),
        })),

      getEventById: (id) => {
        const fromStore = get().publishedEvents.find((e) => e.id === id);
        if (fromStore) return fromStore;
        return getCachedSeedEvents().find((e) => e.id === id) ?? null;
      },

      getTicketTypesForEvent: (eventId) => {
        const fromStore = get().ticketTypesByEventId[eventId];
        return fromStore ?? EMPTY_TICKETS;
      },

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
