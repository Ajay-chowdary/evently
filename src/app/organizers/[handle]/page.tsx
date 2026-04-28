import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ handle: string }> };

export default async function OrganizerProfilePage({ params }: Props) {
  const { handle } = await params;
  const organizer = await prisma.organizer.findUnique({
    where: { handle },
    include: {
      events: {
        where: {
          published: true,
          status: "PUBLISHED",
          visibility: "PUBLIC",
        },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!organizer) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-8">
      <div className="flex flex-wrap items-start gap-6">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-200 dark:bg-zinc-800">
          {organizer.logoUrl ? (
            <Image src={organizer.logoUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <span className="flex size-full items-center justify-center text-2xl font-bold text-zinc-600">
              {organizer.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{organizer.name}</h1>
          {organizer.verified ? (
            <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">Verified organizer</p>
          ) : null}
          {organizer.bio ? (
            <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">{organizer.bio}</p>
          ) : null}
          <p className="mt-2 text-sm text-zinc-500">{organizer.contactEmail}</p>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Published events</h2>
        {organizer.events.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No public events yet.</p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organizer.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <p className="mt-10">
        <Link href="/events" className="text-sm font-medium text-orange-600 hover:underline dark:text-orange-400">
          Back to browse
        </Link>
      </p>
    </main>
  );
}
