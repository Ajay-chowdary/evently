/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventDatetimeFields } from "@/components/event-datetime-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocompleteField } from "@/components/location-autocomplete-field";
import { EVENT_COVER_PLACEHOLDER, isProbablyImageUrl, normalizeCoverImageUrl } from "@/lib/cover-image";
import { getMockEventsForOrganizer } from "@/lib/mock-db/catalog";
import { venueIdForCity } from "@/lib/mock-organizer-factory";
import { toDatetimeLocalValue } from "@/lib/datetime-local";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";
import { SEED_VENUES } from "@/mock-data/seed";
import type { DomainEvent } from "@/types/domain";

const ORG_ID = "org-nightout";

function OrganizerEditFormFields({
  eventId,
  ev,
}: {
  eventId: string;
  ev: DomainEvent;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const patchEvent = useOrganizerMockStore((s) => s.patchEvent);
  const seedVenue = SEED_VENUES.find((x) => x.id === ev.venueId);

  const [title, setTitle] = useState(ev.title);
  const [description, setDescription] = useState(ev.description);
  const [status, setStatus] = useState(ev.status);
  const [coverUrl, setCoverUrl] = useState(ev.coverImage);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [objectPreviewUrl, setObjectPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [city, setCity] = useState(ev.listingCity?.trim() || seedVenue?.city || "");
  const [venueName, setVenueName] = useState(seedVenue?.name ?? "");
  const [region, setRegion] = useState(seedVenue?.state ?? "");
  const [startsAt, setStartsAt] = useState(() => toDatetimeLocalValue(new Date(ev.startDateTime)));
  const [endsAt, setEndsAt] = useState(
    ev.endDateTime ? toDatetimeLocalValue(new Date(ev.endDateTime)) : "",
  );

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => revokeObjectUrl();
  }, [revokeObjectUrl]);

  const effectiveCover = fileDataUrl?.trim() || coverUrl.trim() || EVENT_COVER_PLACEHOLDER;

  const previewSrc = useMemo(() => {
    if (objectPreviewUrl) return objectPreviewUrl;
    if (isProbablyImageUrl(coverUrl)) return coverUrl.trim();
    if (fileDataUrl) return fileDataUrl;
    return normalizeCoverImageUrl(ev.coverImage);
  }, [objectPreviewUrl, coverUrl, fileDataUrl, ev.coverImage]);

  const [displaySrc, setDisplaySrc] = useState(previewSrc);
  useEffect(() => {
    setDisplaySrc(previewSrc);
  }, [previewSrc]);

  const locationDisplay = useMemo(() => {
    const v = venueName.trim();
    const c = city.trim();
    const r = region.trim();
    if (v && c) return r ? `${v}, ${c}, ${r}` : `${v}, ${c}`;
    if (c) return r ? `${c}, ${r}` : c;
    return v || "";
  }, [venueName, city, region]);

  const clearUpload = () => {
    revokeObjectUrl();
    setObjectPreviewUrl(null);
    setFileDataUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPickFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    revokeObjectUrl();
    const ou = URL.createObjectURL(file);
    objectUrlRef.current = ou;
    setObjectPreviewUrl(ou);
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      setFileDataUrl(typeof r === "string" ? r : null);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const endIso =
        endsAt.trim() && !Number.isNaN(new Date(endsAt).getTime()) ? new Date(endsAt).toISOString() : null;
      const vis: DomainEvent["visibility"] = status === "draft" ? "unlisted" : "public";
      patchEvent(eventId, {
        title,
        description,
        status,
        coverImage: effectiveCover,
        startDateTime: new Date(startsAt).toISOString(),
        endDateTime: endIso,
        venueId: venueIdForCity(city),
        listingCity: city.trim() || null,
        visibility: vis,
      });
      const sp = new URLSearchParams();
      sp.set("saved", ev.slug);
      if (status === "published") sp.set("pub", "1");
      router.push(`/dashboard/events?${sp.toString()}`);
    } finally {
      setSaving(false);
    }
  };

  const showFallbackHint = !objectPreviewUrl && !fileDataUrl && !isProbablyImageUrl(coverUrl);

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-2xl space-y-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative aspect-[21/9] min-h-[120px] overflow-hidden bg-zinc-900">
          <img
            src={displaySrc}
            alt=""
            className="absolute inset-0 size-full object-cover"
            onError={() => setDisplaySrc(EVENT_COVER_PLACEHOLDER)}
          />
          {showFallbackHint ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 px-4 text-center text-xs text-white">
              Paste an image URL or upload a photo
            </div>
          ) : null}
        </div>
        <div className="space-y-4 border-t border-zinc-100 p-5 dark:border-zinc-800">
          <div>
            <Label htmlFor="cover-url-edit">Cover image URL</Label>
            <Input
              id="cover-url-edit"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              type="text"
              inputMode="url"
              placeholder="https://…"
              className="mt-2 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-hidden
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="secondary" className="rounded-xl" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 size-4" aria-hidden />
              Upload photo
            </Button>
            {fileDataUrl || objectPreviewUrl ? (
              <Button type="button" variant="ghost" className="rounded-xl text-zinc-600" onClick={clearUpload}>
                Remove upload
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          className="flex w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <LocationAutocompleteField
        label="Location"
        defaultDisplay={locationDisplay}
        onResolved={(next) => {
          setVenueName(next.venueName);
          setCity(next.city);
          setRegion(next.region);
        }}
      />

      <div className="space-y-2">
        <Label htmlFor="city-edit">City (required)</Label>
        <Input
          id="city-edit"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          className="rounded-xl"
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
        <p className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">Schedule</p>
        <EventDatetimeFields
          writeHiddenFormFields={false}
          startsAt={startsAt}
          onStartsAtChange={setStartsAt}
          endsAt={endsAt}
          onEndsAtChange={setEndsAt}
          showEnds
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as DomainEvent["status"])}
          className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="sold_out">Sold out</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving} className="min-w-[7rem] rounded-xl">
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
        <Button type="button" variant="secondary" className="rounded-xl" disabled={saving} onClick={() => router.push("/organizer-demo")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function OrganizerEditForm({ eventId }: { eventId: string }) {
  const published = useOrganizerMockStore((s) => s.publishedEvents);

  const ev = useMemo(() => {
    const rows = getMockEventsForOrganizer(ORG_ID, published);
    return rows.find((e) => e.id === eventId);
  }, [eventId, published]);

  if (!ev) {
    return <p className="text-zinc-600 dark:text-zinc-400">Event not found in demo store.</p>;
  }

  return <OrganizerEditFormFields key={`${eventId}-${ev.updatedAt}`} eventId={eventId} ev={ev} />;
}
