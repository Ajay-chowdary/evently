import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "@/lib/format-date";
import type { DomainEvent } from "@/types/domain";

export function OrganizerEventsList({ rows }: { rows: DomainEvent[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-4">
      {rows.map((ev) => (
        <li
          key={ev.id}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{ev.title}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {format(new Date(ev.startDateTime))} · {ev.status}
              {ev.status === "draft" ? " · not on public browse" : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ev.status === "published" ? (
              <Button size="sm" variant="secondary" className="rounded-full" asChild>
                <Link href={`/events/${ev.slug}`}>View public</Link>
              </Button>
            ) : (
              <span className="inline-flex items-center rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                View public: publish first
              </span>
            )}
            <Button size="sm" className="rounded-full" asChild>
              <Link href={`/organizer-demo/${ev.id}/edit`}>Edit</Link>
            </Button>
            <Button size="sm" variant="secondary" className="rounded-full" asChild>
              <Link href={`/organizer-demo/${ev.id}/bookings`}>Bookings</Link>
            </Button>
            <span className="inline-flex items-center rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
              Performance: coming later
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
