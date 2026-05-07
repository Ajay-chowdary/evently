import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { TicketPassClient } from "@/components/booking/ticket-pass-client";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { isMockCatalog } from "@/lib/data-source";
import { prisma } from "@/lib/db";
import { formatLongDateTime } from "@/lib/format-date";
import { generateTicketQrDataUrl } from "@/lib/qr";

type Props = { params: Promise<{ ticketId: string }> };

export default async function TicketPassPage({ params }: Props) {
  const { ticketId } = await params;

  if (isMockCatalog()) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10 sm:px-8">
        <p className="mb-6">
          <Link href="/bookings" className="text-sm font-medium text-orange-600 hover:underline dark:text-orange-400">
            Back to bookings
          </Link>
        </p>

        <TicketPassClient ticketId={ticketId} />
      </main>
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/tickets/${ticketId}`);
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, userId: session.user.id },
    include: {
      booking: true,
      event: true,
      ticketType: true,
    },
  });

  if (!ticket) {
    notFound();
  }

  const qrDataUrl = await generateTicketQrDataUrl(ticket.qrCodeValue);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10 sm:px-8">
      <p className="mb-6">
        <Link href="/bookings" className="text-sm font-medium text-orange-600 hover:underline dark:text-orange-400">
          Back to bookings
        </Link>
      </p>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Digital pass</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{ticket.event.title}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatLongDateTime(ticket.event.startsAt)}</p>
          <p className="mt-1 text-sm text-zinc-500">Booking {ticket.booking.referenceCode}</p>
        </div>

        <div className="flex flex-col items-center px-6 py-8">
          <div className="relative w-full max-w-[15rem] overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
            <Image
              src={qrDataUrl}
              alt={`QR code for ticket ${ticket.referenceCode}`}
              width={256}
              height={256}
              className="h-auto w-full"
              unoptimized
            />
          </div>
          <p className="mt-4 font-mono text-sm text-zinc-700 dark:text-zinc-300">{ticket.referenceCode}</p>
          <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {ticket.attendeeName}
            <br />
            {ticket.attendeeEmail}
          </p>
          <span className="mt-4 inline-flex rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {ticket.status}
          </span>
        </div>

        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Ticket type</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{ticket.ticketType.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Venue</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{ticket.event.venueName || ticket.event.city}</dd>
            </div>
          </dl>
          <div className="mt-5 flex gap-3">
            <Button variant="secondary" className="rounded-xl" asChild>
              <Link href={`/events/${ticket.event.slug}`}>Event details</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
