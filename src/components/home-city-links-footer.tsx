import Link from "next/link";

const nearbyCities = [
  "Columbia",
  "Sumter",
  "Dentsville",
  "Seven Oaks",
  "Lexington",
  "Orangeburg",
  "West Columbia",
  "Cayce",
  "Irmo",
];

const footerColumns = [
  {
    title: "Use Evently",
    links: [
      "Create Events",
      "Pricing",
      "Event Marketing Platform",
      "Evently Mobile Ticket App",
      "Evently Check-In App",
      "Marketplace",
      "Event Registration",
      "Community Guidelines",
    ],
  },
  {
    title: "Plan Events",
    links: [
      "Sell Tickets Online",
      "Performing Arts Ticketing Software",
      "Sell Concert Tickets Online",
      "Event Payment System",
      "Solutions for Professional Services",
      "Event Management Software",
      "Virtual Events Platform",
    ],
  },
  {
    title: "Find Events",
    links: [
      "New Orleans Food and Drink Events",
      "San Francisco Holiday Events",
      "Tulum Music Events",
      "Denver Hobby Events",
      "Atlanta Pop Music Events",
      "New York Events",
      "Chicago Events",
      "Events in Dallas Today",
      "Los Angeles Events",
    ],
  },
  {
    title: "Connect With Us",
    links: ["Contact Support", "Contact Sales", "X", "Facebook", "LinkedIn", "Instagram", "TikTok"],
  },
];

export function HomeCityLinksFooter() {
  return (
    <>
      <section className="border-t border-zinc-200 bg-zinc-100 py-14 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Things to do around South Carolina
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyCities.map((city) => (
              <Link
                key={city}
                href={`/events?city=${encodeURIComponent(city)}`}
                className="flex items-center justify-between rounded-full bg-white px-5 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <span>Things to do in {city}</span>
                <span aria-hidden className="text-zinc-500 dark:text-zinc-400">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#230046] py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-3xl font-semibold">{column.title}</h3>
              <ul className="mt-5 space-y-3 text-xl text-white/80">
                {column.links.map((label) => (
                  <li key={label}>
                    <Link href="/events" className="transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </>
  );
}
