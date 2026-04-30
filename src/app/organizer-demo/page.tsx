import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Organizer Home" };

const cards = [
  { label: "Total events", value: "0" },
  { label: "Orders", value: "0" },
  { label: "Payouts", value: "$0" },
];

export default function OrganizerDemoHomePage() {
  return (
    <main className="space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Organizer Home</h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Manage events, orders, and payouts from one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button className="rounded-md bg-orange-600 hover:bg-orange-700" asChild>
            <Link href="/organizer-demo/create">Create event</Link>
          </Button>
          <Button variant="secondary" className="rounded-md" asChild>
            <Link href="/organizer-demo/events">Go to events</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{card.value}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
