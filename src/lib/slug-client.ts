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

export function uniqueSlugForTitle(title: string, taken: Set<string>): string {
  const slug = baseSlugFromTitle(title);
  if (!taken.has(slug)) return slug;
  return `${slug}-${crypto.randomUUID().slice(0, 8)}`;
}
