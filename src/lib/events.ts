import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type EventFilters = {
  q?: string;
  city?: string;
  category?: string;
  from?: string;
};

const publicEventInclude = {
  organizer: { select: { id: true, name: true, contactEmail: true, handle: true } },
  _count: { select: { tickets: true } },
} as const;

export type PublicEventDetail = Prisma.EventGetPayload<{ include: typeof publicEventInclude }>;

export function eventGalleryUrls(event: { imageUrl: string; galleryUrls: unknown }): string[] {
  const primary = event.imageUrl.trim();
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (u: string) => {
    const t = u.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  const g = event.galleryUrls;
  if (Array.isArray(g)) {
    for (const x of g) {
      if (typeof x === "string") push(x);
    }
  }
  if (out.length === 0) {
    push(primary);
    return out;
  }
  if (!seen.has(primary)) {
    return [primary, ...out.filter((u) => u !== primary)];
  }
  return out;
}

function matchesPublicSearchText(
  e: {
    title: string;
    description: string;
    city: string;
    venueName: string | null;
    tagline: string | null;
    presenterLine: string | null;
    heroSubtitle: string | null;
    category: string;
    organizer: { name: string; contactEmail: string } | null;
  },
  needle: string,
): boolean {
  const n = needle.toLowerCase();
  const hay = (s: string | null | undefined) => (s ?? "").toLowerCase();
  return (
    hay(e.title).includes(n) ||
    hay(e.description).includes(n) ||
    hay(e.city).includes(n) ||
    hay(e.venueName).includes(n) ||
    hay(e.tagline).includes(n) ||
    hay(e.presenterLine).includes(n) ||
    hay(e.heroSubtitle).includes(n) ||
    hay(e.category).includes(n) ||
    hay(e.organizer?.name).includes(n) ||
    hay(e.organizer?.contactEmail).includes(n)
  );
}

export async function getEvents(filters: EventFilters = {}) {
  const { q, city, category, from } = filters;
  const where: Prisma.EventWhereInput = {
    published: true,
  };

  if (city && city !== "all") {
    where.city = city;
  }
  if (category && category !== "all") {
    where.category = category;
  }
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) {
      where.startsAt = { gte: d };
    }
  }

  const qTrim = q?.trim();

  const rows = await prisma.event.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: {
      organizer: { select: { name: true, contactEmail: true } },
    },
  });

  if (!qTrim) {
    return rows;
  }

  return rows.filter((e) =>
    matchesPublicSearchText(
      {
        title: e.title,
        description: e.description,
        city: e.city,
        venueName: e.venueName,
        tagline: e.tagline,
        presenterLine: e.presenterLine,
        heroSubtitle: e.heroSubtitle,
        category: e.category,
        organizer: e.organizer,
      },
      qTrim,
    ),
  );
}

export async function getEventBySlug(slug: string): Promise<PublicEventDetail | null> {
  return prisma.event.findFirst({
    where: { slug, published: true },
    include: publicEventInclude,
  });
}

export async function getSimilarEvents(category: string, excludeId: string, take = 6) {
  return prisma.event.findMany({
    where: {
      published: true,
      category,
      id: { not: excludeId },
    },
    orderBy: { startsAt: "asc" },
    take,
  });
}

export async function getFeaturedEvents(limit = 6) {
  return prisma.event.findMany({
    where: { published: true },
    orderBy: { startsAt: "asc" },
    take: limit,
  });
}

export async function getDistinctCities() {
  const rows = await prisma.event.findMany({
    where: { published: true },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return rows.map((r) => r.city);
}

export async function getDistinctCategories() {
  const rows = await prisma.event.findMany({
    where: { published: true },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}
