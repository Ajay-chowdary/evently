"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  Bike,
  Bus,
  Car,
  Clock,
  Flag,
  Footprints,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { EventTicketPanelMock } from "@/components/booking/event-ticket-panel-mock";
import { EventDetailsCollapsible } from "@/components/event-details-collapsible";
import { EventHeroCarousel } from "@/components/event-hero-carousel";
import { ShareEventButton } from "@/components/share-event-button";
import { WishlistEventButtonMock } from "@/components/events/wishlist-event-button-mock";
import { EventCard } from "@/components/event-card";
import { EventDetailBottomBar, buildPriceLabel } from "@/components/events/event-detail-bottom-bar";
import { LocationMapPreview } from "@/components/location-map-preview";
import { Button } from "@/components/ui/button";
import { formatLongDateTime, formatEventDateRange } from "@/lib/format-date";
import { getMockEventBySlug, getMockRelatedPublic } from "@/lib/mock-db/catalog";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";
import type { PublicEventListItem } from "@/types/domain";

const DAY_MS = 24 * 60 * 60 * 1000;

export function EventMockDetailClient({
  slug,
  includeDraftPreview = false,
}: {
  slug: string;
  includeDraftPreview?: boolean;
}) {
  const published = useOrganizerMockStore((s) => s.publishedEvents);
  const ticketTypesByEventId = useOrganizerMockStore((s) => s.ticketTypesByEventId);
  const extraTickets = useMemo(() => Object.values(ticketTypesByEventId).flat(), [ticketTypesByEventId]);

  const detail = useMemo(
    () => getMockEventBySlug(slug, published, extraTickets, { includeDraft: includeDraftPreview }),
    [slug, published, extraTickets, includeDraftPreview],
  );

  if (!detail) {
    return (
      <main className="mx-auto max-w-xl flex-1 px-6 py-20 text-center">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Event not found</p>
        <Link href="/events" className="mt-4 inline-block text-sm text-orange-600 hover:underline dark:text-orange-400">
          Back to browse
        </Link>
      </main>
    );
  }

  const gallery =
    detail.galleryImages.length > 0
      ? [detail.coverImage, ...detail.galleryImages.filter((u) => u !== detail.coverImage)]
      : [detail.coverImage];

  const brand = detail.organizer.name;
  const now = new Date();
  const eventStart = new Date(detail.startDateTime);
  const eventEnd = detail.endDateTime ? new Date(detail.endDateTime) : eventStart;
  const eventEnded = now >= eventEnd;
  const eventStarted = now >= eventStart;
  const locationMain = `${detail.venue.name} · ${detail.venue.city}${detail.venue.state ? `, ${detail.venue.state}` : ""}`;

  const visibleTickets = detail.ticketTypes.filter((t) => t.status !== "hidden");
  const paidTickets = visibleTickets.filter((t) => t.price > 0);
  const minPrice = paidTickets.length > 0 ? Math.min(...paidTickets.map((t) => t.price)) : 0;
  const currency = visibleTickets[0]?.currency ?? "USD";
  const priceLabel = buildPriceLabel(minPrice, currency, visibleTickets.length > 1);

  const salesEndsAt = detail.salesEndsAt ? new Date(detail.salesEndsAt) : null;
  const salesEndingSoon =
    !!salesEndsAt && salesEndsAt.getTime() > now.getTime() && salesEndsAt.getTime() - now.getTime() < 7 * DAY_MS;

  const durationHours = Math.max(1, Math.round((eventEnd.getTime() - eventStart.getTime()) / (60 * 60 * 1000)));

  const organizerEventCount = published.filter((e) => e.organizerId === detail.organizer.id).length || 1;
  const hostingSinceYear = new Date(detail.organizer.createdAt).getFullYear();
  const hostingYears = Math.max(1, now.getFullYear() - hostingSinceYear);

  const similar = getMockRelatedPublic(detail.category, detail.id, 6, published);

  const city = detail.venue.city;
  const state = detail.venue.state ?? "";
  const categoryLower = detail.category.toLowerCase();

  const mapsQuery = encodeURIComponent(
    `${detail.venue.name}, ${detail.venue.addressLine1}, ${city}${state ? `, ${state}` : ""}`,
  );

  return (
    <main className="flex-1 pb-32 pt-20">
      <EventHeroCarousel key={gallery.join("|")} images={gallery} />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-12">
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    detail.status === "cancelled"
                      ? "inline-flex rounded-full bg-red-200 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-900 dark:bg-red-950/60 dark:text-red-200"
                      : eventEnded
                        ? "inline-flex rounded-full bg-red-200 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-900 dark:bg-red-950/60 dark:text-red-200"
                        : eventStarted
                          ? "inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-900"
                          : "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                  }
                >
                  {detail.status === "cancelled" ? "Cancelled" : eventEnded ? "Event ended" : eventStarted ? "Happening now" : "Upcoming"}
                </span>
                {salesEndingSoon ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-400 bg-amber-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-200">
                    <Clock className="size-3" /> Sales end soon
                  </span>
                ) : null}
              </div>
              <div className="flex items-start gap-2">
                <ShareEventButton path={`/events/${detail.slug}`} />
                <WishlistEventButtonMock eventId={detail.id} compact />
              </div>
            </div>

            <h2 className="text-3xl font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              {detail.title}
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  {detail.organizer.logo ? (
                    <Image src={detail.organizer.logo} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <span className="flex size-full items-center justify-center text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                      {(brand.slice(0, 1) || "O").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    By{" "}
                    <Link
                      href={`/organizers/${detail.organizer.handle}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {brand}
                    </Link>
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {organizerEventCount} {organizerEventCount === 1 ? "event" : "events"} · {hostingYears}y hosting
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-zinc-800 dark:text-zinc-200">
              <p className="flex items-start gap-2 text-sm sm:text-base">
                <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
                <span>{locationMain}</span>
              </p>
              <p className="flex items-start gap-2 text-sm sm:text-base">
                <Clock className="mt-0.5 size-4 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
                <span>
                  {formatEventDateRange(
                    new Date(detail.startDateTime),
                    detail.endDateTime ? new Date(detail.endDateTime) : null,
                  )}
                </span>
              </p>
            </div>

            {detail.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {detail.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <section>
              <h3 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">Overview</h3>
              <EventDetailsCollapsible description={detail.description} />
            </section>

            <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Good to know</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Highlights</p>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Clock className="size-4" /> {durationHours} {durationHours === 1 ? "hour" : "hours"}
                  </p>
                  {detail.ageRestriction ? (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{detail.ageRestriction}</p>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Refund Policy</p>
                  <p className="mt-3 inline-flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <RotateCcw className="mt-0.5 size-4 shrink-0" />
                    <span>{detail.refundPolicy ?? "No refunds available"}</span>
                  </p>
                </div>
              </div>
            </section>

            {detail.agenda.length > 0 ? (
              <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Agenda</h3>
                <ul className="mt-4 space-y-4">
                  {detail.agenda.map((item) => (
                    <li key={item.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{item.label}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatLongDateTime(new Date(item.startTime))}
                        {item.endTime ? ` – ${formatLongDateTime(new Date(item.endTime))}` : ""}
                      </p>
                      {item.speaker ? (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.speaker}</p>
                      ) : null}
                      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{item.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Location</h3>
              <p className="mt-3 text-base font-medium text-zinc-900 dark:text-zinc-50">{detail.venue.name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {detail.venue.addressLine1}
                {detail.venue.addressLine2 ? `, ${detail.venue.addressLine2}` : ""}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {city}
                {state ? `, ${state}` : ""}
                {detail.venue.postalCode ? ` ${detail.venue.postalCode}` : ""}
              </p>

              <LocationMapPreview
                className="mt-4"
                height="h-56"
                query={`${detail.venue.name}, ${detail.venue.addressLine1}, ${city}${state ? `, ${state}` : ""}`}
                latitude={detail.venue.latitude}
                longitude={detail.venue.longitude}
              />
              <p className="mt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm font-medium text-orange-600 hover:underline dark:text-orange-400"
                >
                  Open in Google Maps
                </a>
              </p>

              <p className="mt-6 text-sm font-semibold text-zinc-900 dark:text-zinc-50">How do you want to get there?</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}&travelmode=driving`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <Car className="size-5 text-orange-600 dark:text-orange-400" /> Driving
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}&travelmode=transit`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <Bus className="size-5 text-orange-600 dark:text-orange-400" /> Public transport
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}&travelmode=bicycling`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <Bike className="size-5 text-orange-600 dark:text-orange-400" /> Biking
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}&travelmode=walking`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <Footprints className="size-5 text-orange-600 dark:text-orange-400" /> Walking
                </a>
              </div>
            </section>

            {detail.faqItems.length > 0 ? (
              <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">FAQ</h3>
                <dl className="mt-4 space-y-4">
                  {detail.faqItems.map((f) => (
                    <div key={f.id}>
                      <dt className="font-medium text-zinc-900 dark:text-zinc-50">{f.question}</dt>
                      <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{f.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Organized by</h3>
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-start gap-4">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    {detail.organizer.logo ? (
                      <Image src={detail.organizer.logo} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <span className="flex size-full items-center justify-center text-base font-semibold text-zinc-600 dark:text-zinc-300">
                        {(brand.slice(0, 1) || "O").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/organizers/${detail.organizer.handle}`}
                      className="text-lg font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {brand}
                    </Link>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                      <div className="border-l border-zinc-200 pl-3 first:border-0 first:pl-0 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Events</p>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">{organizerEventCount}</p>
                      </div>
                      <div className="border-l border-zinc-200 pl-3 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Hosting</p>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {hostingYears} {hostingYears === 1 ? "year" : "years"}
                        </p>
                      </div>
                      <div className="border-l border-zinc-200 pl-3 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Verified</p>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {detail.organizer.verified ? "Yes" : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    className="rounded-md border border-zinc-300 bg-white text-zinc-900 shadow-none hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                    asChild
                  >
                    <a href={`mailto:${detail.organizer.contactEmail}`}>Contact</a>
                  </Button>
                  <Button asChild className="rounded-md bg-[#d1410c] text-white hover:bg-[#b7370a]">
                    <Link href={`/organizers/${detail.organizer.handle}`}>Follow</Link>
                  </Button>
                </div>
              </div>

              <p className="mt-6 text-center">
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:underline dark:text-orange-400"
                >
                  <Flag className="size-4" /> Report this event
                </Link>
              </p>
            </section>

            {similar.length > 0 ? (
              <section className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">More {detail.category} events</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Browse more {detail.category} events with different dates, prices, and formats to find your next great experience.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {(similar as PublicEventListItem[]).map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Still looking for the right event?</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Explore all events in {city} and filter by date, category, and more to find the perfect fit.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SearchPill href={`/events?country=US`} label="United States Events" />
                {state ? <SearchPill href={`/events?q=${encodeURIComponent(state)}`} label={`${state} Events`} /> : null}
                <SearchPill href={`/events?city=${encodeURIComponent(city)}`} label={`Things to do in ${city}${state ? `, ${state}` : ""}`} />
                <SearchPill href={`/events?city=${encodeURIComponent(city)}&q=parties`} label={`${city} parties`} />
                <SearchPill
                  href={`/events?city=${encodeURIComponent(city)}&category=${encodeURIComponent(detail.category)}`}
                  label={`${city} ${categoryLower} parties`}
                />
              </div>
            </section>

            <p className="pt-4">
              <Link
                href="/events"
                className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
              >
                Back to browse
              </Link>
            </p>
          </div>

          <div id="tickets" className="scroll-mt-24">
            <EventTicketPanelMock detail={detail} />
          </div>
        </div>
      </div>

      <DetailBrandFooter />

      {!eventEnded && detail.status !== "cancelled" ? (
        <EventDetailBottomBar detail={detail} priceLabel={priceLabel} startDate={eventStart} />
      ) : null}
    </main>
  );
}

function SearchPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
    >
      {label}
    </Link>
  );
}

function DetailBrandFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50 py-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-4 px-4 text-xs text-zinc-500 sm:px-6 lg:px-8 dark:text-zinc-400">
        <Link href="/help" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Manage Cookie Preferences
        </Link>
        <span aria-hidden>·</span>
        <Link href="/help" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Do Not Sell or Share My Personal Information
        </Link>
        <span aria-hidden>·</span>
        <Link href="/help" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Privacy
        </Link>
        <span className="ml-auto text-zinc-600 dark:text-zinc-300">© {new Date().getFullYear()} Evently</span>
      </div>
    </footer>
  );
}
