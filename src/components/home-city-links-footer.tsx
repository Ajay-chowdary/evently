import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const nearbyCities = [
  "Columbia",
  "Sumter",
  "Lexington",
  "Seven Oaks",
  "West Columbia",
  "Irmo",
];

const footerColumns = [
  {
    title: "Use Evently",
    links: [
      { label: "Create events", href: "/organizer-demo/create" },
      { label: "Pricing", href: "/help" },
      { label: "Mobile ticket app", href: "/help" },
      { label: "Community guidelines", href: "/help" },
    ],
  },
  {
    title: "Plan events",
    links: [
      { label: "Sell tickets online", href: "/help" },
      { label: "Event management", href: "/help" },
      { label: "Event marketing", href: "/help" },
      { label: "Online events", href: "/events" },
    ],
  },
  {
    title: "Find events",
    links: [
      { label: "Music", href: "/events?category=music" },
      { label: "Food & drink", href: "/events?category=food-drink" },
      { label: "Business", href: "/events?category=business" },
      { label: "Browse all", href: "/events" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Contact support", href: "/help" },
      { label: "Help center", href: "/help" },
      { label: "Twitter", href: "/help" },
      { label: "Instagram", href: "/help" },
    ],
  },
];

export function HomeCityLinksFooter() {
  return (
    <>
      <section className="border-t border-zinc-200 bg-zinc-50 py-12 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
            Things to do around South Carolina
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyCities.map((city) => (
              <Link
                key={city}
                href={`/events?city=${encodeURIComponent(city)}`}
                className="group flex items-center justify-between rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <span>Things to do in {city}</span>
                <ArrowUpRight
                  aria-hidden
                  className="h-4 w-4 text-zinc-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-zinc-500"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#1d0036] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-white/70">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Evently. All rights reserved.</p>
            <div className="flex gap-5">
              <Link href="/help" className="hover:text-white">Terms</Link>
              <Link href="/help" className="hover:text-white">Privacy</Link>
              <Link href="/help" className="hover:text-white">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
