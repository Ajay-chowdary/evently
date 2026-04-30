import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { MockEventsGrid } from "@/components/discovery/mock-events-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Event } from "@/generated/prisma/client";
import { isMockCatalog, loadCategoriesForDiscovery, loadDistinctCities, loadEventsForBrowse } from "@/lib/data-source";
import type { MockEventFilters } from "@/lib/mock-db/catalog";
import type { UnifiedEventFilters } from "@/lib/data-source";

type SearchParams = {
  q?: string;
  city?: string;
  category?: string;
  from?: string;
  to?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

function parseNum(s: string | undefined): number | undefined {
  if (s == null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = params.q?.trim();
  const city = params.city;
  const category = params.category;
  const from = params.from;
  const to = params.to;
  const type = params.type;
  const minPrice = parseNum(params.minPrice);
  const maxPrice = parseNum(params.maxPrice);
  const sortRaw = params.sort;
  const sort: "date" | "relevance" | "price" =
    sortRaw === "price" || sortRaw === "relevance" || sortRaw === "date" ? sortRaw : "date";

  const requestedMock = isMockCatalog();

  const unified: UnifiedEventFilters = {
    q,
    city,
    category: category && category !== "all" ? category : undefined,
    from,
    to,
    type: type && type !== "all" ? type : undefined,
    minPrice,
    maxPrice,
    sort,
  };

  const [cities, categoryRows, events] = await Promise.all([
    loadDistinctCities(),
    loadCategoriesForDiscovery(),
    loadEventsForBrowse(unified),
  ]);

  const isMock =
    requestedMock ||
    ("minPrice" in (events[0] ?? {})) ||
    categoryRows.some((categoryRow) => categoryRow.id.startsWith("cat_"));

  const prismaPublishedForMock: Event[] = [];

  const mockFilters: MockEventFilters = {
    q,
    city,
    category: category && category !== "all" ? category : undefined,
    from,
    to,
    type: type && type !== "all" ? type : undefined,
    minPrice,
    maxPrice,
    sort: sort as MockEventFilters["sort"],
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 sm:px-8">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Browse events
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Filter by place, category, or date. Results update from the URL so you can share a view.
        </p>
      </div>

      <form
        method="get"
        action="/events"
        className="-mx-6 mb-10 border-b border-zinc-200 bg-background px-6 py-4 dark:border-zinc-800 sm:-mx-8 sm:px-8"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="q">Search</Label>
            <Input id="q" name="q" type="search" placeholder="Keywords, venue, city..." defaultValue={q ?? ""} />
          </div>
          <div
            className={
              isMock
                ? "grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
                : "grid flex-1 gap-4 sm:grid-cols-3 lg:grid-cols-3"
            }
          >
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <select
                id="city"
                name="city"
                defaultValue={city ?? "all"}
                className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="all">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {isMock ? (
              <div className="space-y-2">
                <Label htmlFor="type">Category</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue={type ?? "all"}
                  className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="all">All categories</option>
                  {categoryRows.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue={category ?? "all"}
                  className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="all">All categories</option>
                  {categoryRows.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="from">From date</Label>
              <Input id="from" name="from" type="date" defaultValue={from ?? ""} />
            </div>
            {isMock ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="to">To date</Label>
                  <Input id="to" name="to" type="date" defaultValue={to ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minPrice">Min price</Label>
                  <Input
                    id="minPrice"
                    name="minPrice"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    defaultValue={params.minPrice ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPrice">Max price</Label>
                  <Input
                    id="maxPrice"
                    name="maxPrice"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="Any"
                    defaultValue={params.maxPrice ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort">Sort</Label>
                  <select
                    id="sort"
                    name="sort"
                    defaultValue={sort}
                    className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="date">Date</option>
                    <option value="price">Price</option>
                    <option value="relevance">Relevance</option>
                  </select>
                </div>
              </>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="rounded-xl">
              Apply
            </Button>
            <Button type="button" variant="secondary" className="rounded-xl" asChild>
              <Link href="/events">Reset</Link>
            </Button>
          </div>
        </div>
      </form>

      {isMock ? (
        <MockEventsGrid filters={mockFilters} prismaPublished={prismaPublishedForMock} />
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-8 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
          <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">No published events matched</p>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Public browse only shows published listings. Drafts stay under My Events until you publish.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Try clearing the date filter, setting city to All cities, or a shorter search. Matching ignores letter case
            for title, description, city, venue, category, and organizer.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button className="rounded-full" asChild>
              <Link href="/events">Show all events</Link>
            </Button>
            <Button variant="secondary" className="rounded-full" asChild>
              <Link href="/organizer-demo">My Events</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
