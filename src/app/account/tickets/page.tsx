import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isMockCatalog } from "@/lib/data-source";
import { prisma } from "@/lib/db";
import { format } from "@/lib/format-date";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "My tickets",
};

export default async function MyTicketsPage() {
  if (isMockCatalog()) {
    redirect("/bookings");
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/account/tickets");
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    include: { event: true, ticketType: true },
    orderBy: { issuedAt: "desc" },
  });

  const rows = tickets;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">My tickets</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Tickets and RSVPs you have booked.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-8 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
          <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">No tickets yet</p>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Browse events and complete checkout to see passes here.</p>
          <Button className="mt-6 rounded-full" asChild>
            <Link href="/events">Browse events</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((t) => (
            <li
              key={t.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{t.event.title}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t.event.city} — {format(t.event.startsAt)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                  {t.ticketType.name} — {t.paymentMethod === "free" ? "Free RSVP" : t.paymentMethod}
                </p>
              </div>
              <Button variant="secondary" className="w-fit rounded-full" asChild>
                <Link href={`/tickets/${t.id}`}>Open pass</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
