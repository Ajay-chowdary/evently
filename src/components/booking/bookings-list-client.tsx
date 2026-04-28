"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters/currency";
import { partitionByEventStart } from "@/lib/selectors/bookings";
import { useBookingStore } from "@/stores/booking-store";

export function BookingsListClient() {
  const bookings = useBookingStore((s) => s.bookings);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const eventStarts = useMemo(() => {
    const m = new Map<string, Date>();
    for (const b of bookings) {
      m.set(b.eventId, new Date(b.eventStartsAt));
    }
    return m;
  }, [bookings]);

  const { upcoming, past } = useMemo(
    () => partitionByEventStart(bookings, eventStarts),
    [bookings, eventStarts],
  );

  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div>
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <Button
          type="button"
          variant={tab === "upcoming" ? "default" : "ghost"}
          className="rounded-b-none rounded-t-xl"
          onClick={() => setTab("upcoming")}
        >
          Upcoming
        </Button>
        <Button
          type="button"
          variant={tab === "past" ? "default" : "ghost"}
          className="rounded-b-none rounded-t-xl"
          onClick={() => setTab("past")}
        >
          Past
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">No {tab} bookings yet.</p>
          <Button className="mt-6 rounded-full" asChild>
            <Link href="/events">Browse events</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((b) => (
            <li key={b.id}>
              <Link
                href={`/bookings/${b.id}`}
                className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{b.eventTitle}</p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">{b.referenceCode}</p>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {b.status === "cancelled" ? (
                        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                          Cancelled
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
                          Confirmed
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(b.total, b.currency)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
