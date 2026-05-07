import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { isMockCatalog } from "@/lib/data-source";
import { prisma } from "@/lib/db";

type SearchParams = Promise<{ ref?: string; booking?: string }>;

export default async function BookSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { ref, booking } = await searchParams;
  const mockMode = isMockCatalog();
  const session = mockMode ? null : await auth();

  const bookingRecord =
    !mockMode && booking && session?.user?.id
      ? await prisma.booking.findFirst({
          where: {
            id: booking,
            userId: session.user.id,
          },
          select: {
            id: true,
            status: true,
            referenceCode: true,
          },
        })
      : null;

  const ticketsHref = bookingRecord?.id ? `/bookings/${bookingRecord.id}` : "/bookings";
  const ticketsLabel =
    bookingRecord?.status === "PENDING_PAYMENT" ? "View booking status" : "View my tickets";
  const title = bookingRecord?.status === "PENDING_PAYMENT" ? "Payment received" : "You are booked";
  const effectiveRef = bookingRecord?.referenceCode ?? ref;

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-1 flex-col justify-center px-6 py-16 sm:px-8">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
        {effectiveRef ? (
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            {bookingRecord?.status === "PENDING_PAYMENT" ? (
              <>
                Reference{" "}
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">{effectiveRef}</span>.
                {" "}We are finalizing ticket issuance now.
              </>
            ) : (
              <>
                Your confirmation reference is{" "}
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">{effectiveRef}</span>
              </>
            )}
          </p>
        ) : (
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            {bookingRecord?.status === "PENDING_PAYMENT"
              ? "Your payment completed and your booking is being finalized."
              : "Your tickets have been confirmed."}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="rounded-xl" asChild>
            <Link href={ticketsHref}>{ticketsLabel}</Link>
          </Button>
          <Button variant="secondary" className="rounded-xl" asChild>
            <Link href="/events">Browse more events</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
