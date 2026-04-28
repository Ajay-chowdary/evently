import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { DeleteEventButton } from "@/components/delete-event-button";

export const metadata = {
  title: "Organizer dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id },
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { tickets: true } } },
  });

  return (
    <main>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Your events</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Create, edit, and publish listings.</p>
        </div>
        <Button className="w-fit rounded-full" asChild>
          <Link href="/dashboard/create">Create event</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-8 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
          <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">No events yet</p>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Create your first event to see it here.</p>
          <Button className="mt-6 rounded-full" asChild>
            <Link href="/dashboard/create">Create event</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-4">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{ev.title}</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {format(ev.startsAt)} — {ev.city}
                  {ev.published ? "" : " — Draft"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{ev._count.tickets} tickets claimed</p>
                <dl className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-medium text-zinc-600 dark:text-zinc-300">Visibility</dt>
                    <dd>{ev.published ? "Published (public browse)" : "Draft (organizer only)"}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-medium text-zinc-600 dark:text-zinc-300">Slug</dt>
                    <dd className="font-mono">{ev.slug}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-medium text-zinc-600 dark:text-zinc-300">Starts</dt>
                    <dd>{format(ev.startsAt)}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-medium text-zinc-600 dark:text-zinc-300">City</dt>
                    <dd>{ev.city}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-wrap gap-2">
                {ev.published && (
                  <Button variant="secondary" size="sm" className="rounded-full" asChild>
                    <Link href={`/events/${ev.slug}`}>View</Link>
                  </Button>
                )}
                <Button size="sm" className="rounded-full" asChild>
                  <Link href={`/dashboard/${ev.id}/edit`}>Edit</Link>
                </Button>
                <Button variant="secondary" size="sm" className="rounded-full" asChild>
                  <Link href={`/dashboard/${ev.id}/bookings`}>Bookings</Link>
                </Button>
                <Button variant="secondary" size="sm" className="rounded-full" asChild>
                  <Link href={`/dashboard/${ev.id}/analytics`}>Performance</Link>
                </Button>
                <DeleteEventButton eventId={ev.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
