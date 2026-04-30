"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import { EventDatetimeFields } from "@/components/event-datetime-fields";
import { LocationAutocompleteField } from "@/components/location-autocomplete-field";
import { WizardStepBar } from "@/components/organizer/wizard/wizard-step-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVENT_COVER_PLACEHOLDER, isProbablyImageUrl } from "@/lib/cover-image";
import { toDatetimeLocalValue } from "@/lib/datetime-local";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";
import type { FAQItem } from "@/types/domain";

function toIso(v: string): string | null {
  if (!v.trim()) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function localValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return toDatetimeLocalValue(d);
}

export default function OrganizerWizardBuildPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const event = useOrganizerMockStore((s) => s.getEventById(id));
  const patchEvent = useOrganizerMockStore((s) => s.patchEvent);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const overviewRef = useRef<HTMLTextAreaElement | null>(null);

  const base = event ?? {
    id,
    title: "Untitled Event",
    coverImage: EVENT_COVER_PLACEHOLDER,
    galleryImages: [] as string[],
    startDateTime: new Date().toISOString(),
    endDateTime: null as string | null,
    description: "",
    presenterLine: null as string | null,
    ageRestriction: null as string | null,
    dressCode: null as string | null,
    ticketNote: null as string | null,
    faqItems: [] as FAQItem[],
    agenda: [] as { id: string; label: string; startTime: string; endTime: string | null; description: string; speaker: string | null }[],
  };

  const [title, setTitle] = useState(base.title);
  const [coverImage, setCoverImage] = useState(base.coverImage);
  const [galleryImages, setGalleryImages] = useState<string[]>(base.galleryImages ?? []);
  const [startsAt, setStartsAt] = useState(localValue(base.startDateTime));
  const [endsAt, setEndsAt] = useState(localValue(base.endDateTime));
  const [description, setDescription] = useState(base.description ?? "");
  const [presenterLine, setPresenterLine] = useState(base.presenterLine ?? "");
  const [ageRestriction, setAgeRestriction] = useState(base.ageRestriction ?? "");
  const [doorTime, setDoorTime] = useState("");
  const [parkingInfo, setParkingInfo] = useState(base.dressCode ?? "");
  const [showMap, setShowMap] = useState(true);
  const [showAgeInput, setShowAgeInput] = useState(Boolean(base.ageRestriction));
  const [showDoorInput, setShowDoorInput] = useState(false);
  const [showParkingInput, setShowParkingInput] = useState(Boolean(base.dressCode));
  const [faqItems, setFaqItems] = useState<FAQItem[]>(base.faqItems ?? []);
  const [faqQ, setFaqQ] = useState("");
  const [faqA, setFaqA] = useState("");
  const [agendaLabel, setAgendaLabel] = useState(base.agenda[0]?.label ?? "");
  const [agendaDesc, setAgendaDesc] = useState(base.agenda[0]?.description ?? "");
  const [locationDisplay, setLocationDisplay] = useState("");

  const previewMedia = useMemo(() => (isProbablyImageUrl(coverImage) ? coverImage : EVENT_COVER_PLACEHOLDER), [coverImage]);

  if (!event) {
    return <main className="p-8 text-zinc-500 dark:text-zinc-400">Event not found.</main>;
  }

  const addFaq = () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    setFaqItems((prev) => [...prev, { id: crypto.randomUUID(), question: faqQ.trim(), answer: faqA.trim() }]);
    setFaqQ("");
    setFaqA("");
  };

  const onFileChange = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (!src) return;
      if (!coverImage.trim()) setCoverImage(src);
      else setGalleryImages((prev) => [...prev, src].slice(0, 5));
    };
    reader.readAsDataURL(file);
  };

  const saveAndContinue = () => {
    const doorLine = doorTime.trim() ? `Door time: ${doorTime.trim()}` : "";
    const mergedTicketNote = [event.ticketNote ?? "", doorLine].filter(Boolean).join("\n");

    patchEvent(id, {
      title: title.trim() || "Untitled Event",
      coverImage: coverImage.trim() || EVENT_COVER_PLACEHOLDER,
      galleryImages: galleryImages.slice(0, 5),
      startDateTime: toIso(startsAt) ?? event.startDateTime,
      endDateTime: toIso(endsAt),
      description: description.trim() || event.description,
      presenterLine: presenterLine.trim() || null,
      ageRestriction: ageRestriction.trim() || null,
      dressCode: parkingInfo.trim() || null,
      ticketNote: mergedTicketNote || null,
      faqItems,
      agenda: agendaLabel.trim()
        ? [
            {
              id: event.agenda[0]?.id ?? crypto.randomUUID(),
              label: agendaLabel.trim(),
              startTime: toIso(startsAt) ?? event.startDateTime,
              endTime: toIso(endsAt),
              description: agendaDesc.trim() || "",
              speaker: null,
            },
          ]
        : event.agenda,
    });

    router.push(`/organizer-demo/${id}/tickets`);
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-8 py-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
          <Image src={previewMedia} alt="" width={1200} height={500} className="h-72 w-full object-cover" unoptimized />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Button type="button" variant="secondary" className="rounded-md" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload photos and video
            </Button>
          </div>
        </div>
        <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
        <div className="mt-4 space-y-2">
          <Label htmlFor="coverImage">Cover image URL</Label>
          <Input id="coverImage" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Event Title</h2>
          <button type="button" onClick={() => titleRef.current?.focus()} className="text-blue-600 dark:text-blue-400">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <Input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short and sweet sentence about your event." />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Date and time</p>
            <EventDatetimeFields writeHiddenFormFields={false} startsAt={startsAt} onStartsAtChange={setStartsAt} endsAt={endsAt} onEndsAtChange={setEndsAt} showEnds compact />
          </div>
          <div>
            <p className="mb-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Location</p>
            <LocationAutocompleteField
              label="Enter a location"
              defaultDisplay={locationDisplay}
              onResolved={(next) => setLocationDisplay([next.venueName, next.city, next.region].filter(Boolean).join(", "))}
            />
            <button type="button" className="mt-3 text-xs font-medium text-blue-700 dark:text-blue-300" onClick={() => setShowMap((v) => !v)}>
              {showMap ? "Hide map" : "Show map"}
            </button>
          </div>
        </div>
        {showMap ? <div className="mt-4 h-52 rounded-lg border border-zinc-200 bg-[radial-gradient(circle_at_20%_30%,#d8f5e6,transparent_35%),radial-gradient(circle_at_70%_40%,#d7f0ff,transparent_40%),#eef2f7] dark:border-zinc-700" /> : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Overview</h2>
          <button type="button" onClick={() => overviewRef.current?.focus()} className="text-blue-600 dark:text-blue-400">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <textarea ref={overviewRef} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50" placeholder="Use this section to provide more details about your event." />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Good to know</h2>
          <button type="button" className="text-blue-600 dark:text-blue-400"><Plus className="h-5 w-5" /></button>
        </div>

        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Highlights</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => setShowAgeInput((v) => !v)}>Add Age info</Button>
          <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => setShowDoorInput((v) => !v)}>Add Door Time</Button>
          <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => setShowParkingInput((v) => !v)}>Add Parking info</Button>
        </div>

        {showAgeInput || showDoorInput || showParkingInput ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {showAgeInput ? <Input value={ageRestriction} onChange={(e) => setAgeRestriction(e.target.value)} placeholder="21+ only" /> : null}
            {showDoorInput ? <Input value={doorTime} onChange={(e) => setDoorTime(e.target.value)} placeholder="Doors open at 6:30 PM" /> : null}
            {showParkingInput ? <Input value={parkingInfo} onChange={(e) => setParkingInfo(e.target.value)} placeholder="Parking available nearby" /> : null}
          </div>
        ) : null}

        <div className="mt-6">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Frequently asked questions</p>
          {faqItems.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {faqItems.map((f) => (
                <li key={f.id} className="rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{f.question}</p>
                  <p className="text-zinc-600 dark:text-zinc-400">{f.answer}</p>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <Input value={faqQ} onChange={(e) => setFaqQ(e.target.value)} placeholder="Question" />
            <Input value={faqA} onChange={(e) => setFaqA(e.target.value)} placeholder="Answer" />
          </div>
          <Button type="button" variant="secondary" className="mt-2 rounded-md" onClick={addFaq}>Add question</Button>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-950">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Add more sections to your event page</h2>
        <div className="mt-4 grid gap-3">
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">Lineup</p>
            <Input className="mt-2" value={presenterLine} onChange={(e) => setPresenterLine(e.target.value)} placeholder="Host or lineup" />
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">Agenda</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <Input value={agendaLabel} onChange={(e) => setAgendaLabel(e.target.value)} placeholder="Agenda title" />
              <Input value={agendaDesc} onChange={(e) => setAgendaDesc(e.target.value)} placeholder="Agenda description" />
            </div>
          </div>
        </div>
      </section>

      <WizardStepBar primaryLabel="Save and continue" onPrimary={saveAndContinue} />
    </main>
  );
}
