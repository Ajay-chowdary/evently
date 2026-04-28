import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isMockCatalog } from "@/lib/data-source";

type SearchParams = Promise<{ ref?: string }>;

export default async function BookSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { ref } = await searchParams;
  const mockMode = isMockCatalog();
  const ticketsHref = mockMode ? "/bookings" : "/account/tickets";
  const ticketsLabel = mockMode ? "View my bookings" : "View my tickets";

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-1 flex-col justify-center px-6 py-16 sm:px-8">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">You are booked</h1>
        {ref ? (
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Your confirmation reference is{" "}
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">{ref}</span>
          </p>
        ) : (
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Your tickets have been confirmed.
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
