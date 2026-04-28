"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { canCancelBookingForEvent } from "@/lib/booking-engine";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatLongDateTime } from "@/lib/format-date";
import { useBookingStore } from "@/stores/booking-store";
import { getOrganizerPublishedFromStorage } from "@/stores/organizer-mock-store";

export function BookingDetailClient({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const getBooking = useBookingStore((s) => s.getBooking);
  const getTicketsForBooking = useBookingStore((s) => s.getTicketsForBooking);
  const cancelBooking = useBookingStore((s) => s.cancelBooking);

  const [msg, setMsg] = useState<string | null>(null);

  const booking = getBooking(bookingId);
  const tickets = getTicketsForBooking(bookingId);

  if (!booking) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">Booking not found</p>
        <Button className="mt-6 rounded-xl" asChild>
          <Link href="/bookings">Back to list</Link>
        </Button>
      </div>
    );
  }

  const start = new Date(booking.eventStartsAt);
  const canCancel =
    booking.status === "confirmed" && canCancelBookingForEvent(start, 24);

  const onCancel = () => {
    setMsg(null);
    const extra = getOrganizerPublishedFromStorage();
    const res = cancelBooking(bookingId, extra);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{booking.eventTitle}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {formatLongDateTime(start)}
        </p>
        <p className="mt-2 font-mono text-sm text-zinc-500">Reference {booking.referenceCode}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
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
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Tickets</h2>
        <ul className="mt-4 space-y-3">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/tickets/${t.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
              >
                <span className="text-zinc-900 dark:text-zinc-50">View pass</span>
                <span className="text-zinc-500">{t.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {msg ? <p className="text-sm text-red-600">{msg}</p> : null}

      {canCancel ? (
        <Button type="button" variant="secondary" className="rounded-xl" onClick={onCancel}>
          Cancel booking
        </Button>
      ) : booking.status === "cancelled" ? (
        <p className="text-sm text-zinc-500">This booking was cancelled.</p>
      ) : null}
    </div>
  );
}
