"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EventMockDetailClient } from "@/components/events/event-mock-detail-client";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";

export default function OrganizerWizardPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const event = useOrganizerMockStore((s) => s.getEventById(id));

  if (!event) return <main className="p-8 text-zinc-500 dark:text-zinc-400">Event not found.</main>;

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Event preview</p>
        <Link href={`/organizer-demo/${id}/build`} className="mt-1 inline-block text-sm text-blue-700 hover:underline dark:text-blue-300">
          Close preview
        </Link>
      </div>
      <EventMockDetailClient slug={event.slug} includeDraftPreview />
    </main>
  );
}
