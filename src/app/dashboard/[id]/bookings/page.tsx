import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrganizerEventBookings } from "@/components/organizer/organizer-event-bookings";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "@/lib/format-date";
import { isMockCatalog } from "@/lib/data-source";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const ev = await prisma.event.findUnique({ where: { id }, select: { title: true } });
  return { title: ev ? `Bookings · ${ev.title}` : "Event bookings" };
}

export default async function DashboardEventBookingsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.organizerId !== session.user.id) {
    notFound();
  }

  const mockMode = isMockCatalog();
  const prismaTickets = mockMode
    ? []
    : await prisma.ticket.findMany({
        where: { eventId: id },
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
      });

  return (
    <main>
      <p className="mb-6 text-sm">
        <Link href="/dashboard" className="text-orange-600 hover:underline dark:text-orange-400">
          Dashboard
        </Link>
        <span className="mx-2 text-zinc-400">/</span>
        <span className="text-zinc-600 dark:text-zinc-400">Bookings</span>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{event.title}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {mockMode
          ? "Checkout test bookings stored in this browser (mock catalog only)."
          : "Free RSVPs claimed on the public event page (same data as your database)."}
      </p>
      <div className="mt-8">
        {mockMode ? (
          <OrganizerEventBookings eventId={id} />
        ) : prismaTickets.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No RSVPs yet.</p>
        ) : (
          <ul className="space-y-3">
            {prismaTickets.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {t.user.name?.trim() || t.user.email}
                  </p>
                  <p className="text-xs text-zinc-500">{t.user.email}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t.quantity} ticket{t.quantity > 1 ? "s" : ""} — Claimed {format(t.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
