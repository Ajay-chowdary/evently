"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { EventTicketPanelMock } from "@/components/booking/event-ticket-panel-mock";
import { EventDetailsCollapsible } from "@/components/event-details-collapsible";
import { EventHeroCarousel } from "@/components/event-hero-carousel";
import { ShareEventButton } from "@/components/share-event-button";
import { WishlistEventButtonMock } from "@/components/events/wishlist-event-button-mock";
import { EventCard } from "@/components/event-card";
import { formatLongDateTime } from "@/lib/format-date";
import { formatEventDateRange } from "@/lib/format-date";
import { getMockEventBySlug, getMockRelatedPublic } from "@/lib/mock-db/catalog";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";
import type { PublicEventListItem } from "@/types/domain";

export function EventMockDetailClient({ slug }: { slug: string }) {
  const published = useOrganizerMockStore((s) => s.publishedEvents);
  const ticketTypesByEventId = useOrganizerMockStore((s) => s.ticketTypesByEventId);
  const extraTickets = useMemo(() => Object.values(ticketTypesByEventId).flat(), [ticketTypesByEventId]);

  const detail = useMemo(
    () => getMockEventBySlug(slug, published, extraTickets),
    [slug, published, extraTickets],
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

  const similar = getMockRelatedPublic(detail.category, detail.id, 6, published);

  return (
    <main className="flex-1 pb-16 pt-20">
      <EventHeroCarousel
        key={gallery.join("|")}
        images={gallery}
      />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-12">
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
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
                </div>
              </div>
            </div>

            <div className="space-y-3 text-zinc-800 dark:text-zinc-200">
              <p className="flex gap-2 text-sm sm:text-base">
                <span className="shrink-0 font-medium text-zinc-500 dark:text-zinc-400" aria-hidden>
                  Location
                </span>
                <span>{locationMain}</span>
              </p>
              <p className="flex gap-2 text-sm sm:text-base">
                <span className="shrink-0 font-medium text-zinc-500 dark:text-zinc-400" aria-hidden>
                  When
                </span>
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

            <EventDetailsCollapsible description={detail.description} />

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

            {detail.refundPolicy ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Refunds: </span>
                {detail.refundPolicy}
              </p>
            ) : null}

            {similar.length > 0 ? (
              <section className="border-t border-zinc-200 pt-10 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">You might also like</h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {(similar as PublicEventListItem[]).map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              </section>
            ) : null}

            <p className="pt-4">
              <Link
                href="/events"
                className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
              >
                Back to browse
              </Link>
            </p>
          </div>

          <EventTicketPanelMock detail={detail} />
        </div>
      </div>
    </main>
  );
}
