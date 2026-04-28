import { SEED_VENUES } from "@/mock-data/seed";
import type { LocationSuggestion } from "@/lib/location/types";

const EXTRA_CITIES = [
  "New York",
  "Los Angeles",
  "Seattle",
  "Boston",
  "Portland",
  "Miami",
  "Nashville",
  "Atlanta",
];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function score(query: string, hay: string): number {
  const q = normalize(query);
  const h = normalize(hay);
  if (!q) return 0;
  if (h === q) return 100;
  if (h.startsWith(q)) return 80;
  if (h.includes(q)) return 60;
  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.every((p) => h.includes(p))) return 40;
  return 0;
}

export function getMockLocationSuggestions(query: string, limit = 8): LocationSuggestion[] {
  const q = query.trim();
  if (!q) {
    return SEED_VENUES.slice(0, limit).map((v) => ({
      id: `venue-${v.id}`,
      label: `${v.name}, ${v.city}${v.state ? `, ${v.state}` : ""}`,
      venueName: v.name,
      city: v.city,
      region: v.state ?? "",
      addressLine1: v.addressLine1,
    }));
  }

  const scored: { s: LocationSuggestion; n: number }[] = [];

  for (const v of SEED_VENUES) {
    const label = `${v.name}, ${v.city}${v.state ? `, ${v.state}` : ""}`;
    const blob = `${v.name} ${v.addressLine1} ${v.city} ${v.state ?? ""} ${v.country}`;
    const n = Math.max(score(q, blob), score(q, label));
    if (n > 0) {
      scored.push({
        n,
        s: {
          id: `venue-${v.id}`,
          label,
          venueName: v.name,
          city: v.city,
          region: v.state ?? "",
          addressLine1: v.addressLine1,
        },
      });
    }
  }

  for (const city of EXTRA_CITIES) {
    const n = score(q, city);
    if (n > 0) {
      scored.push({
        n,
        s: {
          id: `city-${normalize(city)}`,
          label: city,
          venueName: "",
          city,
          region: "",
        },
      });
    }
  }

  scored.sort((a, b) => b.n - a.n);
  const seen = new Set<string>();
  const out: LocationSuggestion[] = [];
  for (const { s } of scored) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}
