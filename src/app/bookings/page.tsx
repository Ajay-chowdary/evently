import Link from "next/link";
import { BookingsListClient } from "@/components/booking/bookings-list-client";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { isMockCatalog } from "@/lib/data-source";
import { prisma } from "@/lib/db";
import { formatLongDateTime } from "@/lib/format-date";
import { formatCurrency } from "@/lib/formatters/currency";

export const metadata = { title: "My bookings" };

function bookingBadge(status: string) {
  if (status === "CONFIRMED") {
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
  }
  if (status === "PENDING_PAYMENT") {
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
  }
  return "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
}

function BookingSection({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: Awaited<ReturnType<typeof loadBookings>>;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-8 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Nothing here yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((booking) => (
            <li key={booking.id}>
              <Link
                href={`/bookings/${booking.id}`}
                className="block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{booking.event.title}</p>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${bookingBadge(booking.status)}`}>
                        {booking.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatLongDateTime(booking.event.startsAt)}
                    </p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">{booking.referenceCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(booking.total, booking.currency)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {booking.tickets.length} ticket{booking.tickets.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function loadBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
        },
      },
      tickets: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function BookingsPage() {
  if (isMockCatalog()) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">My bookings</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Booking history, confirmation references, and ticket access.
            </p>
          </div>
          <Button variant="secondary" className="w-fit rounded-full" asChild>
            <Link href="/events">Browse more events</Link>
          </Button>
        </div>

        <BookingsListClient />
      </main>
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">My bookings</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Bookings stored locally on this device.
            </p>
          </div>
          <Button variant="secondary" className="w-fit rounded-full" asChild>
            <Link href="/events">Browse more events</Link>
          </Button>
        </div>

        <BookingsListClient />
      </main>
    );
  }

  const bookings = await loadBookings(session.user.id);
  const now = new Date();

  const upcoming = bookings.filter(
    (booking) => booking.status !== "CANCELLED" && booking.event.startsAt >= now,
  );
  const past = bookings.filter(
    (booking) => booking.status !== "CANCELLED" && booking.event.startsAt < now,
  );
  const cancelled = bookings.filter((booking) =>
    booking.status === "CANCELLED" || booking.status === "REFUNDED" || booking.status === "FAILED",
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">My bookings</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Booking history, confirmation references, and ticket access.
          </p>
        </div>
        <Button variant="secondary" className="w-fit rounded-full" asChild>
          <Link href="/events">Browse more events</Link>
        </Button>
      </div>

      <div className="space-y-10">
        <BookingSection
          title="Upcoming"
          description="Tickets you can still use."
          rows={upcoming}
        />
        <BookingSection
          title="Past"
          description="Completed events from your history."
          rows={past}
        />
        <BookingSection
          title="Cancelled or refunded"
          description="Orders that were cancelled, refunded, or failed."
          rows={cancelled}
        />

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">From this device</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Demo bookings made with the organizer/event preview flow.
            </p>
          </div>
          <BookingsListClient />
        </section>
      </div>
    </main>
  );
}
