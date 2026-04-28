import { getMockLocationSuggestions } from "@/lib/location/mock-location-provider";
import type { LocationSuggestion } from "@/lib/location/types";

/**
 * Server-side entry for location suggestions when not using the HTTP API route.
 * Prefer GET /api/location/suggest from the client so Google mode stays centralized.
 */
export function getLocalLocationSuggestions(query: string): LocationSuggestion[] {
  return getMockLocationSuggestions(query);
}
