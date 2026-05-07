"use client";

import Link from "next/link";
import { Circle, Eye, MoreHorizontal } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { WizardEventCard } from "@/components/organizer/wizard/event-card";
import { cn } from "@/lib/utils";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";
import { getSeedEvents } from "@/mock-data/seed";

const steps = [
  {
    key: "build",
    title: "Build event page",
    description: "Add all of your event details and let attendees know what to expect.",
  },
  {
    key: "tickets",
    title: "Add tickets",
    description: "Use your suggestions to help sell more tickets or manually create your own.",
  },
  {
    key: "publish",
    title: "Publish",
    description: "Review your event page and settings, then publish your event.",
  },
] as const;

function statusForPath(pathname: string) {
  if (pathname.includes("/tickets")) return "tickets";
  if (pathname.includes("/publish")) return "publish";
  if (pathname.includes("/preview")) return "preview";
  return "build";
}

export default function OrganizerWizardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const id = params.id;

  const publishedEvents = useOrganizerMockStore((s) => s.publishedEvents);
  const setEventStatus = useOrganizerMockStore((s) => s.setEventStatus);
  const [mounted, setMounted] = useState(false);
  // SSR-safe hydration guard: flips exactly once on mount, no cascade risk.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const event = useMemo(() => {
    const fromStore = publishedEvents.find((e) => e.id === id);
    if (fromStore) return fromStore;
    return getSeedEvents().find((e) => e.id === id) ?? null;
  }, [publishedEvents, id]);

  if (!mounted) {
    return <main className="p-8 text-zinc-500 dark:text-zinc-400">Loading event workspace...</main>;
  }

  if (!event) {
    return (
      <main className="p-8">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Event not found</p>
        <Link href="/organizer-demo/events" className="mt-2 inline-block text-sm text-blue-700 hover:underline dark:text-blue-300">
          Back to events
        </Link>
      </main>
    );
  }

  const current = statusForPath(pathname);
  const showPreview = current === "tickets" || current === "publish" || current === "preview";

  return (
    <div className="-mx-6 -my-8 min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-900/20">
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="w-80 shrink-0 border-r border-zinc-200 bg-white px-5 py-6 dark:border-zinc-800 dark:bg-zinc-950">
          <Link href="/organizer-demo/events" className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300">
            Back to events
          </Link>

          <div className="mt-4">
            <WizardEventCard
              event={event}
              showPreview={showPreview}
              onStatusChange={(status) => setEventStatus(event.id, status)}
            />
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Steps</p>
            {steps.map((step) => {
              const active = current === step.key || (current === "preview" && step.key === "publish");
              const done = step.key === "build"
                ? current !== "build"
                : step.key === "tickets"
                ? current === "publish" || current === "preview"
                : false;
              return (
                <div key={step.key} className={cn("rounded-lg px-2 py-2", active && "bg-zinc-50 dark:bg-zinc-900")}>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    <Circle className={cn("h-4 w-4", done && "fill-blue-600 text-blue-600", active && !done && "text-blue-600")} />
                    {step.title}
                  </p>
                  <p className="mt-1 pl-6 text-xs text-zinc-500 dark:text-zinc-400">{step.description}</p>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-end gap-2 border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
            {current === "build" ? (
              <Button variant="secondary" className="rounded-full" asChild>
                <Link href={`/organizer-demo/${event.id}/preview`}>
                  <Eye className="h-4 w-4" /> Preview
                </Link>
              </Button>
            ) : (
              <>
                <Link href="/organizer-demo/events" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50">
                  Updates
                </Link>
                <Link href={`/organizer-demo/${event.id}/preview`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50">
                  Preview your event
                </Link>
                <Link href={`/organizer-demo/${event.id}/publish`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50">
                  Publish
                </Link>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            )}
          </header>

          <div className="flex-1 overflow-auto">{children}</div>
        </section>
      </div>
    </div>
  );
}
