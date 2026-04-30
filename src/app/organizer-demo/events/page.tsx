"use client";

import Link from "next/link";
import { CalendarDays, CalendarRange, List, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { OrganizerEventsList } from "@/components/organizer/organizer-events-list";
import { Button } from "@/components/ui/button";
import { listOrganizerMockEvents } from "@/lib/mock-event-repository";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";

const ORG_ID = "org-nightout";

export default function OrganizerEventsPage() {
  const published = useOrganizerMockStore((s) => s.publishedEvents);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");

  const rows = useMemo(() => {
    const all = listOrganizerMockEvents(ORG_ID, published).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    const term = query.trim().toLowerCase();
    return all.filter((ev) => {
      if (statusFilter !== "all" && ev.status !== statusFilter) return false;
      if (!term) return true;
      return (
        ev.title.toLowerCase().includes(term) ||
        ev.slug.toLowerCase().includes(term) ||
        (ev.listingCity ?? "").toLowerCase().includes(term)
      );
    });
  }, [published, query, statusFilter]);

  const showEmpty = rows.length === 0;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Events</h1>
      </div>

      <div className="flex items-center gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <button type="button" className="border-b-2 border-blue-600 pb-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
          Events
        </button>
        <button type="button" className="pb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400" disabled>
          Collections
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events"
            className="h-11 w-full rounded-md border border-zinc-300 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>

        <div className="inline-flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex h-11 items-center gap-2 px-4 text-sm font-medium ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            <List className="h-4 w-4" /> List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`inline-flex h-11 items-center gap-2 border-l border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700 ${
              viewMode === "calendar"
                ? "bg-blue-600 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            <CalendarDays className="h-4 w-4" /> Calendar
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "draft" | "published")}
          className="h-11 rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          aria-label="Filter events"
        >
          <option value="all">All events</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
        </select>

        <Button className="ml-auto rounded-md bg-orange-600 hover:bg-orange-700" asChild>
          <Link href="/organizer-demo/create">Create Event</Link>
        </Button>
      </div>

      {showEmpty ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white text-center dark:border-zinc-800 dark:bg-zinc-950">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <CalendarRange className="h-12 w-12 text-zinc-400" />
          </span>
          <p className="mt-6 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">No events to show</p>
        </div>
      ) : viewMode === "calendar" ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          Calendar view is coming soon. Use list view for event management.
        </div>
      ) : (
        <OrganizerEventsList rows={rows} />
      )}
    </main>
  );
}
