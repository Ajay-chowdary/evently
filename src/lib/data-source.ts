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

let forceMockCatalog = false;

export type UnifiedEventFilters = EventFilters & {
  to?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "relevance" | "date" | "price";
};

export function isMockCatalog(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_CATALOG === "true" || !hasDatabaseUrl() || forceMockCatalog;
}

function isDatabaseConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("PrismaClientInitializationError")
  );
}

function enableMockCatalogFallback(error: unknown) {
  if (!isDatabaseConnectionError(error)) {
    throw error;
  }

  forceMockCatalog = true;
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

  try {
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
  } catch (error) {
    enableMockCatalogFallback(error);
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
  try {
    const event = await prismaGetEventBySlug(slug);
    if (!event) return null;
    return { mode: "prisma", event };
  } catch (error) {
    enableMockCatalogFallback(error);
    const event = getMockEventBySlug(slug, extraMockEvents);
    if (!event) return null;
    return { mode: "mock", event };
  }
}

export async function loadFeaturedForHome(
  limit: number,
  extraMockEvents: DomainEvent[] = [],
): Promise<PublicEventListItem[] | Event[]> {
  if (isMockCatalog()) {
    return getMockFeaturedPublic(limit, extraMockEvents);
  }
  try {
    return await prismaFeatured(limit);
  } catch (error) {
    enableMockCatalogFallback(error);
    return getMockFeaturedPublic(limit, extraMockEvents);
  }
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
  try {
    return await prismaSimilar(category, excludeId, take);
  } catch (error) {
    enableMockCatalogFallback(error);
    return getMockRelatedPublic(category, excludeId, take, extraMockEvents);
  }
}

export async function loadDistinctCities(extraMockEvents: DomainEvent[] = []): Promise<string[]> {
  if (isMockCatalog()) {
    return getMockDistinctCities(extraMockEvents);
  }
  try {
    return await prismaDistinctCities();
  } catch (error) {
    enableMockCatalogFallback(error);
    return getMockDistinctCities(extraMockEvents);
  }
}

export async function loadCategoriesForDiscovery() {
  if (isMockCatalog()) {
    return getMockCategories();
  }
  try {
    const names = await prismaDistinctCategories();
    return names.map((name, i) => ({
      id: `legacy-${i}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      icon: null,
      description: "",
    }));
  } catch (error) {
    enableMockCatalogFallback(error);
    return getMockCategories();
  }
}
