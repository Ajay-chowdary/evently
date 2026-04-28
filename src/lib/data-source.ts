import "server-only";

import type { Event } from "@/generated/prisma/client";
import type { PublicEventListItem } from "@/types/domain";
import {
  getMockCategories,
  getMockDistinctCities,
  getMockEventBySlug,
  getMockFeaturedPublic,
  getMockRelatedPublic,
  searchMockEvents,
  type MockEventFilters,
} from "@/lib/mock-db/catalog";
import type { CatalogEventDetail } from "@/types/domain";
import type { DomainEvent } from "@/types/domain";
import {
  getDistinctCategories as prismaDistinctCategories,
  getDistinctCities as prismaDistinctCities,
  getEventBySlug as prismaGetEventBySlug,
  getEvents as prismaGetEvents,
  getFeaturedEvents as prismaFeatured,
  getSimilarEvents as prismaSimilar,
  type EventFilters,
  type PublicEventDetail,
} from "@/lib/events";
import { hasDatabaseUrl } from "@/lib/env";

export type UnifiedEventFilters = EventFilters & {
  to?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "relevance" | "date" | "price";
};

export function isMockCatalog(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_CATALOG === "true" || !hasDatabaseUrl();
}

function prismaFiltersToWhere(f: UnifiedEventFilters): EventFilters {
  const { q, city, category, from } = f;
  return { q, city, category, from };
}

export async function loadEventsForBrowse(
  filters: UnifiedEventFilters,
  extraMockEvents: DomainEvent[] = [],
): Promise<PublicEventListItem[] | Event[]> {
  if (isMockCatalog()) {
    const mockFilters: MockEventFilters = {
      q: filters.q,
      city: filters.city,
      category: filters.category,
      from: filters.from,
      to: filters.to,
      type: filters.type,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
    };
    return searchMockEvents(mockFilters, extraMockEvents);
  }
  const rows = await prismaGetEvents(prismaFiltersToWhere(filters));
  if (filters.to) {
    const end = new Date(filters.to);
    end.setHours(23, 59, 59, 999);
    return rows.filter((e) => new Date(e.startsAt) <= end);
  }
  const sorted = [...rows];
  if (filters.sort === "date" || !filters.sort) {
    sorted.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }
  return sorted;
}

export async function loadEventDetailBySlug(
  slug: string,
  extraMockEvents: DomainEvent[] = [],
): Promise<{ mode: "mock"; event: CatalogEventDetail } | { mode: "prisma"; event: PublicEventDetail } | null> {
  if (isMockCatalog()) {
    const event = getMockEventBySlug(slug, extraMockEvents);
    if (!event) return null;
    return { mode: "mock", event };
  }
  const event = await prismaGetEventBySlug(slug);
  if (!event) return null;
  return { mode: "prisma", event };
}

export async function loadFeaturedForHome(
  limit: number,
  extraMockEvents: DomainEvent[] = [],
): Promise<PublicEventListItem[] | Event[]> {
  if (isMockCatalog()) {
    return getMockFeaturedPublic(limit, extraMockEvents);
  }
  return prismaFeatured(limit);
}

export async function loadSimilarForDetail(
  category: string,
  excludeId: string,
  take: number,
  extraMockEvents: DomainEvent[] = [],
): Promise<PublicEventListItem[] | Event[]> {
  if (isMockCatalog()) {
    return getMockRelatedPublic(category, excludeId, take, extraMockEvents);
  }
  return prismaSimilar(category, excludeId, take);
}

export async function loadDistinctCities(extraMockEvents: DomainEvent[] = []): Promise<string[]> {
  if (isMockCatalog()) {
    return getMockDistinctCities(extraMockEvents);
  }
  return prismaDistinctCities();
}

export async function loadCategoriesForDiscovery() {
  if (isMockCatalog()) {
    return getMockCategories();
  }
  const names = await prismaDistinctCategories();
  return names.map((name, i) => ({
    id: `legacy-${i}`,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    icon: null,
    description: "",
  }));
}
