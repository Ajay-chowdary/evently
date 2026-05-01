import { SEED_VENUES } from "@/mock-data/seed";
import type { DomainEvent } from "@/types/domain";
import { uniqueSlugForTitle } from "@/lib/slug-client";
import { getSeedEventsMerged } from "@/lib/mock-db/catalog";

const DEFAULT_ORG = "org-me";

export function venueIdForCity(city: string): string {
  const v = SEED_VENUES.find((x) => x.city.toLowerCase() === city.trim().toLowerCase());
  return v?.id ?? "ven-loft";
}

export function buildMockDomainEvent(input: {
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  city: string;
  coverImage: string;
  startDateTime: string;
  endDateTime?: string | null;
  status: DomainEvent["status"];
  /** Events already in the organizer store; used so slugs never collide with seed or prior saves. */
  publishedSnapshot?: DomainEvent[];
}): DomainEvent {
  const merged = getSeedEventsMerged(input.publishedSnapshot ?? []);
  const taken = new Set(merged.map((e) => e.slug));
  const slug = uniqueSlugForTitle(input.title, taken);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const publishedLike = input.status === "published";
  return {
    id,
    slug,
    title: input.title.trim(),
    subtitle: null,
    description: input.description.trim(),
    shortDescription: null,
    category: input.category.trim(),
    categorySlug: input.categorySlug.trim() || input.category.toLowerCase().replace(/\s+/g, "-"),
    tags: [],
    coverImage: input.coverImage.trim() || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
    galleryImages: [],
    startDateTime: input.startDateTime,
    endDateTime: input.endDateTime ?? null,
    timezone: "America/Chicago",
    venueId: venueIdForCity(input.city),
    listingCity: input.city.trim() || null,
    organizerId: DEFAULT_ORG,
    status: input.status,
    featured: false,
    ageRestriction: null,
    dressCode: null,
    refundPolicy: null,
    agenda: [],
    faqItems: [],
    ticketTypeIds: [],
    visibility: publishedLike ? "public" : "unlisted",
    createdAt: now,
    updatedAt: now,
    salesEndsAt: null,
    ticketNote: null,
    presenterLine: null,
    tagline: null,
    heroSubtitle: null,
  };
}
