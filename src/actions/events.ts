"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureUniqueEventSlug } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function uploadDataUrlToSupabase(dataUrl: string, prefix: string): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) return dataUrl; // Not a data URL, return as is

  const supabase = await createSupabaseServerClient();
  
  const [header, base64Data] = dataUrl.split(",");
  if (!base64Data) return dataUrl;
  
  const mimeTypeMatch = header.match(/data:(.*?);/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
  const ext = mimeType.split("/")[1] || "jpg";
  
  const buffer = Buffer.from(base64Data, "base64");
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  
  const { data, error } = await supabase.storage
    .from("event-posters")
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: false,
    });
    
  if (error) {
    console.error("Supabase upload error:", error);
    return dataUrl; // fallback to data url if upload fails
  }
  
  const { data: publicUrlData } = supabase.storage.from("event-posters").getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

function parseGalleryExtrasJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function mergeGalleryUrls(primary: string, extras: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const tryPush = (u: string) => {
    const t = u.trim();
    if (!t || seen.has(t)) return;
    if (t.startsWith("data:image/") && t.includes(";base64,")) {
      seen.add(t);
      out.push(t);
      return;
    }
    try {
      const parsed = new URL(t);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
    } catch {
      return;
    }
    seen.add(t);
    out.push(t);
  };
  tryPush(primary);
  for (const x of extras) tryPush(x);
  return out;
}

function isAllowedEventImageUrl(s: string): boolean {
  const t = s.trim();
  if (t.startsWith("data:image/") && t.includes(";base64,")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

const optionalTrimmed = z
  .string()
  .optional()
  .transform((s) => {
    const t = (s ?? "").trim();
    return t === "" ? undefined : t;
  });

const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(8000),
  city: z.string().min(1, "City is required").max(100),
  region: optionalTrimmed.pipe(z.string().max(50).optional()),
  venueName: optionalTrimmed.pipe(z.string().max(200).optional()),
  category: z.string().min(1, "Category is required").max(80),
  imageUrl: z
    .string()
    .min(1, "Image URL is required")
    .refine(isAllowedEventImageUrl, "Must be a valid image URL"),
  presenterLine: optionalTrimmed.pipe(z.string().max(200).optional()),
  tagline: optionalTrimmed.pipe(z.string().max(300).optional()),
  heroSubtitle: optionalTrimmed.pipe(z.string().max(300).optional()),
  organizerLogoUrl: z
    .string()
    .optional()
    .transform((s) => ((s ?? "").trim() === "" ? undefined : (s ?? "").trim()))
    .pipe(
      z.union([
        z.undefined(),
        z.string().refine(isAllowedEventImageUrl, "Must be a valid image URL or upload"),
      ]),
    ),
  ticketPrice: z
    .string()
    .optional()
    .transform((s) => {
      const t = (s ?? "").trim();
      if (t === "") return 0;
      const n = Number(t);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    }),
  ticketCurrency: z.string().optional().transform((s) => (s ?? "USD").trim() || "USD"),
  ticketNote: optionalTrimmed.pipe(z.string().max(500).optional()),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().optional(),
  salesEndsAt: z.string().optional(),
  capacity: z
    .string()
    .optional()
    .transform((s) => {
      const t = (s ?? "").trim();
      if (t === "") return undefined;
      const n = Number(t);
      return Number.isFinite(n) ? n : NaN;
    })
    .pipe(z.number().int().positive().optional()),
  published: z.boolean(),
  galleryExtras: z
    .array(z.string())
    .transform((arr) => arr.map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(z.string().refine(isAllowedEventImageUrl, "Each slide must be a valid image URL or upload"))),
});

type ParsedEventForm = z.infer<typeof eventFormSchema>;

function normalizeEventFormFields(d: ParsedEventForm): ParsedEventForm {
  return {
    ...d,
    title: d.title.replace(/\s+/g, " ").trim(),
    description: d.description.replace(/\s+/g, " ").trim(),
    city: d.city.replace(/\s+/g, " ").trim(),
    region: d.region?.replace(/\s+/g, " ").trim(),
    venueName: d.venueName?.replace(/\s+/g, " ").trim(),
    category: d.category.replace(/\s+/g, " ").trim(),
    presenterLine: d.presenterLine?.replace(/\s+/g, " ").trim(),
    tagline: d.tagline?.replace(/\s+/g, " ").trim(),
    heroSubtitle: d.heroSubtitle?.replace(/\s+/g, " ").trim(),
    ticketNote: d.ticketNote?.replace(/\s+/g, " ").trim(),
  };
}

function parseForm(formData: FormData) {
  const saveType = String(formData.get("saveType") ?? "");
  let published: boolean;
  if (saveType === "publish") published = true;
  else if (saveType === "draft") published = false;
  else {
    const publishedRaw = formData.get("published");
    published = publishedRaw === "on" || publishedRaw === "true";
  }
  const galleryExtras = parseGalleryExtrasJson(String(formData.get("galleryUrlsJson") ?? ""));
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    region: String(formData.get("region") ?? "").trim(),
    venueName: String(formData.get("venueName") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    presenterLine: String(formData.get("presenterLine") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    heroSubtitle: String(formData.get("heroSubtitle") ?? "").trim(),
    organizerLogoUrl: String(formData.get("organizerLogoUrl") ?? "").trim(),
    ticketPrice: String(formData.get("ticketPrice") ?? "0").trim(),
    ticketCurrency: String(formData.get("ticketCurrency") ?? "USD").trim(),
    ticketNote: String(formData.get("ticketNote") ?? "").trim(),
    startsAt: String(formData.get("startsAt") ?? "").trim(),
    endsAt: String(formData.get("endsAt") ?? "").trim() || undefined,
    salesEndsAt: String(formData.get("salesEndsAt") ?? "").trim() || undefined,
    capacity: String(formData.get("capacity") ?? "").trim(),
    published,
    galleryExtras,
  };
}

export type EventActionState = { error: string; fieldErrors?: Record<string, string[]> } | null;

export async function createEvent(_prev: EventActionState, formData: FormData): Promise<EventActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to create an event." };
  }

  const raw = parseForm(formData);
  const parsed = eventFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    const missing = Object.entries(fe)
      .map(([k, msgs]) => `${k}: ${(msgs ?? []).join(", ")}`)
      .join("; ");
    return { error: `Missing or invalid fields -- ${missing}`, fieldErrors: fe };
  }

  const normalized = normalizeEventFormFields(parsed.data);

  const startsAt = new Date(normalized.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Invalid start date." };
  }
  let endsAt: Date | null = null;
  if (normalized.endsAt) {
    endsAt = new Date(normalized.endsAt);
    if (Number.isNaN(endsAt.getTime())) {
      return { error: "Invalid end date." };
    }
  }
  let salesEndsAt: Date | null = null;
  if (normalized.salesEndsAt) {
    salesEndsAt = new Date(normalized.salesEndsAt);
    if (Number.isNaN(salesEndsAt.getTime())) {
      return { error: "Invalid sales end date." };
    }
  }

  const mergedGalleryRaw = mergeGalleryUrls(normalized.imageUrl, normalized.galleryExtras);

  // Upload any data URLs to Supabase Storage
  const imageUrl = await uploadDataUrlToSupabase(normalized.imageUrl, "cover");
  const organizerLogoUrl = normalized.organizerLogoUrl
    ? await uploadDataUrlToSupabase(normalized.organizerLogoUrl, "logo")
    : null;
  const mergedGallery = await Promise.all(
    mergedGalleryRaw.map((url, i) => uploadDataUrlToSupabase(url, `slide-${i}`))
  );

  const slug = await ensureUniqueEventSlug(normalized.title);

  const created = await prisma.event.create({
    data: {
      title: normalized.title,
      description: normalized.description,
      city: normalized.city,
      region: normalized.region ?? null,
      venueName: normalized.venueName ?? null,
      category: normalized.category,
      imageUrl: imageUrl,
      galleryUrls: mergedGallery.length > 1 ? mergedGallery : Prisma.JsonNull,
      tagline: normalized.tagline ?? null,
      heroSubtitle: normalized.heroSubtitle ?? null,
      presenterLine: normalized.presenterLine ?? null,
      organizerLogoUrl: organizerLogoUrl,
      ticketPrice: normalized.ticketPrice ?? 0,
      ticketCurrency: normalized.ticketCurrency ?? "USD",
      ticketNote: normalized.ticketNote ?? null,
      startsAt,
      endsAt,
      salesEndsAt,
      capacity: normalized.capacity ?? null,
      published: normalized.published,
      slug,
      organizerId: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath("/");
  redirect(`/dashboard/${created.id}/edit`);
}

export async function updateEvent(_prev: EventActionState, formData: FormData): Promise<EventActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Missing event id." };
  }

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing || existing.organizerId !== session.user.id) {
    return { error: "You cannot edit this event." };
  }

  const raw = parseForm(formData);
  const parsed = eventFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    const missing = Object.entries(fe)
      .map(([k, msgs]) => `${k}: ${(msgs ?? []).join(", ")}`)
      .join("; ");
    return { error: `Missing or invalid fields -- ${missing}`, fieldErrors: fe };
  }

  const normalized = normalizeEventFormFields(parsed.data);

  const startsAt = new Date(normalized.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Invalid start date." };
  }
  let endsAt: Date | null = null;
  if (normalized.endsAt) {
    endsAt = new Date(normalized.endsAt);
    if (Number.isNaN(endsAt.getTime())) {
      return { error: "Invalid end date." };
    }
  }
  let salesEndsAt: Date | null = null;
  if (normalized.salesEndsAt) {
    salesEndsAt = new Date(normalized.salesEndsAt);
    if (Number.isNaN(salesEndsAt.getTime())) {
      return { error: "Invalid sales end date." };
    }
  }

  let slug = existing.slug;
  if (normalized.title !== existing.title) {
    slug = await ensureUniqueEventSlug(normalized.title, existing.id);
  }

  const mergedGalleryRaw = mergeGalleryUrls(normalized.imageUrl, normalized.galleryExtras);

  // Upload any data URLs to Supabase Storage
  const imageUrl = await uploadDataUrlToSupabase(normalized.imageUrl, "cover");
  const organizerLogoUrl = normalized.organizerLogoUrl
    ? await uploadDataUrlToSupabase(normalized.organizerLogoUrl, "logo")
    : null;
  const mergedGallery = await Promise.all(
    mergedGalleryRaw.map((url, i) => uploadDataUrlToSupabase(url, `slide-${i}`))
  );

  await prisma.event.update({
    where: { id },
    data: {
      title: normalized.title,
      description: normalized.description,
      city: normalized.city,
      region: normalized.region ?? null,
      venueName: normalized.venueName ?? null,
      category: normalized.category,
      imageUrl: imageUrl,
      galleryUrls: mergedGallery.length > 1 ? mergedGallery : Prisma.JsonNull,
      tagline: normalized.tagline ?? null,
      heroSubtitle: normalized.heroSubtitle ?? null,
      presenterLine: normalized.presenterLine ?? null,
      organizerLogoUrl: organizerLogoUrl,
      ticketPrice: normalized.ticketPrice ?? 0,
      ticketCurrency: normalized.ticketCurrency ?? "USD",
      ticketNote: normalized.ticketNote ?? null,
      startsAt,
      endsAt,
      salesEndsAt,
      capacity: normalized.capacity ?? null,
      published: normalized.published,
      slug,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath(`/events/${slug}`);
  revalidatePath(`/events/${existing.slug}`);
  revalidatePath("/");
  redirect("/dashboard");
}

export async function deleteEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing event id." };

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing || existing.organizerId !== session.user.id) {
    return { error: "You cannot delete this event." };
  }

  await prisma.event.delete({ where: { id } });
  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath("/");
  redirect("/dashboard");
}
