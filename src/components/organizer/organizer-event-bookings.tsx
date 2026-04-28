"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/formatters/currency";
import { useBookingStore } from "@/stores/booking-store";

export function OrganizerEventBookings({ eventId }: { eventId: string }) {
  const bookings = useBookingStore((s) => s.bookings);

  const rows = useMemo(() => bookings.filter((b) => b.eventId === eventId), [bookings, eventId]);

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">No mock bookings for this event yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((b) => (
        <li
          key={b.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
        >
          <div>
            <p className="font-mono text-xs text-zinc-500">{b.referenceCode}</p>
            <p className="text-sm text-zinc-900 dark:text-zinc-50">{b.attendeeName}</p>
            <p className="text-xs text-zinc-500">{b.attendeeEmail}</p>
            <p className="mt-1 text-xs text-zinc-500">{b.status}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{formatCurrency(b.total, b.currency)}</p>
            <Link href={`/bookings/${b.id}`} className="text-xs text-orange-600 hover:underline dark:text-orange-400">
              Open
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
