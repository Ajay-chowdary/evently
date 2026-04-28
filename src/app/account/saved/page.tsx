import Link from "next/link";
import { redirect } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SavedEventsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/account/saved");
  }
  const userId = session.user.id;

  const favorites = await prisma.savedEvent.findMany({
    where: { userId },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  const events = favorites.map((favorite) => favorite.event).filter((event) => event.published);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 sm:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Saved events
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Listings you bookmarked. Remove saves from each event page.
          </p>
        </div>
        <Button variant="secondary" className="w-fit rounded-full" asChild>
          <Link href="/events">Browse more</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-8 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
          <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">No saves yet</p>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Open an event and tap Save to build your shortlist.</p>
          <Button className="mt-6 rounded-full" asChild>
            <Link href="/events">Explore events</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
