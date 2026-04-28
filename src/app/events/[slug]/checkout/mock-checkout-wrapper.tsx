"use client";

import { useMemo } from "react";
import { getMockEventBySlug } from "@/lib/mock-db/catalog";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";
import { CheckoutClient as MockCheckoutClient } from "@/components/booking/checkout-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MockCheckoutWrapper({ slug }: { slug: string }) {
  const published = useOrganizerMockStore((s) => s.publishedEvents);
  const ticketTypesByEventId = useOrganizerMockStore((s) => s.ticketTypesByEventId);
  const extraTickets = useMemo(() => Object.values(ticketTypesByEventId).flat(), [ticketTypesByEventId]);

  const detail = useMemo(
    () => getMockEventBySlug(slug, published, extraTickets),
    [slug, published, extraTickets],
  );

  if (!detail) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Event not found</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This event may have been removed or is no longer available.
        </p>
        <Button className="mt-6 rounded-xl" asChild>
          <Link href="/events">Browse events</Link>
        </Button>
      </div>
    );
  }

  return <MockCheckoutClient detail={detail} />;
}
