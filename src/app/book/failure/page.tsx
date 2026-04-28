import Link from "next/link";
import { Button } from "@/components/ui/button";

type SearchParams = Promise<{ reason?: string }>;

export default async function BookFailurePage({ searchParams }: { searchParams: SearchParams }) {
  const { reason } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-1 flex-col justify-center px-6 py-16 sm:px-8">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/20">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Booking could not complete</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {reason ? reason.replace(/\+/g, " ") : "Something went wrong. Please try again."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="rounded-xl" asChild>
            <Link href="/events">Back to events</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
