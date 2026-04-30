import { getSeedEvents } from "@/mock-data/seed";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function getMockSearchSuggestions(query: string, limit = 5): string[] {
  const term = normalize(query);
  if (!term) return [];

  const events = getSeedEvents().filter((event) => event.status === "published" && event.visibility === "public");
  const ranked = events
    .map((event) => {
      const title = event.title.trim();
      const lower = title.toLowerCase();
      if (lower === term) return { title, score: 100 };
      if (lower.startsWith(term)) return { title, score: 80 };
      if (lower.includes(term)) return { title, score: 60 };
      return null;
    })
    .filter((row): row is { title: string; score: number } => row !== null)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const row of ranked) {
    const key = row.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row.title);
    if (unique.length >= limit) break;
  }
  return unique;
}
