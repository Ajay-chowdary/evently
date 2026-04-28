export const EVENT_COVER_PLACEHOLDER =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80";

export function isProbablyImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith("data:image/") && t.includes(";base64,")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeCoverImageUrl(url: string | null | undefined): string {
  const t = (url ?? "").trim();
  return isProbablyImageUrl(t) ? t : EVENT_COVER_PLACEHOLDER;
}
