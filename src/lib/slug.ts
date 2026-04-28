import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

export function baseSlugFromTitle(title: string) {
  const s = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return s || "event";
}

export async function ensureUniqueEventSlug(title: string, excludeId?: string) {
  let slug = baseSlugFromTitle(title);
  for (let i = 0; i < 12; i++) {
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${baseSlugFromTitle(title)}-${randomBytes(3).toString("hex")}`;
  }
  throw new Error("Could not generate unique slug");
}
