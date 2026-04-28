import Link from "next/link";
import { SavedEventsClient } from "@/components/events/saved-events-client";
import { MOCK_CATALOG } from "@/lib/public-env";

export const metadata = { title: "Saved events" };

export default function SavedPage() {
  if (!MOCK_CATALOG) {
    return (
      <main className="mx-auto max-w-xl flex-1 px-6 py-16 sm:px-8">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Saved</p>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Sign in to sync saved events, or enable mock catalog for local saves.</p>
        <Link href="/account/saved" className="mt-6 inline-block text-sm font-medium text-orange-600 hover:underline dark:text-orange-400">
          Account likes
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Saved events</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Stored on this device only.</p>
      <div className="mt-10">
        <SavedEventsClient />
      </div>
    </main>
  );
}
