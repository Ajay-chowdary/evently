/* eslint-disable @next/next/no-img-element -- organizer cover URLs are arbitrary HTTPS hosts */
"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, Circle, Eye, MapPin, Pencil, Plus, Trash2, Upload } from "lucide-react";
import type { Event } from "@/generated/prisma/client";
import { createEvent, updateEvent, type EventActionState } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { DeleteEventButton } from "@/components/delete-event-button";
import { EventDatetimeFields, eventDateTimeInputClass } from "@/components/event-datetime-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationAutocompleteField } from "@/components/location-autocomplete-field";
import { EVENT_COVER_PLACEHOLDER, isProbablyImageUrl, normalizeCoverImageUrl } from "@/lib/cover-image";
import { joinDatetimeLocal, splitDatetimeLocal, toDatetimeLocalValue } from "@/lib/datetime-local";
import { format } from "@/lib/format-date";
import { cn } from "@/lib/utils";

type Props =
  | { mode: "create"; event?: undefined }
  | { mode: "edit"; event: Event };

function parseDatetimeLocal(s: string): Date | null {
  if (!s.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function galleryExtrasFromEvent(e: Event): string[] {
  const g = e.galleryUrls;
  if (!Array.isArray(g)) return [];
  const primary = e.imageUrl.trim();
  return g
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((u) => u && u !== primary);
}

const STEPS = [
  {
    title: "Build event page",
    description: "Add your event details so attendees know what to expect.",
  },
  {
    title: "Add tickets",
    description: "Guests can claim a free ticket from the public event page.",
  },
  {
    title: "Publish",
    description: "Save as a draft or publish from the bar below when you are ready.",
  },
] as const;

export function EventForm(props: Props) {
  const action = props.mode === "create" ? createEvent : updateEvent;
  const [state, formAction, pending] = useActionState(action, null as EventActionState);

  const e = props.mode === "edit" ? props.event : null;

  const [step, setStep] = useState(0);

  const [title, setTitle] = useState(e?.title ?? "");
  const [description, setDescription] = useState(e?.description ?? "");
  const [city, setCity] = useState(e?.city ?? "");
  const [region, setRegion] = useState(e?.region ?? "");
  const [venueName, setVenueName] = useState(e?.venueName ?? "");
  const [category, setCategory] = useState(e?.category ?? "");
  const [imageUrl, setImageUrl] = useState(e?.imageUrl ?? "");
  const [coverSrc, setCoverSrc] = useState(() => normalizeCoverImageUrl(e?.imageUrl ?? ""));
  const [presenterLine, setPresenterLine] = useState(e?.presenterLine ?? "");
  const [tagline, setTagline] = useState(e?.tagline ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(e?.heroSubtitle ?? "");
  const [organizerLogoUrl, setOrganizerLogoUrl] = useState(e?.organizerLogoUrl ?? "");
  const [ticketPrice, setTicketPrice] = useState(e?.ticketPrice != null ? String(e.ticketPrice) : "0");
  const [ticketCurrency, setTicketCurrency] = useState(e?.ticketCurrency ?? "USD");
  const [ticketNote, setTicketNote] = useState(e?.ticketNote ?? "");
  const [extras, setExtras] = useState<string[]>(() => (e ? galleryExtrasFromEvent(e) : []));
  const [startsAt, setStartsAt] = useState(
    e ? toDatetimeLocalValue(new Date(e.startsAt)) : "",
  );
  const [endsAt, setEndsAt] = useState(
    e?.endsAt ? toDatetimeLocalValue(new Date(e.endsAt)) : "",
  );
  const [salesEndsAt, setSalesEndsAt] = useState(
    e?.salesEndsAt ? toDatetimeLocalValue(new Date(e.salesEndsAt)) : "",
  );
  const [capacity, setCapacity] = useState(e?.capacity != null ? String(e.capacity) : "");
  const [published, setPublished] = useState(props.mode === "edit" ? props.event.published : false);
  const [submitIntent, setSubmitIntent] = useState<"draft" | "publish" | null>(null);

  const coverFileRef = useRef<HTMLInputElement>(null);
  const organizerLogoFileRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pending) setSubmitIntent(null);
  }, [pending]);

  useEffect(() => {
    if (state?.error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [state]);

  const onCoverFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setImageUrl(r);
    };
    reader.readAsDataURL(file);
  };

  const clearCoverUpload = () => {
    setImageUrl("");
    if (coverFileRef.current) coverFileRef.current.value = "";
  };

  const onOrganizerLogoFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setOrganizerLogoUrl(r);
    };
    reader.readAsDataURL(file);
  };

  const clearOrganizerLogoUpload = () => {
    setOrganizerLogoUrl("");
    if (organizerLogoFileRef.current) organizerLogoFileRef.current.value = "";
  };

  useEffect(() => {
    setCoverSrc(normalizeCoverImageUrl(imageUrl));
  }, [imageUrl]);

  const locationDisplay = useMemo(() => {
    const v = venueName.trim();
    const c = city.trim();
    const r = region.trim();
    if (v && c) return r ? `${v}, ${c}, ${r}` : `${v}, ${c}`;
    if (c) return r ? `${c}, ${r}` : c;
    return v || "";
  }, [venueName, city, region]);

  const startsDate = useMemo(() => parseDatetimeLocal(startsAt), [startsAt]);
  const dateLine = startsDate ? format(startsDate) : "Date and time";

  const previewHref =
    props.mode === "edit" && e?.slug && (e.published || published) ? `/events/${e.slug}` : null;

  const addExtra = () => setExtras((x) => [...x, ""]);
  const removeExtra = (i: number) => setExtras((x) => x.filter((_, j) => j !== i));
  const setExtraAt = (i: number, v: string) =>
    setExtras((x) => x.map((s, j) => (j === i ? v : s)));

  const onSlideFile = (index: number, file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") setExtraAt(index, r);
    };
    reader.readAsDataURL(file);
  };

  const publishButtonLabel =
    pending && submitIntent === "publish"
      ? "Publishing…"
      : props.mode === "edit" && e?.published
        ? "Update live page"
        : "Publish event";

  return (
    <div className="flex flex-col gap-0 lg:min-h-[calc(100dvh-12rem)] lg:flex-row lg:gap-0">
      <aside className="shrink-0 border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-900/50 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="space-y-6 p-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Back to events
          </Link>

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-violet-200/80 to-amber-100/80 dark:from-violet-950/50 dark:to-zinc-900">
              <img
                src={coverSrc}
                alt=""
                className="absolute inset-0 size-full object-cover"
                onError={() => setCoverSrc(EVENT_COVER_PLACEHOLDER)}
              />
              {!isProbablyImageUrl(imageUrl) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/40 px-3 text-center text-xs text-white">
                  Add a photo or image URL
                </div>
              ) : null}
            </div>
            <div className="space-y-2 p-4">
              <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {title.trim() || "Event title"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{dateLine}</p>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                  props.mode === "create"
                    ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    : published
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
                )}
              >
                {props.mode === "create"
                  ? "Not saved yet"
                  : published
                    ? "Published"
                    : "Draft"}
              </span>
              {props.mode === "create" ? (
                <p className="mt-2 text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
                  Fill all required fields, then use Save event or Publish event at the bottom.
                </p>
              ) : null}
              {props.mode === "edit" && e ? (
                <dl className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-[10px] leading-snug text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <div>
                    <dt className="font-medium text-zinc-600 dark:text-zinc-300">Saved visibility</dt>
                    <dd>{e.published ? "Published" : "Draft"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-600 dark:text-zinc-300">Slug</dt>
                    <dd className="break-all font-mono">{e.slug}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-600 dark:text-zinc-300">Start</dt>
                    <dd>{startsDate ? format(startsDate) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-600 dark:text-zinc-300">City</dt>
                    <dd>{city.trim() || e.city}</dd>
                  </div>
                </dl>
              ) : null}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Steps
            </p>
            <ol className="space-y-3">
              {STEPS.map((s, i) => {
                const active = i === step;
                return (
                  <li key={s.title}>
                    <button
                      type="button"
                      onClick={() => setStep(i)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-colors",
                        active
                          ? "border-sky-300 bg-sky-50/80 dark:border-sky-800 dark:bg-sky-950/30"
                          : "border-transparent bg-white/60 hover:border-zinc-200 dark:bg-zinc-950/40 dark:hover:border-zinc-700",
                      )}
                    >
                      <div className="flex gap-3">
                        <span className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden>
                          {active ? (
                            <span className="flex size-5 items-center justify-center rounded-full border-2 border-sky-500 bg-sky-500">
                              <span className="size-2 rounded-full bg-white" />
                            </span>
                          ) : (
                            <Circle className="size-5 text-zinc-300 dark:text-zinc-600" />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                            {s.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <form action={formAction} className="flex flex-1 flex-col">
          {e && <input type="hidden" name="id" value={e.id} />}
          <input type="hidden" name="galleryUrlsJson" value={JSON.stringify(extras.filter((u) => u.trim()))} />

          <div className="flex flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8">
            {previewHref ? (
              <div className="mb-6 flex justify-end">
                <Button type="button" variant="secondary" size="sm" className="rounded-lg" asChild>
                  <Link href={previewHref} target="_blank" rel="noopener noreferrer">
                    <Eye className="size-4" aria-hidden />
                    Preview
                  </Link>
                </Button>
              </div>
            ) : null}

            {state?.error && (
              <div
                ref={errorRef}
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {state.error}
                {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
                  <ul className="mt-2 list-inside space-y-1 text-xs font-normal">
                    {Object.entries(state.fieldErrors).map(([field, msgs]) => (
                      <li key={field}>
                        <span className="font-medium">{field}</span>: {(msgs as string[])[0]}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mx-auto w-full max-w-3xl space-y-8 pb-8">
              <div className={cn(step !== 0 && "hidden")} aria-hidden={step !== 0}>
                <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="relative aspect-[21/9] min-h-[140px] overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800">
                    <img
                      src={coverSrc}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                      onError={() => setCoverSrc(EVENT_COVER_PLACEHOLDER)}
                    />
                    {!isProbablyImageUrl(imageUrl) ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/50 p-6 text-center text-sm text-zinc-200">
                        <span className="rounded-full border border-dashed border-zinc-500 px-4 py-2">
                          Add a photo or image URL below
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="sr-only">
                        Event title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        required
                        value={title}
                        onChange={(ev) => setTitle(ev.target.value)}
                        placeholder="Event title"
                        className="h-auto border-0 bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0 dark:bg-transparent md:text-3xl"
                      />
                      {state?.fieldErrors?.title?.[0] && (
                        <p className="text-xs text-red-600">{state.fieldErrors.title[0]}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="text-xs font-medium text-zinc-500">
                        Add a photo or image URL
                      </Label>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Paste a link, or upload a file.
                      </p>
                      <Input
                        id="imageUrl"
                        name="imageUrl"
                        type="text"
                        inputMode="url"
                        required
                        value={imageUrl}
                        onChange={(ev) => setImageUrl(ev.target.value)}
                        placeholder="https://… or upload a photo"
                        className="h-11 rounded-xl"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={coverFileRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          aria-hidden
                          tabIndex={-1}
                          onChange={(ev) => onCoverFile(ev.target.files?.[0] ?? null)}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => coverFileRef.current?.click()}
                        >
                          <Upload className="mr-2 size-4" aria-hidden />
                          Upload photo
                        </Button>
                        {imageUrl.trim().startsWith("data:image/") ? (
                          <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={clearCoverUpload}>
                            Remove upload
                          </Button>
                        ) : null}
                      </div>
                      {state?.fieldErrors?.imageUrl?.[0] && (
                        <p className="text-xs text-red-600">{state.fieldErrors.imageUrl[0]}</p>
                      )}
                    </div>
                    <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <p className="text-xs font-medium text-zinc-500">Additional hero images (carousel)</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Paste a link or upload a file for each slide (same as the cover field).
                      </p>
                      {extras.map((url, i) => (
                        <div key={i} className="flex flex-col gap-2 border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0 dark:border-zinc-800 sm:flex-row sm:items-start">
                          <div className="min-w-0 flex-1 space-y-2">
                            <Input
                              type="text"
                              inputMode="url"
                              value={url}
                              onChange={(ev) => setExtraAt(i, ev.target.value)}
                              placeholder="https://… or upload a photo"
                              className="h-11 rounded-xl"
                              aria-label={`Slide image ${i + 1}`}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                aria-hidden
                                tabIndex={-1}
                                id={`slide-file-${i}`}
                                onChange={(ev) => {
                                  onSlideFile(i, ev.target.files?.[0] ?? null);
                                  ev.currentTarget.value = "";
                                }}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => document.getElementById(`slide-file-${i}`)?.click()}
                              >
                                <Upload className="mr-2 size-4" aria-hidden />
                                Upload photo
                              </Button>
                              {url.trim().startsWith("data:image/") ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => setExtraAt(i, "")}
                                >
                                  Remove upload
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="shrink-0 rounded-xl sm:mt-0"
                            onClick={() => removeExtra(i)}
                            aria-label="Remove slide"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="secondary" size="sm" className="rounded-lg" onClick={addExtra}>
                        <Plus className="size-4" />
                        Add slide
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Hero text</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Shown over the banner on the public page. Leave blank to use defaults.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="presenterLine">Presenter line</Label>
                    <Input
                      id="presenterLine"
                      name="presenterLine"
                      value={presenterLine}
                      onChange={(ev) => setPresenterLine(ev.target.value)}
                      placeholder="e.g. MAD ENTERTAINMENTS PRESENTS"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      name="tagline"
                      value={tagline}
                      onChange={(ev) => setTagline(ev.target.value)}
                      placeholder="Script-style line under the title"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitle">Hero subtitle</Label>
                    <Input
                      id="heroSubtitle"
                      name="heroSubtitle"
                      value={heroSubtitle}
                      onChange={(ev) => setHeroSubtitle(ev.target.value)}
                      placeholder="Bold line at bottom of banner"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organizerLogoUrl">Organizer logo (optional)</Label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Paste a link, or upload a file.
                    </p>
                    <Input
                      id="organizerLogoUrl"
                      name="organizerLogoUrl"
                      type="text"
                      inputMode="url"
                      value={organizerLogoUrl}
                      onChange={(ev) => setOrganizerLogoUrl(ev.target.value)}
                      placeholder="https://… or upload a photo"
                      className="h-11 rounded-xl"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={organizerLogoFileRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        aria-hidden
                        tabIndex={-1}
                        onChange={(ev) => onOrganizerLogoFile(ev.target.files?.[0] ?? null)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => organizerLogoFileRef.current?.click()}
                      >
                        <Upload className="mr-2 size-4" aria-hidden />
                        Upload photo
                      </Button>
                      {organizerLogoUrl.trim().startsWith("data:image/") ? (
                        <Button type="button" variant="ghost" size="sm" className="rounded-xl" onClick={clearOrganizerLogoUpload}>
                          Remove upload
                        </Button>
                      ) : null}
                    </div>
                    {state?.fieldErrors?.organizerLogoUrl?.[0] && (
                      <p className="text-xs text-red-600">{state.fieldErrors.organizerLogoUrl[0]}</p>
                    )}
                  </div>
                </section>

                <section className="mt-8 grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-2 md:divide-x md:divide-zinc-100 dark:md:divide-zinc-800">
                  <div className="space-y-4 md:pr-6">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                      <Calendar className="size-5 text-zinc-400" aria-hidden />
                      <h2 className="text-lg font-semibold">Date and time</h2>
                    </div>
                    <EventDatetimeFields
                      compact
                      startsAt={startsAt}
                      onStartsAtChange={setStartsAt}
                      startName="startsAt"
                      endsAt={endsAt}
                      onEndsAtChange={setEndsAt}
                      endName="endsAt"
                      showEnds
                    />
                    {state?.fieldErrors?.startsAt?.[0] && (
                      <p className="text-xs text-red-600">{state.fieldErrors.startsAt[0]}</p>
                    )}
                  </div>
                  <div className="space-y-4 md:pl-6">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                      <MapPin className="size-5 text-zinc-400" aria-hidden />
                      <h2 className="text-lg font-semibold">Location</h2>
                    </div>
                    <LocationAutocompleteField
                      label="Search venue or city"
                      defaultDisplay={locationDisplay}
                      onResolved={(next) => {
                        setVenueName(next.venueName);
                        setCity(next.city);
                        setRegion(next.region);
                      }}
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Pick a suggestion or type a city and tab away to confirm. You can fine-tune fields below.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="venueName">Venue name (optional)</Label>
                      <Input
                        id="venueName"
                        name="venueName"
                        value={venueName}
                        onChange={(ev) => setVenueName(ev.target.value)}
                        placeholder="The Factory"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        required
                        value={city}
                        onChange={(ev) => setCity(ev.target.value)}
                        placeholder="Jersey City"
                        className="h-11 rounded-xl"
                      />
                      {state?.fieldErrors?.city?.[0] && (
                        <p className="text-xs text-red-600">{state.fieldErrors.city[0]}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">State or region (optional)</Label>
                      <Input
                        id="region"
                        name="region"
                        value={region}
                        onChange={(ev) => setRegion(ev.target.value)}
                        placeholder="NJ"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        name="category"
                        required
                        value={category}
                        onChange={(ev) => setCategory(ev.target.value)}
                        placeholder="Music, Wellness, ..."
                        className="h-11 rounded-xl"
                      />
                      {state?.fieldErrors?.category?.[0] && (
                        <p className="text-xs text-red-600">{state.fieldErrors.category[0]}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Overview</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Full description appears behind &quot;View all event details&quot; on the public page.
                  </p>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="description" className="sr-only">
                      Description
                    </Label>
                    <textarea
                      id="description"
                      name="description"
                      required
                      rows={6}
                      value={description}
                      onChange={(ev) => setDescription(ev.target.value)}
                      placeholder="Describe your event..."
                      className="flex w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    />
                    {state?.fieldErrors?.description?.[0] && (
                      <p className="text-xs text-red-600">{state.fieldErrors.description[0]}</p>
                    )}
                  </div>
                </section>
              </div>

              <div className={cn(step !== 1 && "hidden")} aria-hidden={step !== 1}>
                <section className="rounded-2xl border-2 border-sky-200/80 bg-white p-6 shadow-sm dark:border-sky-900/50 dark:bg-zinc-950">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Tickets</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Set the ticket price, currency, capacity, and when sales end.
                  </p>
                  <div className="mt-6 space-y-4">
                    {/* Ticket pricing */}
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Ticket pricing</span>
                      <div className="mt-3 grid max-w-xl gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="ticketPrice">Price</Label>
                          <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-500">
                              {ticketCurrency === "USD" ? "$" : ticketCurrency === "EUR" ? "\u20AC" : ticketCurrency === "GBP" ? "\u00A3" : ticketCurrency === "INR" ? "\u20B9" : "$"}
                            </span>
                            <Input
                              id="ticketPrice"
                              name="ticketPrice"
                              type="number"
                              min={0}
                              step="0.01"
                              inputMode="decimal"
                              value={ticketPrice}
                              onChange={(ev) => setTicketPrice(ev.target.value)}
                              placeholder="0.00"
                              className="h-11 rounded-xl pl-8"
                            />
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Set to 0 for free events
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ticketCurrency">Currency</Label>
                          <select
                            id="ticketCurrency"
                            name="ticketCurrency"
                            value={ticketCurrency}
                            onChange={(ev) => setTicketCurrency(ev.target.value)}
                            className="flex h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (&euro;)</option>
                            <option value="GBP">GBP (&pound;)</option>
                            <option value="INR">INR (&#8377;)</option>
                            <option value="CAD">CAD ($)</option>
                            <option value="AUD">AUD ($)</option>
                          </select>
                        </div>
                      </div>
                      {Number(ticketPrice) === 0 && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          <span className="inline-block size-2 rounded-full bg-emerald-500" />
                          This is a free event -- attendees RSVP without payment.
                        </div>
                      )}
                      {Number(ticketPrice) > 0 && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                          <span className="inline-block size-2 rounded-full bg-amber-500" />
                          Payment processing (Stripe) will be connected later. Tickets can still be reserved.
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Sales end (optional)</span>
                      <input type="hidden" name="salesEndsAt" value={salesEndsAt} readOnly />
                      <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="sales-end-date">Date</Label>
                          <input
                            id="sales-end-date"
                            type="date"
                            value={splitDatetimeLocal(salesEndsAt).date}
                            onChange={(ev) =>
                              setSalesEndsAt(joinDatetimeLocal(ev.target.value, splitDatetimeLocal(salesEndsAt).time))
                            }
                            className={eventDateTimeInputClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sales-end-time">Time</Label>
                          <input
                            id="sales-end-time"
                            type="time"
                            value={splitDatetimeLocal(salesEndsAt).time}
                            onChange={(ev) =>
                              setSalesEndsAt(
                                joinDatetimeLocal(splitDatetimeLocal(salesEndsAt).date, ev.target.value),
                              )
                            }
                            step={300}
                            className={eventDateTimeInputClass}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        After this time, the public page stops offering tickets (unless sold out first).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity (optional)</Label>
                      <Input
                        id="capacity"
                        name="capacity"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={capacity}
                        onChange={(ev) => setCapacity(ev.target.value)}
                        placeholder="Unlimited"
                        className="h-11 max-w-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ticketNote">Note for attendees (optional)</Label>
                      <textarea
                        id="ticketNote"
                        name="ticketNote"
                        rows={3}
                        value={ticketNote}
                        onChange={(ev) => setTicketNote(ev.target.value)}
                        placeholder="e.g. General admission — free RSVP"
                        className="flex w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className={cn(step !== 2 && "hidden")} aria-hidden={step !== 2}>
                <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Visibility</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Draft events stay off the public browse page until you publish. Use the bar below: Save event keeps a
                    draft you can return to later; Publish event lists it on the site and opens RSVPs.
                  </p>
                </section>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 mt-auto border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:px-8">
            {state?.error && (
              <p className="mx-auto mb-3 max-w-3xl rounded-lg bg-red-100 px-3 py-2 text-center text-sm font-medium text-red-800 dark:bg-red-950/60 dark:text-red-200" role="alert">
                {state.error}
              </p>
            )}
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" className="rounded-lg" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
                {step > 0 ? (
                  <Button type="button" variant="secondary" className="rounded-lg" onClick={() => setStep((s) => s - 1)}>
                    Back
                  </Button>
                ) : null}
                {props.mode === "edit" && e ? (
                  <>
                    {step > 0 ? (
                      <Button type="button" variant="secondary" className="rounded-lg" onClick={() => setStep(0)}>
                        <Pencil className="size-4" aria-hidden />
                        Edit details
                      </Button>
                    ) : null}
                    <DeleteEventButton eventId={e.id} />
                  </>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {step < 2 ? (
                  <Button type="button" variant="secondary" className="rounded-lg" onClick={() => setStep((s) => Math.min(2, s + 1))}>
                    Next step
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  name="saveType"
                  value="draft"
                  variant="secondary"
                  disabled={pending}
                  className="rounded-lg"
                  onClick={() => {
                    setSubmitIntent("draft");
                    setPublished(false);
                  }}
                >
                  {pending && submitIntent === "draft" ? "Saving…" : "Save draft"}
                </Button>
                <Button
                  type="submit"
                  name="saveType"
                  value="publish"
                  disabled={pending}
                  className="rounded-lg bg-orange-500 font-semibold text-white shadow-md hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
                  onClick={() => {
                    setSubmitIntent("publish");
                    setPublished(true);
                  }}
                >
                  {publishButtonLabel}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
