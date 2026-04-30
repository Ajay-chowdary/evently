import Link from "next/link";
import { Heart, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingsListClient } from "@/components/booking/bookings-list-client";
import { RoleSwitchButton } from "@/components/role-switch-button";

export const metadata = { title: "Attending" };
export const dynamic = "force-dynamic";

export default function AttendingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Attending</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Your tickets, saved events, and order history.
          </p>
        </div>
        <RoleSwitchButton variant="inline" />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/bookings"
          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Tickets</p>
            <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">My bookings</p>
          </div>
          <Ticket className="size-6 text-orange-600 dark:text-orange-400" />
        </Link>
        <Link
          href="/saved"
          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Liked</p>
            <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">Saved events</p>
          </div>
          <Heart className="size-6 text-orange-600 dark:text-orange-400" />
        </Link>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Recent bookings</h2>
          <Button variant="ghost" className="rounded-full" asChild>
            <Link href="/events">Browse events</Link>
          </Button>
        </div>
        <BookingsListClient />
      </section>
    </main>
  );
}
