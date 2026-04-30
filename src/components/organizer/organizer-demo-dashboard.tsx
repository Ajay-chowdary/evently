"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { CheckCircle2, X } from "lucide-react";
import { OrganizerEventsList } from "@/components/organizer/organizer-events-list";
import { Button } from "@/components/ui/button";
import { listOrganizerMockEvents } from "@/lib/mock-event-repository";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";

const ORG_ID = "org-nightout";

export function OrganizerDemoDashboard({
  highlightSlug,
  highlightPublished,
}: {
  highlightSlug?: string;
  highlightPublished?: boolean;
}) {
  const router = useRouter();
  const published = useOrganizerMockStore((s) => s.publishedEvents);

  const rows = useMemo(() => {
    const r = listOrganizerMockEvents(ORG_ID, published);
    return [...r].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [published]);

  const dismissBanner = () => {
    router.replace("/organizer-demo");
  };

  return (
    <div className="space-y-6">
      {highlightSlug ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-950 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-50 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <div>
              <p className="font-semibold">Event saved</p>
              <p className="mt-1 text-sm opacity-90">
                It is stored in this browser. Published events also appear on Browse events.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {highlightPublished && highlightSlug ? (
                  <Button size="sm" className="rounded-full bg-orange-600 hover:bg-orange-700" asChild>
                    <Link href={`/events/${highlightSlug}`}>View public page</Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" className="rounded-full" asChild>
                    <Link href="/organizer-demo/create">Create another</Link>
                  </Button>
                )}
                <Button size="sm" variant="secondary" className="rounded-full" asChild>
                  <Link href="/events">Browse all events</Link>
                </Button>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={dismissBanner}
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">My events</h2>
        <Button className="rounded-full" asChild>
          <Link href="/organizer-demo/create">Create event</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-8 py-14 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">No events yet. Create one to see it here.</p>
          <Button className="mt-6 rounded-full" asChild>
            <Link href="/organizer-demo/create">Create event</Link>
          </Button>
        </div>
      ) : (
        <OrganizerEventsList rows={rows} />
      )}
    </div>
  );
}
