import Link from "next/link";

export const metadata = { title: "Help" };

const FAQ = [
  {
    q: "How do mock bookings work?",
    a: "With NEXT_PUBLIC_USE_MOCK_CATALOG=true, reservations are stored in your browser via localStorage. Clearing site data removes them.",
  },
  {
    q: "Do I pay real money?",
    a: "No. Checkout is a simulation only. No card or payment processor is connected.",
  },
  {
    q: "What is organizer demo?",
    a: "Organizer demo is a local-only dashboard under /organizer-demo. It does not write to Prisma.",
  },
  {
    q: "How do I use the real database again?",
    a: "Unset NEXT_PUBLIC_USE_MOCK_CATALOG or set it to false, then restart the dev server. Prisma-backed flows return on /dashboard and /account.",
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Help</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">Quick answers for the Evently mock MVP.</p>
      <dl className="mt-10 space-y-8">
        {FAQ.map((item) => (
          <div key={item.q}>
            <dt className="font-semibold text-zinc-900 dark:text-zinc-50">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{item.a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-12">
        <Link href="/events" className="text-sm font-medium text-orange-600 hover:underline dark:text-orange-400">
          Browse events
        </Link>
      </p>
    </main>
  );
}
