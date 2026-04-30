import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type SearchParams = Promise<{ reason?: string; booking?: string; event?: string; qty?: string; ticketType?: string }>;

export default async function BookFailurePage({ searchParams }: { searchParams: SearchParams }) {
  const { reason, booking, event, qty, ticketType } = await searchParams;
  const session = await auth();

  if (booking && session?.user?.id) {
    await prisma.booking.updateMany({
      where: {
        id: booking,
        userId: session.user.id,
        status: "PENDING_PAYMENT",
      },
      data: {
        status: "EXPIRED",
        failureReason: reason?.replace(/\+/g, " ") || "Checkout was cancelled.",
      },
    });
  }

  const retryHref = event
    ? `/events/${event}/checkout?${new URLSearchParams(
        Object.fromEntries(
          Object.entries({
            qty: qty ?? "",
            ticketType: ticketType ?? "",
          }).filter(([, value]) => Boolean(value)),
        ),
      ).toString()}`
    : "/events";

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-1 flex-col justify-center px-6 py-16 sm:px-8">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/20">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Booking could not complete</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {reason ? reason.replace(/\+/g, " ") : "Something went wrong. Please try again."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="rounded-xl" asChild>
            <Link href={retryHref}>Try again</Link>
          </Button>
          <Button variant="secondary" className="rounded-xl" asChild>
            <Link href="/events">Back to events</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
