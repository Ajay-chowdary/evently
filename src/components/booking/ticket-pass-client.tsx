"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/stores/booking-store";

export function TicketPassClient({ ticketId }: { ticketId: string }) {
  const getTicketById = useBookingStore((s) => s.getTicketById);
  const getBooking = useBookingStore((s) => s.getBooking);

  const ticket = getTicketById(ticketId);
  const booking = ticket ? getBooking(ticket.bookingId) : undefined;

  const statusLine = useMemo(() => {
    if (!ticket) return null;
    if (ticket.status === "cancelled") return "Cancelled";
    if (ticket.status === "used") return "Used";
    return "Active";
  }, [ticket]);

  if (!ticket || !booking) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">Ticket not found</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">It may be on another device or cleared from this browser.</p>
        <Button className="mt-6 rounded-xl" asChild>
          <Link href="/bookings">My bookings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Digital pass</p>
        <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{booking.eventTitle}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Ref {booking.referenceCode}</p>
      </div>
      <div className="flex flex-col items-center px-6 py-10">
        <div
          className="flex size-44 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-center text-xs text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
          aria-label="QR code placeholder"
        >
          QR placeholder
          <span className="sr-only">Value {ticket.qrCodeValue}</span>
        </div>
        <p className="mt-4 font-mono text-sm text-zinc-700 dark:text-zinc-300">{ticket.qrCodeValue}</p>
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {ticket.attendeeName}
          <br />
          {ticket.attendeeEmail}
        </p>
        {statusLine ? (
          <span className="mt-4 inline-flex rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {statusLine}
          </span>
        ) : null}
      </div>
    </div>
  );
}
