"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { searchMockEvents, type MockEventFilters } from "@/lib/mock-db/catalog";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";
import { EventCard } from "@/components/event-card";
import type { Event } from "@/generated/prisma/client";

function mergePrismaPublished(
  mockRows: ReturnType<typeof searchMockEvents>,
  prismaRows: Event[],
): (ReturnType<typeof searchMockEvents>[number] | Event)[] {
  const bySlug = new Map<string, ReturnType<typeof searchMockEvents>[number] | Event>();
  for (const m of mockRows) {
    bySlug.set(m.slug, m);
  }
  for (const p of prismaRows) {
    if (!bySlug.has(p.slug)) {
      bySlug.set(p.slug, p);
    }
  }
  return [...bySlug.values()].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

export function MockEventsGrid({
  filters,
  prismaPublished = [],
}: {
  filters: MockEventFilters;
  prismaPublished?: Event[];
}) {
  const published = useOrganizerMockStore((s) => s.publishedEvents);
  const ticketTypesByEventId = useOrganizerMockStore((s) => s.ticketTypesByEventId);
  const extraTickets = useMemo(() => Object.values(ticketTypesByEventId).flat(), [ticketTypesByEventId]);

  const events = useMemo(() => {
    const fromMock = searchMockEvents(filters, published, extraTickets);
    return mergePrismaPublished(fromMock, prismaPublished);
  }, [filters, published, extraTickets, prismaPublished]);

  useEffect(() => {
    const rehydrate = () => {
      void useOrganizerMockStore.persist.rehydrate();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "evently-organizer-v1") rehydrate();
    };
    window.addEventListener("focus", rehydrate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", rehydrate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-8 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
        <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">No published events matched</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Public browse only lists published events. Drafts stay in My Events until you publish.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          If you just created an event, open Organizer dashboard to confirm it is published, then search again.
        </p>
        <Link
          href="/organizer-demo"
          className="mt-6 inline-block text-sm font-medium text-orange-600 hover:underline dark:text-orange-400"
        >
          My Events
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}
