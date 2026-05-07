import { NextResponse } from "next/server";
import { getMockLocationSuggestions } from "@/lib/location/mock-location-provider";
import type { LocationSuggestion } from "@/lib/location/types";
import { clientIp, rateLimit } from "@/lib/ratelimit";

type GooglePred = { description: string; place_id: string };
type GoogleAutoResponse = { predictions?: GooglePred[]; status: string; error_message?: string };

type AddressComponent = { long_name: string; short_name: string; types: string[] };

function pickComponent(components: AddressComponent[], ...types: string[]) {
  for (const t of types) {
    const c = components.find((x) => x.types.includes(t));
    if (c) return c.long_name;
  }
  return "";
}

function streetLine(components: AddressComponent[]) {
  const num = pickComponent(components, "street_number");
  const route = pickComponent(components, "route");
  const line = [num, route].filter(Boolean).join(" ").trim();
  return line;
}

async function googleAutocomplete(input: string, key: string): Promise<LocationSuggestion[]> {
  const params = new URLSearchParams({ input, key });
  const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`, {
    next: { revalidate: 0 },
  });
  const data = (await res.json()) as GoogleAutoResponse;
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return [];
  }
  return (
    data.predictions?.map((p) => ({
      id: p.place_id,
      label: p.description,
      venueName: "",
      city: "",
      region: "",
      placeId: p.place_id,
    })) ?? []
  );
}

async function googlePlaceDetails(placeId: string, key: string): Promise<LocationSuggestion | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "name,formatted_address,address_component,geometry/location",
    key,
  });
  const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`, {
    next: { revalidate: 0 },
  });
  const data = (await res.json()) as {
    status: string;
    result?: {
      name?: string;
      formatted_address?: string;
      address_components?: AddressComponent[];
      geometry?: { location?: { lat?: number; lng?: number } };
    };
  };
  if (data.status !== "OK" || !data.result) return null;
  const comps = data.result.address_components ?? [];
  const city = pickComponent(comps, "locality", "postal_town", "sublocality", "neighborhood");
  const region = pickComponent(comps, "administrative_area_level_1");
  const country = pickComponent(comps, "country");
  const postalCode = pickComponent(comps, "postal_code");
  const street = streetLine(comps);
  const name = data.result.name?.trim() ?? "";
  const lat = data.result.geometry?.location?.lat;
  const lng = data.result.geometry?.location?.lng;
  return {
    id: placeId,
    label: data.result.formatted_address ?? name,
    venueName: name,
    city: city || "",
    region,
    addressLine1: street || data.result.formatted_address || "",
    postalCode: postalCode || undefined,
    country: country || undefined,
    latitude: typeof lat === "number" ? lat : undefined,
    longitude: typeof lng === "number" ? lng : undefined,
    placeId,
  };
}

function mapsKey() {
  return (
    process.env.GOOGLE_MAPS_SERVER_KEY?.trim() || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || ""
  );
}

export async function GET(request: Request) {
  const rl = await rateLimit("location-suggest").limit(`ip:${clientIp(request.headers)}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const key = mapsKey();
  const placeId = searchParams.get("placeId");

  if (placeId && key) {
    try {
      const detail = await googlePlaceDetails(placeId, key);
      if (detail) return Response.json({ detail });
    } catch {
      /* fall through */
    }
    return Response.json({ detail: null }, { status: 404 });
  }

  const q = searchParams.get("q") ?? "";
  if (!key) {
    return Response.json({ suggestions: getMockLocationSuggestions(q) });
  }

  try {
    const suggestions = await googleAutocomplete(q, key);
    if (suggestions.length > 0) {
      return Response.json({ suggestions });
    }
  } catch {
    /* mock fallback */
  }

  return Response.json({ suggestions: getMockLocationSuggestions(q) });
}
