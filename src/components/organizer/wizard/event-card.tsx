"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { format } from "@/lib/format-date";
import type { DomainEvent } from "@/types/domain";

export function WizardEventCard({
  event,
  onStatusChange,
  showPreview,
}: {
  event: DomainEvent;
  onStatusChange: (status: DomainEvent["status"]) => void;
  showPreview: boolean;
}) {
  const dateLabel = format(new Date(event.startDateTime));

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="h-10 bg-gradient-to-r from-orange-100 via-orange-200 to-red-200 dark:from-orange-900/30 dark:via-orange-700/20 dark:to-red-700/20" />
      <div className="space-y-3 p-4">
        <p className="line-clamp-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {event.title || "Untitled Event"}
        </p>
        <p className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <CalendarDays className="h-4 w-4" />
          {dateLabel}
        </p>
        <div className="flex items-center justify-between gap-2">
          <select
            value={event.status}
            onChange={(e) => onStatusChange(e.target.value as DomainEvent["status"])}
            className="h-10 rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="draft">Draft</option>
            <option value="published">On sale</option>
          </select>

          {showPreview ? (
            <Link href={`/organizer-demo/${event.id}/preview`} className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300">
              Preview
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
