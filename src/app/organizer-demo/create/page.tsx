"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { EVENT_COVER_PLACEHOLDER } from "@/lib/cover-image";
import { createOrganizerMockEvent } from "@/lib/mock-event-repository";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";

export default function OrganizerDemoCreatePage() {
  const router = useRouter();
  const hasRun = useRef(false);
  const published = useOrganizerMockStore((s) => s.publishedEvents);
  const addOrReplaceEvent = useOrganizerMockStore((s) => s.addOrReplaceEvent);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const start = new Date();
    start.setDate(start.getDate() + 7);
    start.setHours(10, 0, 0, 0);

    const end = new Date(start);
    end.setHours(12, 0, 0, 0);

    const { event } = createOrganizerMockEvent(
      {
        title: "Untitled Event",
        description: "Add your event details.",
        city: "Austin",
        categoryName: "Music",
        categorySlug: "music",
        coverImage: EVENT_COVER_PLACEHOLDER,
        startDateTimeIso: start.toISOString(),
        endDateTimeIso: end.toISOString(),
        status: "draft",
      },
      published,
    );
    addOrReplaceEvent({ ...event, ticketTypeIds: [] }, []);
    router.replace(`/organizer-demo/${event.id}/build`);
  }, [addOrReplaceEvent, published, router]);

  return (
    <main className="py-20 text-center text-zinc-500 dark:text-zinc-400">
      Preparing your event workspace...
    </main>
  );
}
