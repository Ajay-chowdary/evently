import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  MapPin,
  Users,
  Ticket,
} from "lucide-react";
import type { SidebarTicketType, TicketBlockReason } from "@/components/event-ticket-sidebar";
import { EventMockDetailClient } from "@/components/events/event-mock-detail-client";
import { EventDetailsCollapsible } from "@/components/event-details-collapsible";
import { EventHeroCarousel } from "@/components/event-hero-carousel";
import { EventTicketSidebar } from "@/components/event-ticket-sidebar";
import { FollowOrganizerButton } from "@/components/follow-organizer-button";
import { SaveEventButton } from "@/components/save-event-button";
import { ShareEventButton } from "@/components/share-event-button";
import { auth } from "@/lib/auth";
import { eventGalleryUrls, getEventBySlug } from "@/lib/events";
import { getMockEventBySlug } from "@/lib/mock-db/catalog";
import { isMockCatalog, loadSimilarForDetail } from "@/lib/data-source";
import { prisma } from "@/lib/db";
import type { Event } from "@/generated/prisma/client";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isMockCatalog()) {
    const e = getMockEventBySlug(slug, [], []);
    if (!e) return { title: "Event" };
    return {
      title: e.title,
      description: e.description.slice(0, 160),
      openGraph: {
        title: e.title,
        description: e.description.slice(0, 200),
        images: [{ url: e.coverImage }],
      },
    };
  }
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 200),
      images: [{ url: event.imageUrl }],
    },
  };
}

function durationLabel(startsAt: Date, endsAt: Date | null): string | null {
  if (!endsAt) return null;
  const diff = endsAt.getTime() - startsAt.getTime();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.round((diff % 3_600_000) / 60_000);
  if (hours > 0 && mins > 0) return `${hours} hour${hours > 1 ? "s" : ""} ${mins} minutes`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${mins} minutes`;
}

function formatShortDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

function formatShortTime(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function formatCurrency(amount: number, currency: string): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  if (isMockCatalog()) {
    return <EventMockDetailClient slug={slug} />;
  }

  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const session = await auth();
  let initialSaved = false;
  let initialTicket = false;
  let initialTicketQty = 0;
  let initialFollowing = false;
  if (session?.user?.id) {
    const fav = await prisma.savedEvent.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
    });
    initialSaved = !!fav;
    const booking = await prisma.booking.findFirst({
      where: { userId: session.user.id, eventId: event.id, status: "CONFIRMED" },
      include: { tickets: true },
      orderBy: { createdAt: "desc" },
    });
    initialTicket = !!booking;
    initialTicketQty = booking?.tickets.length ?? 0;
    if (event.organizerId) {
      const fo = await prisma.organizerFollow.findFirst({
        where: { followerId: session.user.id, organizerId: event.organizerId },
      });
      initialFollowing = !!fo;
    }
  }

  const now = new Date();
  const eventEnded = now >= (event.endsAt ?? event.startsAt);
  const salesEndedByTime = event.salesEndsAt ? now >= event.salesEndsAt : false;

  const sidebarTicketTypes: SidebarTicketType[] = event.ticketTypes.map((ticketType) => ({
    id: ticketType.id,
    name: ticketType.name,
    description: ticketType.description,
    price: ticketType.price,
    currency: ticketType.currency,
    inventoryRemaining: ticketType.inventoryRemaining,
    minPerOrder: ticketType.minPerOrder,
    maxPerOrder: ticketType.maxPerOrder,
    saleStart: ticketType.saleStart ? ticketType.saleStart.toISOString() : null,
    saleEnd: ticketType.saleEnd ? ticketType.saleEnd.toISOString() : null,
    status: ticketType.status === "SOLD_OUT" ? "SOLD_OUT" : "ACTIVE",
  }));
  const selectableTicketTypes = sidebarTicketTypes.filter(
    (ticketType) => ticketType.status === "ACTIVE" && ticketType.inventoryRemaining > 0,
  );

  let totalSeatsBooked = 0;
  if (event.capacity != null) {
    const agg = await prisma.ticket.aggregate({
      where: {
        eventId: event.id,
        status: {
          in: ["ISSUED", "USED"],
        },
      },
      _sum: { quantity: true },
    });
    totalSeatsBooked = agg._sum.quantity ?? 0;
  }
  const soldOutByCapacity = event.capacity != null && totalSeatsBooked >= event.capacity;
  const soldOutByTickets =
    sidebarTicketTypes.length > 0 &&
    sidebarTicketTypes.every((ticketType) => ticketType.status === "SOLD_OUT" || ticketType.inventoryRemaining <= 0);
  const soldOut = soldOutByCapacity || soldOutByTickets;

  let blockReason: TicketBlockReason = null;
  if (eventEnded) blockReason = "EVENT_ENDED";
  else if (salesEndedByTime) blockReason = "SALES_ENDED";
  else if (soldOut) blockReason = "SOLD_OUT";

  const brand = event.organizer?.name ?? "Organizer";
  const gallery = eventGalleryUrls(event);
  const similar = await loadSimilarForDetail(event.category, event.id, 6);
  const isOwnOrganizer = Boolean(session?.user?.id && event.organizerId === session.user.id);
  const duration = durationLabel(event.startsAt, event.endsAt);

  const followerCount = event.organizerId
    ? await prisma.organizerFollow.count({ where: { organizerId: event.organizerId } })
    : 0;
  const organizerEventCount = event.organizerId
    ? await prisma.event.count({ where: { organizerId: event.organizerId, published: true } })
    : 0;

  const sidebarDateLine = `${formatShortDate(event.startsAt)} · ${formatShortTime(event.startsAt)}`;
  const primaryTicketType = selectableTicketTypes[0] ?? sidebarTicketTypes[0] ?? null;
  const lowestTicketPrice = primaryTicketType?.price ?? event.ticketPrice ?? 0;
  const lowestTicketCurrency = primaryTicketType?.currency ?? event.ticketCurrency ?? "USD";
  const hasMultipleTicketTypes = sidebarTicketTypes.length > 1;
  const priceLabel = hasMultipleTicketTypes
    ? `From ${formatCurrency(lowestTicketPrice, lowestTicketCurrency)}`
    : formatCurrency(lowestTicketPrice, lowestTicketCurrency);

  return (
    <main className="flex-1 pb-16 pt-20">
      {/* Hero */}
      <EventHeroCarousel
        key={gallery.join("|")}
        images={gallery}
      />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Status badge row */}
        <div className="mt-4 flex items-center gap-3">
          {eventEnded ? (
            <span className="inline-flex items-center gap-1 rounded-sm border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
              <Clock className="size-3" /> Event ended
            </span>
          ) : salesEndedByTime ? (
            <span className="inline-flex items-center gap-1 rounded-sm border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
              <Ticket className="size-3" /> Sales ended
            </span>
          ) : event.salesEndsAt ? (
            <span className="inline-flex items-center gap-1 rounded-sm border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
              <Ticket className="size-3" /> Sales end soon
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start lg:gap-12">
          {/* Main content */}
          <div className="min-w-0">
            {/* Title + actions */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                {event.title}
              </h1>
              <div className="flex shrink-0 items-center gap-2 pt-1">
                <ShareEventButton path={`/events/${event.slug}`} />
                <SaveEventButton
                  eventId={event.id}
                  eventSlug={event.slug}
                  initialSaved={initialSaved}
                  signedIn={!!session?.user}
                  compact
                />
              </div>
            </div>

            {/* Overview / description */}
            <section className="mt-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Overview</h2>
              <div className="mt-4">
                <EventDetailsCollapsible description={event.description} />
              </div>
            </section>

            {/* Good to know */}
            <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Good to know</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Highlights</h3>
                  <ul className="mt-3 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {duration && (
                      <li className="flex items-center gap-2.5">
                        <Clock className="size-4 shrink-0 text-zinc-400" /> {duration}
                      </li>
                    )}
                    <li className="flex items-center gap-2.5">
                      <Users className="size-4 shrink-0 text-zinc-400" /> All ages
                    </li>
                    <li className="flex items-center gap-2.5">
                      <MapPin className="size-4 shrink-0 text-zinc-400" /> In person
                    </li>
                    {event.capacity && (
                      <li className="flex items-center gap-2.5">
                        <Ticket className="size-4 shrink-0 text-zinc-400" /> {event.capacity} capacity
                      </li>
                    )}
                  </ul>
                </div>
                <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Refund Policy</h3>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    No refunds
                  </p>
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Location</h2>
              <div className="mt-5">
                {event.venueName && (
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{event.venueName}</p>
                )}
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {[event.city, event.region].filter(Boolean).join(", ")}
                </p>
                <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Open the venue in your preferred map app for directions.
                  </p>
                  <Link
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [event.venueName, event.city, event.region, event.country].filter(Boolean).join(", "),
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-medium text-orange-600 hover:underline dark:text-orange-400"
                  >
                    Open in Google Maps
                  </Link>
                </div>
              </div>
            </section>

            {/* Organized by */}
            <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Organized by</h2>
              {event.organizer && (
                <div className="mt-5 flex flex-wrap items-center gap-5">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    {event.organizerLogoUrl ? (
                      <Image src={event.organizerLogoUrl} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <span className="flex size-full items-center justify-center text-lg font-semibold text-zinc-600 dark:text-zinc-300">
                        {(brand.slice(0, 1) || "O").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/organizers/${event.organizer.handle}`} className="text-base font-semibold text-zinc-900 hover:underline dark:text-zinc-50">
                      {brand}
                    </Link>
                    <div className="mt-1.5 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <span><span className="font-semibold text-zinc-900 dark:text-zinc-50">{followerCount}</span> Follower{followerCount !== 1 ? "s" : ""}</span>
                      <span><span className="font-semibold text-zinc-900 dark:text-zinc-50">{organizerEventCount}</span> Event{organizerEventCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.organizerId && !isOwnOrganizer ? (
                      <FollowOrganizerButton
                        organizerId={event.organizerId}
                        eventSlug={event.slug}
                        initialFollowing={initialFollowing}
                        signedIn={!!session?.user}
                      />
                    ) : null}
                  </div>
                </div>
              )}
            </section>
            {/* Similar events */}
            {similar.length > 0 ? (
              <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">You might also like...</h2>
                <div className="mt-6 space-y-0">
                  {similar.slice(0, 4).map((ev) => {
                    const e = ev as Event;
                    const evStartsAt = e.startsAt instanceof Date ? e.startsAt : new Date(e.startsAt);
                    return (
                      <Link
                        key={e.id}
                        href={`/events/${e.slug}`}
                        className="flex gap-4 border-b border-zinc-100 py-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{e.title}</p>
                          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                            {formatShortDate(evStartsAt)} · {formatShortTime(evStartsAt)}
                          </p>
                          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                            {e.venueName ? `${e.venueName} · ` : ""}{e.city}
                          </p>
                          <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {!e.ticketPrice || e.ticketPrice === 0
                              ? "Free"
                              : new Intl.NumberFormat("en-US", { style: "currency", currency: e.ticketCurrency ?? "USD" }).format(e.ticketPrice)}
                          </p>
                        </div>
                        {e.imageUrl && (
                          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                            <Image src={e.imageUrl} alt="" fill className="object-cover" unoptimized />
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <p className="pt-6">
              <Link
                href="/events"
                className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
              >
                Back to browse
              </Link>
            </p>
          </div>

          {/* Sticky sidebar */}
          <EventTicketSidebar
            eventSlug={event.slug}
            eventTitle={event.title}
            category={event.category}
            initialClaimed={initialTicket}
            initialQuantity={initialTicketQty}
            signedIn={!!session?.user}
            blockReason={blockReason}
            ticketNote={event.ticketNote}
            priceLabel={priceLabel}
            currency={lowestTicketCurrency}
            sidebarDateLine={sidebarDateLine}
            eventImageUrl={gallery[0] ?? event.imageUrl}
            ticketTypes={sidebarTicketTypes}
          />
        </div>
      </div>
    </main>
  );
}
