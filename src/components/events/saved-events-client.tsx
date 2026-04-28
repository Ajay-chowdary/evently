"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { searchMockEvents } from "@/lib/mock-db/catalog";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";

export function SavedEventsClient() {
  const ids = useWishlistStore((s) => s.eventIds);
  const published = useOrganizerMockStore((s) => s.publishedEvents);
  const ticketTypesByEventId = useOrganizerMockStore((s) => s.ticketTypesByEventId);
  const extraTickets = useMemo(() => Object.values(ticketTypesByEventId).flat(), [ticketTypesByEventId]);

  const cards = useMemo(() => {
    const all = searchMockEvents({}, published, extraTickets);
    const set = new Set(ids);
    return all.filter((e) => set.has(e.id));
  }, [ids, published, extraTickets]);

  if (ids.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <p className="text-zinc-600 dark:text-zinc-400">No saved events yet.</p>
        <Button className="mt-6 rounded-full" asChild>
          <Link href="/events">Browse events</Link>
        </Button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Saved IDs do not match the current catalog. Clear saves or browse again.
      </p>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((e) => (
        <li key={e.id}>
          <EventCard event={e} />
        </li>
      ))}
    </ul>
  );
}
