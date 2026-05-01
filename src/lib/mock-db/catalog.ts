import {
  SEED_CATEGORIES,
  getSeedEvents,
  SEED_ORGANIZERS,
  SEED_TICKET_TYPES,
  SEED_VENUES,
} from "@/mock-data/seed";
import type { CatalogEventDetail, DomainEvent, PublicEventListItem, TicketType } from "@/types/domain";
import { EVENT_COVER_PLACEHOLDER } from "@/lib/cover-image";

function bestCoverFor(ev: DomainEvent): string {
  const cover = ev.coverImage?.trim() ?? "";
  if (cover && cover !== EVENT_COVER_PLACEHOLDER) return cover;
  const fromGallery = ev.galleryImages?.find((g) => g && g.trim().length > 0);
  return fromGallery ?? cover ?? EVENT_COVER_PLACEHOLDER;
}

const venueMap = new Map(SEED_VENUES.map((v) => [v.id, v]));
const organizerMap = new Map(SEED_ORGANIZERS.map((o) => [o.id, o]));

export type MockEventFilters = {
  q?: string;
  city?: string;
  category?: string;
  from?: string;
  to?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "relevance" | "date" | "price";
};

function isDiscoverable(ev: DomainEvent): boolean {
  if (ev.status !== "published") return false;
  if (ev.visibility !== "public") return false;
  return true;
}

export function mergedTicketTypesForEvent(eventId: string, extraAll: TicketType[] = []): TicketType[] {
  const seed = SEED_TICKET_TYPES.filter((t) => t.eventId === eventId);
  const extra = extraAll.filter((t) => t.eventId === eventId);
  return [...seed, ...extra];
}

export function minPriceForEvent(eventId: string, extraAll: TicketType[] = []): { min: number; currency: string } {
  const types = mergedTicketTypesForEvent(eventId, extraAll).filter(
    (t) => t.status === "on_sale" || t.status === "sold_out",
  );
  if (types.length === 0) return { min: 0, currency: "USD" };
  const min = Math.min(...types.map((t) => t.price));
  const currency = types[0]?.currency ?? "USD";
  return { min, currency };
}

export function domainEventToPublicListItem(ev: DomainEvent, extraAll: TicketType[] = []): PublicEventListItem {
  const venue = venueMap.get(ev.venueId);
  const listCity = ev.listingCity?.trim() || venue?.city || "TBA";
  const { min, currency } = minPriceForEvent(ev.id, extraAll);
  return {
    id: ev.id,
    slug: ev.slug,
    title: ev.title,
    category: ev.category,
    city: listCity,
    imageUrl: bestCoverFor(ev),
    startsAt: new Date(ev.startDateTime),
    minPrice: min,
    currency,
  };
}

function relevanceScore(ev: DomainEvent, q: string): number {
  const t = q.trim().toLowerCase();
  if (!t) return (ev.featured ? 10 : 0) + 1;
  let s = ev.featured ? 5 : 0;
  const hay = `${ev.title} ${ev.description} ${ev.shortDescription ?? ""} ${ev.tags.join(" ")}`.toLowerCase();
  if (ev.title.toLowerCase().includes(t)) s += 20;
  if (hay.includes(t)) s += 10;
  if (ev.category.toLowerCase().includes(t)) s += 4;
  const listCity = ev.listingCity?.trim() || venueMap.get(ev.venueId)?.city;
  if (listCity?.toLowerCase().includes(t)) s += 6;
  return s;
}

export function getSeedEventsMerged(extra: DomainEvent[] = []): DomainEvent[] {
  const byId = new Map<string, DomainEvent>();
  for (const e of getSeedEvents()) byId.set(e.id, e);
  for (const e of extra) byId.set(e.id, e);
  return Array.from(byId.values());
}

export function searchMockEvents(
  filters: MockEventFilters,
  extraEvents: DomainEvent[] = [],
  extraTicketTypes: TicketType[] = [],
): PublicEventListItem[] {
  const all = getSeedEventsMerged(extraEvents);
  let list = all.filter(isDiscoverable);

  const { q, city, category, from, to, type, minPrice, maxPrice, sort } = filters;

  if (city && city !== "all") {
    list = list.filter((ev) => {
      const c = ev.listingCity?.trim() || venueMap.get(ev.venueId)?.city;
      return c === city;
    });
  }
  if (category && category !== "all") {
    list = list.filter((ev) => ev.category === category);
  }
  if (type && type !== "all") {
    list = list.filter((ev) => ev.categorySlug === type);
  }
  if (q?.trim()) {
    const term = q.trim().toLowerCase();
    list = list.filter((ev) => {
      const listCity = ev.listingCity?.trim() || venueMap.get(ev.venueId)?.city;
      return (
        ev.title.toLowerCase().includes(term) ||
        ev.description.toLowerCase().includes(term) ||
        ev.category.toLowerCase().includes(term) ||
        (listCity?.toLowerCase().includes(term) ?? false)
      );
    });
  }
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) {
      list = list.filter((ev) => new Date(ev.startDateTime) >= d);
    }
  }
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    if (!Number.isNaN(d.getTime())) {
      list = list.filter((ev) => new Date(ev.startDateTime) <= d);
    }
  }
  if (minPrice != null && Number.isFinite(minPrice)) {
    list = list.filter((ev) => minPriceForEvent(ev.id, extraTicketTypes).min >= minPrice!);
  }
  if (maxPrice != null && Number.isFinite(maxPrice)) {
    list = list.filter((ev) => minPriceForEvent(ev.id, extraTicketTypes).min <= maxPrice!);
  }

  const mapped = list.map((ev) => domainEventToPublicListItem(ev, extraTicketTypes));

  if (sort === "price") {
    mapped.sort((a, b) => a.minPrice - b.minPrice || a.startsAt.getTime() - b.startsAt.getTime());
  } else if (sort === "relevance" && q?.trim()) {
    const scores = new Map(list.map((ev) => [ev.id, relevanceScore(ev, q)]));
    mapped.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
  } else {
    const nowMs = Date.now();
    mapped.sort((a, b) => {
      const ta = a.startsAt.getTime();
      const tb = b.startsAt.getTime();
      const aUp = ta >= nowMs;
      const bUp = tb >= nowMs;
      if (aUp !== bUp) return aUp ? -1 : 1;
      if (aUp) return ta - tb;
      return tb - ta;
    });
  }

  return mapped;
}

export function getMockEventBySlug(
  slug: string,
  extraEvents: DomainEvent[] = [],
  extraTicketTypes: TicketType[] = [],
  options?: { includeDraft?: boolean },
): CatalogEventDetail | null {
  const all = getSeedEventsMerged(extraEvents);
  const ev = all.find((e) => e.slug === slug);
  if (!ev) return null;
  if (!options?.includeDraft && ev.status === "draft") return null;
  if (ev.visibility === "private") return null;
  const venue = venueMap.get(ev.venueId);
  const baseOrganizer = organizerMap.get(ev.organizerId);
  if (!venue || !baseOrganizer) return null;
  const customName = ev.customOrganizerName?.trim();
  const organizer = customName ? { ...baseOrganizer, name: customName } : baseOrganizer;
  const ticketTypes = mergedTicketTypesForEvent(ev.id, extraTicketTypes);
  return { ...ev, venue, organizer, ticketTypes };
}

export function getMockFeaturedPublic(
  limit = 6,
  extraEvents: DomainEvent[] = [],
  extraTicketTypes: TicketType[] = [],
): PublicEventListItem[] {
  const all = getSeedEventsMerged(extraEvents);
  const now = new Date();
  const base = all.filter(
    (ev) => isDiscoverable(ev) && ev.featured && ev.status !== "cancelled",
  );
  const upcoming = base.filter((ev) => new Date(ev.startDateTime) >= now);
  const pool = upcoming.length > 0 ? upcoming : base;
  pool.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  return pool.slice(0, limit).map((e) => domainEventToPublicListItem(e, extraTicketTypes));
}

export function getMockRelatedPublic(
  category: string,
  excludeId: string,
  take = 6,
  extraEvents: DomainEvent[] = [],
  extraTicketTypes: TicketType[] = [],
): PublicEventListItem[] {
  const all = getSeedEventsMerged(extraEvents);
  const now = new Date();
  const sameCat = all.filter(
    (ev) => isDiscoverable(ev) && ev.category === category && ev.id !== excludeId,
  );
  const upcoming = sameCat.filter((ev) => new Date(ev.startDateTime) >= now);
  const pool = upcoming.length > 0 ? upcoming : sameCat;
  pool.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  return pool.slice(0, take).map((e) => domainEventToPublicListItem(e, extraTicketTypes));
}

export function getMockDistinctCities(extraEvents: DomainEvent[] = []): string[] {
  const all = getSeedEventsMerged(extraEvents);
  const cities = new Set<string>();
  for (const ev of all) {
    if (!isDiscoverable(ev)) continue;
    const label = ev.listingCity?.trim() || venueMap.get(ev.venueId)?.city;
    if (label) cities.add(label);
  }
  return Array.from(cities).sort();
}

export function getMockCategories() {
  return SEED_CATEGORIES;
}

export function getMockOrganizerByHandle(handle: string) {
  return SEED_ORGANIZERS.find((o) => o.handle === handle) ?? null;
}

export function getMockEventsForOrganizer(organizerId: string, extraEvents: DomainEvent[] = []): DomainEvent[] {
  return getSeedEventsMerged(extraEvents).filter((e) => e.organizerId === organizerId);
}

export function getTicketTypeById(id: string, extraAll: TicketType[] = []): TicketType | undefined {
  const seed = SEED_TICKET_TYPES.find((t) => t.id === id);
  if (seed) return seed;
  return extraAll.find((t) => t.id === id);
}

export function getAllSeedTicketTypes(): TicketType[] {
  return [...SEED_TICKET_TYPES];
}
