import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookingDetailClient } from "@/components/booking/booking-detail-client";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { isMockCatalog } from "@/lib/data-source";
import { prisma } from "@/lib/db";
import { formatLongDateTime } from "@/lib/format-date";
import { formatCurrency } from "@/lib/formatters/currency";

type Props = { params: Promise<{ bookingId: string }> };

export default async function BookingDetailPage({ params }: Props) {
  const { bookingId } = await params;

  if (isMockCatalog()) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:px-8">
        <p className="mb-6">
          <Link href="/bookings" className="text-sm font-medium text-orange-600 hover:underline dark:text-orange-400">
            All bookings
          </Link>
        </p>

        <BookingDetailClient bookingId={bookingId} />
      </main>
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/bookings");
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId: session.user.id },
    include: {
      event: true,
      lineItems: {
        orderBy: { createdAt: "asc" },
      },
      tickets: {
        orderBy: { issuedAt: "asc" },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:px-8">
      <p className="mb-6">
        <Link href="/bookings" className="text-sm font-medium text-orange-600 hover:underline dark:text-orange-400">
          All bookings
        </Link>
      </p>

      <div className="space-y-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{booking.event.title}</h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {formatLongDateTime(booking.event.startsAt)}
              </p>
              <p className="mt-2 font-mono text-sm text-zinc-500">Reference {booking.referenceCode}</p>
            </div>
            <span className="inline-flex rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {booking.status.replace(/_/g, " ")}
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Payment summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-600 dark:text-zinc-400">Subtotal</dt>
              <dd>{formatCurrency(booking.subtotal, booking.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600 dark:text-zinc-400">Service fee</dt>
              <dd>{formatCurrency(booking.serviceFee, booking.currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-2 font-semibold dark:border-zinc-800">
              <dt>Total</dt>
              <dd>{formatCurrency(booking.total, booking.currency)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Ticket breakdown</h2>
          <ul className="mt-4 space-y-3">
            {booking.lineItems.map((lineItem) => (
              <li key={lineItem.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{lineItem.ticketTypeName}</p>
                  <p className="text-zinc-500">Qty {lineItem.quantity}</p>
                </div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(lineItem.lineTotal, booking.currency)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Tickets</h2>
          <ul className="mt-4 space-y-3">
            {booking.tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{ticket.attendeeName}</p>
                    <p className="text-zinc-500">{ticket.attendeeEmail}</p>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">{ticket.referenceCode}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" className="rounded-xl" asChild>
            <Link href={`/events/${booking.event.slug}`}>Event details</Link>
          </Button>
          {booking.tickets[0] ? (
            <Button className="rounded-xl" asChild>
              <Link href={`/tickets/${booking.tickets[0].id}`}>Open ticket pass</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
