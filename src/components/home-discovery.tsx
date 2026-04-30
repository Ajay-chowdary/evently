import Link from "next/link";
import { Briefcase, Heart, Music2, Palette, Search, Trophy, Users } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isMockCatalog, loadCategoriesForDiscovery, loadDistinctCities, loadFeaturedForHome } from "@/lib/data-source";
import type { Event } from "@/generated/prisma/client";
import type { PublicEventListItem } from "@/types/domain";

const showcaseCities = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Austin",
  "Denver",
  "Seattle",
  "San Francisco",
  "Boston",
];

const categoryIcons = {
  Music2,
  Heart,
  Briefcase,
  Palette,
  Trophy,
  Users,
} as const;

export async function HomeDiscovery() {
  const [featured, cities, categories] = await Promise.all([
    loadFeaturedForHome(6),
    loadDistinctCities(),
    loadCategoriesForDiscovery(),
  ]);

  const citySet = new Set(cities);
  const destinations = showcaseCities.filter((c) => citySet.has(c));

  const isMock = isMockCatalog() || ("minPrice" in (featured[0] ?? {}));

  return (
    <section className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Find your next night out
          </h2>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            Search the calendar, jump to a city, or skim what is trending this week.
          </p>
        </div>

        <form
          action="/events"
          method="get"
          className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <Input
              type="search"
              name="q"
              placeholder="Art, yoga, jazz, workshops..."
              className="h-12 rounded-2xl pl-10"
              aria-label="Search events"
            />
          </div>
          <Button type="submit" className="h-12 rounded-2xl px-8">
            Search
          </Button>
        </form>

        <div className="mt-10">
          <p className="mb-3 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">Categories</p>
          <div className="flex justify-center overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4 px-1">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={
                  isMock
                    ? `/events/category/${encodeURIComponent(cat.slug)}`
                    : `/events?category=${encodeURIComponent(cat.name)}`
                }
                className="group flex w-[96px] flex-col items-center gap-2 text-center"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-[transform,box-shadow] group-hover:-translate-y-0.5 group-hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                  {(() => {
                    const Icon = categoryIcons[(cat.icon as keyof typeof categoryIcons) ?? "Music2"] ?? Music2;
                    return <Icon className="h-8 w-8" aria-hidden />;
                  })()}
                </span>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{cat.name}</span>
              </Link>
            ))}
            </div>
          </div>
        </div>

        {destinations.length > 0 && (
          <div className="mt-14">
            <h3 className="text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Popular destinations
            </h3>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {destinations.map((city) => (
                <Link
                  key={city}
                  href={`/events?city=${encodeURIComponent(city)}`}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="relative z-[1] font-medium text-zinc-900 dark:text-zinc-50">{city}</span>
                  <span
                    className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-transparent to-sky-500/20 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Happening soon</h3>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">Hand-picked from the feed</p>
            </div>
            <Button variant="secondary" className="rounded-full" asChild>
              <Link href="/events">View all events</Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isMock
              ? (featured as PublicEventListItem[]).map((event) => <EventCard key={event.id} event={event} />)
              : (featured as Event[]).map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
