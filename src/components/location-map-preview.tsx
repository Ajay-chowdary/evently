"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";

type Props = {
  query?: string;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
  height?: string;
};

function buildEmbedSrc(
  apiKey: string,
  query: string | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined,
): string | null {
  if (!apiKey) return null;
  if (typeof lat === "number" && typeof lng === "number") {
    const params = new URLSearchParams({
      key: apiKey,
      q: `${lat},${lng}`,
      zoom: "15",
    });
    return `https://www.google.com/maps/embed/v1/place?${params}`;
  }
  if (query && query.trim()) {
    const params = new URLSearchParams({
      key: apiKey,
      q: query.trim(),
    });
    return `https://www.google.com/maps/embed/v1/place?${params}`;
  }
  return null;
}

export function LocationMapPreview({
  query,
  latitude,
  longitude,
  className = "",
  height = "h-52",
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const src = useMemo(
    () => buildEmbedSrc(apiKey, query, latitude, longitude),
    [apiKey, query, latitude, longitude],
  );

  if (!src) {
    return (
      <div
        className={`flex ${height} items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400 ${className}`}
      >
        <span className="inline-flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Enter a location to see the map
        </span>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 ${height} ${className}`}
    >
      <iframe
        title="Event location map"
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="h-full w-full"
        style={{ border: 0 }}
      />
    </div>
  );
}
