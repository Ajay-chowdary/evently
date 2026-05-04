import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicEventDetail } from "@/lib/events";
import type { PublicEventListItem } from "@/types/domain";

/** Mirrors UnifiedEventFilters fields used for public browse (avoid importing data-source here). */
export type SupabaseBrowseFilters = {
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

type TicketTypeRow = {
  id: string;
  price: number | string | null;
  currency: string | null;
  status?: string | null;
};

type EventListRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  city: string;
  cover_image_url: string;
  starts_at: string;
  ticket_types: TicketTypeRow[] | null;
};

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function minPriceForTypes(types: TicketTypeRow[] | null | undefined): { min: number; currency: string } {
  const list = (types ?? []).filter((t) => {
    const s = (t.status ?? "active").toLowerCase();
    return s === "active" || s === "sold_out";
  });
  if (list.length === 0) return { min: 0, currency: "USD" };
  let min = Infinity;
  let currency = "USD";
  for (const t of list) {
    const p = num(t.price);
    if (p < min) {
      min = p;
      currency = t.currency?.trim() || "USD";
    }
  }
  if (!Number.isFinite(min)) return { min: 0, currency };
  return { min, currency };
}

function matchesSearchText(row: EventListRow, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  const hay = (s: string | null | undefined) => (s ?? "").toLowerCase();
  return (
    hay(row.title).includes(n) ||
    hay(row.category).includes(n) ||
    hay(row.city).includes(n)
  );
}

/**
 * Published events for browse cards (RLS: anon can select published public/unlisted).
 */
export async function loadPublishedEventsForBrowseSb(filters: SupabaseBrowseFilters): Promise<PublicEventListItem[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("events")
    .select(
      `
      id,
      slug,
      title,
      category,
      city,
      cover_image_url,
      starts_at,
      ticket_types (price, currency, status)
    `,
    )
    .eq("published", true)
    .eq("status", "published")
    .in("visibility", ["public", "unlisted"]);

  if (filters.city && filters.city !== "all") {
    query = query.eq("city", filters.city);
  }
  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }
  if (filters.type && filters.type !== "all") {
    query = query.eq("category", filters.type);
  }
  if (filters.from) {
    const d = new Date(filters.from);
    if (!Number.isNaN(d.getTime())) {
      query = query.gte("starts_at", d.toISOString());
    }
  }

  const { data, error } = await query.order("starts_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  let rows = data as unknown as EventListRow[];

  if (filters.to) {
    const end = new Date(filters.to);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      rows = rows.filter((r) => new Date(r.starts_at) <= end);
    }
  }

  const qTrim = filters.q?.trim();
  if (qTrim) {
    rows = rows.filter((r) => matchesSearchText(r, qTrim));
  }

  let mapped: PublicEventListItem[] = rows.map((r) => {
    const { min, currency } = minPriceForTypes(r.ticket_types);
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      city: r.city,
      imageUrl: r.cover_image_url?.trim() || "",
      startsAt: new Date(r.starts_at),
      minPrice: min,
      currency,
    };
  });

  if (filters.minPrice != null) {
    mapped = mapped.filter((e) => e.minPrice >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    mapped = mapped.filter((e) => e.minPrice <= filters.maxPrice!);
  }

  const sort = filters.sort ?? "date";
  if (sort === "price") {
    mapped.sort((a, b) => a.minPrice - b.minPrice || a.startsAt.getTime() - b.startsAt.getTime());
  } else if (sort === "relevance" && qTrim) {
    const t = qTrim.toLowerCase();
    mapped.sort((a, b) => {
      const score = (e: PublicEventListItem) => {
        let s = 0;
        if (e.title.toLowerCase().includes(t)) s += 10;
        if (e.category.toLowerCase().includes(t)) s += 4;
        if (e.city.toLowerCase().includes(t)) s += 2;
        return s;
      };
      return score(b) - score(a) || a.startsAt.getTime() - b.startsAt.getTime();
    });
  } else {
    mapped.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  return mapped;
}

export async function loadDistinctCitiesSb(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("city")
    .eq("published", true)
    .eq("status", "published")
    .in("visibility", ["public", "unlisted"]);

  if (error || !data) return [];
  const set = new Set<string>();
  for (const row of data as { city: string }[]) {
    if (row.city?.trim()) set.add(row.city.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function loadDistinctCategoriesSb(): Promise<{ id: string; name: string; slug: string }[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("category")
    .eq("published", true)
    .eq("status", "published")
    .in("visibility", ["public", "unlisted"]);

  if (error || !data) return [];
  const names = new Set<string>();
  for (const row of data as { category: string }[]) {
    if (row.category?.trim()) names.add(row.category.trim());
  }
  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((name, i) => ({
      id: `sb-cat-${i}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    }));
}

export async function loadSimilarEventsSb(
  category: string,
  excludeId: string,
  take: number,
): Promise<PublicEventListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      id,
      slug,
      title,
      category,
      city,
      cover_image_url,
      starts_at,
      ticket_price,
      ticket_currency,
      ticket_types (price, currency, status)
    `,
    )
    .eq("published", true)
    .eq("status", "published")
    .in("visibility", ["public", "unlisted"])
    .eq("category", category)
    .neq("id", excludeId)
    .order("starts_at", { ascending: true })
    .limit(take);

  if (error || !data) return [];

  return (data as unknown as SimilarRow[]).map((r) => {
    const types = r.ticket_types as TicketTypeRow[] | null;
    const { min, currency } = minPriceForTypes(types);
    const fallbackPrice = num(r.ticket_price);
    const fallbackCur = r.ticket_currency?.trim() || "USD";
    const minPrice = types && types.length > 0 ? min : fallbackPrice;
    const cur = types && types.length > 0 ? currency : fallbackCur;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      city: r.city,
      imageUrl: r.cover_image_url?.trim() || "",
      startsAt: new Date(r.starts_at),
      minPrice,
      currency: cur,
    };
  });
}

type SimilarRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  city: string;
  cover_image_url: string;
  starts_at: string;
  ticket_price: number | string | null;
  ticket_currency: string | null;
  ticket_types: TicketTypeRow[] | null;
};

type OrganizerRow = {
  id: string;
  handle: string;
  name: string;
  logo_url: string | null;
  bio: string | null;
  verified: boolean;
  contact_email: string;
};

type TicketTypeFullRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  currency: string | null;
  inventory_total: number | string | null;
  inventory_remaining: number | string | null;
  min_per_order: number | string | null;
  max_per_order: number | string | null;
  sale_start: string | null;
  sale_end: string | null;
  status: string;
};

type EventDetailRow = {
  id: string;
  organizer_id: string;
  venue_id: string | null;
  category_id: string | null;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string | null;
  description: string;
  category: string;
  city: string;
  region: string | null;
  country: string | null;
  venue_name: string | null;
  cover_image_url: string;
  gallery_urls: unknown;
  tagline: string | null;
  hero_subtitle: string | null;
  presenter_line: string | null;
  organizer_logo_url: string | null;
  ticket_price: number | string | null;
  ticket_currency: string | null;
  sales_ends_at: string | null;
  capacity: number | string | null;
  ticket_note: string | null;
  status: string;
  visibility: string;
  featured: boolean;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  age_restriction: string | null;
  dress_code: string | null;
  refund_policy: string | null;
  custom_organizer_name: string | null;
  published: boolean;
  published_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  organizers: OrganizerRow | null;
  ticket_types: TicketTypeFullRow[] | null;
};

function mapTicketStatus(db: string): "ACTIVE" | "SOLD_OUT" | "DRAFT" | "HIDDEN" | "CANCELLED" {
  const u = db.toLowerCase();
  if (u === "sold_out") return "SOLD_OUT";
  if (u === "draft") return "DRAFT";
  if (u === "hidden") return "HIDDEN";
  if (u === "cancelled") return "CANCELLED";
  return "ACTIVE";
}

/**
 * Full event detail for /events/[slug] Prisma-shaped page (organizer + ticket types).
 */
export async function getPublicEventDetailBySlugSb(slug: string): Promise<PublicEventDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      `
      *,
      organizers (*),
      ticket_types (*)
    `,
    )
    .eq("slug", slug)
    .eq("published", true)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as EventDetailRow;
  const org = row.organizers;

  const ticketTypes = (row.ticket_types ?? [])
    .filter((t) => ["active", "sold_out"].includes(t.status?.toLowerCase?.() ?? ""))
    .sort((a, b) => num(a.price) - num(b.price) || a.name.localeCompare(b.name))
    .map((t) => ({
      id: t.id,
      eventId: row.id,
      name: t.name,
      description: t.description,
      price: num(t.price),
      currency: t.currency?.trim() || "USD",
      inventoryTotal: Math.round(num(t.inventory_total)),
      inventoryRemaining: Math.round(num(t.inventory_remaining)),
      minPerOrder: Math.round(num(t.min_per_order)) || 1,
      maxPerOrder: Math.round(num(t.max_per_order)) || 10,
      saleStart: t.sale_start ? new Date(t.sale_start) : null,
      saleEnd: t.sale_end ? new Date(t.sale_end) : null,
      status: mapTicketStatus(t.status ?? "active"),
      perks: null,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

  const organizerDisplayName = row.custom_organizer_name?.trim() || org?.name || "Organizer";

  const mapped = {
    id: row.id,
    organizerId: row.organizer_id,
    venueId: row.venue_id,
    categoryId: row.category_id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    shortDescription: row.short_description,
    description: row.description,
    category: row.category,
    city: row.city,
    region: row.region,
    country: row.country,
    venueName: row.venue_name,
    imageUrl: row.cover_image_url,
    galleryUrls: row.gallery_urls,
    tagline: row.tagline,
    heroSubtitle: row.hero_subtitle,
    presenterLine: row.presenter_line,
    organizerLogoUrl: row.organizer_logo_url,
    ticketPrice: num(row.ticket_price),
    ticketCurrency: row.ticket_currency?.trim() || "USD",
    salesEndsAt: row.sales_ends_at ? new Date(row.sales_ends_at) : null,
    capacity: row.capacity != null ? Math.round(num(row.capacity)) : null,
    ticketNote: row.ticket_note,
    status: "PUBLISHED",
    visibility: row.visibility?.toUpperCase() === "PRIVATE" ? "PRIVATE" : row.visibility?.toUpperCase() === "UNLISTED" ? "UNLISTED" : "PUBLIC",
    featured: row.featured,
    startsAt: new Date(row.starts_at),
    endsAt: row.ends_at ? new Date(row.ends_at) : null,
    timezone: row.timezone,
    ageRestriction: row.age_restriction,
    dressCode: row.dress_code,
    refundPolicy: row.refund_policy,
    published: row.published,
    publishedAt: row.published_at ? new Date(row.published_at) : null,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    organizer: org
      ? {
          id: org.id,
          name: organizerDisplayName,
          contactEmail: org.contact_email,
          handle: org.handle,
          logoUrl: org.logo_url,
          bio: org.bio,
          verified: org.verified,
        }
      : null,
    ticketTypes,
    _count: { tickets: 0 },
  };

  return mapped as unknown as PublicEventDetail;
}
