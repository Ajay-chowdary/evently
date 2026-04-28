/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventDatetimeFields } from "@/components/event-datetime-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocompleteField } from "@/components/location-autocomplete-field";
import { EVENT_COVER_PLACEHOLDER, isProbablyImageUrl } from "@/lib/cover-image";
import { createOrganizerMockEvent } from "@/lib/mock-event-repository";
import { toDatetimeLocalValue } from "@/lib/datetime-local";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";

const CATEGORIES = [
  { name: "Music", slug: "music" },
  { name: "Wellness", slug: "wellness" },
  { name: "Business", slug: "business" },
  { name: "Arts", slug: "arts" },
  { name: "Community", slug: "community" },
];

export function OrganizerCreateForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const addOrReplaceEvent = useOrganizerMockStore((s) => s.addOrReplaceEvent);
  const published = useOrganizerMockStore((s) => s.publishedEvents);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Austin");
  const [venueName, setVenueName] = useState("");
  const [region, setRegion] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [objectPreviewUrl, setObjectPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(19, 0, 0, 0);
    return toDatetimeLocalValue(d);
  }, []);
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState("");
  const [categorySlug, setCategorySlug] = useState("music");
  const [status, setStatus] = useState<"draft" | "published">("published");

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => revokeObjectUrl();
  }, [revokeObjectUrl]);

  const effectiveCoverForSave = fileDataUrl?.trim() || coverUrl.trim() || EVENT_COVER_PLACEHOLDER;

  const previewSrc = useMemo(() => {
    if (objectPreviewUrl) return objectPreviewUrl;
    if (isProbablyImageUrl(coverUrl)) return coverUrl.trim();
    if (fileDataUrl) return fileDataUrl;
    return EVENT_COVER_PLACEHOLDER;
  }, [objectPreviewUrl, coverUrl, fileDataUrl]);

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
    setFormError(null);

    const t = title.trim();
    const d = description.trim();
    const c = city.trim();
    if (!t || !d || !c) {
      setFormError("Title, description, and city are required.");
      return;
    }

    const startMs = new Date(startsAt).getTime();
    if (!Number.isFinite(startMs)) {
      setFormError("Choose a valid start date and time.");
      return;
    }

    setSaving(true);
    try {
      const cat = CATEGORIES.find((x) => x.slug === categorySlug) ?? CATEGORIES[0];
      const endIso =
        endsAt.trim() && !Number.isNaN(new Date(endsAt).getTime()) ? new Date(endsAt).toISOString() : null;

      const { event, ticketTypes } = createOrganizerMockEvent(
        {
          title: t,
          description: d,
          city: c,
          categoryName: cat.name,
          categorySlug: cat.slug,
          coverImage: effectiveCoverForSave,
          startDateTimeIso: new Date(startsAt).toISOString(),
          endDateTimeIso: endIso,
          status,
        },
        published,
      );

      addOrReplaceEvent(event, ticketTypes);

      const sp = new URLSearchParams();
      sp.set("saved", event.slug);
      if (status === "published") sp.set("pub", "1");
      router.push(`/dashboard/events?${sp.toString()}`);
    } catch {
      setFormError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const showFallbackHint = !objectPreviewUrl && !fileDataUrl && !isProbablyImageUrl(coverUrl);

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-2xl space-y-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative aspect-[21/9] min-h-[140px] overflow-hidden bg-zinc-900">
          <img
            src={displaySrc}
            alt=""
            className="absolute inset-0 size-full object-cover"
            onError={() => setDisplaySrc(EVENT_COVER_PLACEHOLDER)}
          />
          {showFallbackHint ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 px-4 text-center text-xs text-white">
              Paste an image URL or upload a photo for the cover
            </div>
          ) : null}
        </div>
        <div className="space-y-4 border-t border-zinc-100 p-5 dark:border-zinc-800">
          <div>
            <Label htmlFor="cover-url">Cover image URL</Label>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Or use upload below. Data stays in this browser until you wire cloud storage.
            </p>
            <Input
              id="cover-url"
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

      {formError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {formError}
        </p>
      ) : null}

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city-refine">City (required)</Label>
          <Input
            id="city-refine"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
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
        <Label htmlFor="status">Visibility</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="published">Published (on public browse)</option>
          <option value="draft">Draft (organizer list only)</option>
        </select>
      </div>

      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-zinc-200 bg-background/95 py-4 backdrop-blur dark:border-zinc-800">
        <Button type="submit" disabled={saving} className="rounded-xl min-w-[8.5rem]">
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Save event"
          )}
        </Button>
        <Button type="button" variant="secondary" className="rounded-xl" disabled={saving} onClick={() => router.push("/organizer-demo")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
