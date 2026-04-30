"use client";

import Image from "next/image";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { WizardStepBar } from "@/components/organizer/wizard/wizard-step-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "@/lib/format-date";
import { useOrganizerMockStore } from "@/stores/organizer-mock-store";

const categories = ["Music", "Wellness", "Business", "Arts", "Sports", "Community"];
const eventTypes = ["In person", "Online", "Hybrid"];

export default function OrganizerWizardPublishPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const event = useOrganizerMockStore((s) => s.getEventById(id));
  const patchEvent = useOrganizerMockStore((s) => s.patchEvent);
  const setEventStatus = useOrganizerMockStore((s) => s.setEventStatus);
  const setEventVisibility = useOrganizerMockStore((s) => s.setEventVisibility);

  const [bannerOpen, setBannerOpen] = useState(true);
  const [eventType, setEventType] = useState("In person");
  const [category, setCategory] = useState(event?.category ?? "Music");
  const [organizerName, setOrganizerName] = useState(event?.presenterLine ?? "");
  const [keywords, setKeywords] = useState((event?.tags ?? []).join(", "));
  const [visibility, setVisibility] = useState<"public" | "private">(
    event?.visibility === "private" ? "private" : "public",
  );
  const [publishMode, setPublishMode] = useState<"now" | "later">("now");

  if (!event) {
    return <main className="p-8 text-zinc-500 dark:text-zinc-400">Event not found.</main>;
  }

  const dateLabel = format(new Date(event.startDateTime));

  const persistShared = () => {
    const tags = keywords
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 10);

    patchEvent(id, {
      category,
      categorySlug: category.toLowerCase().replace(/\s+/g, "-"),
      presenterLine: organizerName.trim() || null,
      tags,
      tagline: eventType,
    });
    setEventVisibility(id, visibility);
  };

  const saveDraft = () => {
    persistShared();
    setEventStatus(id, "draft");
    router.push("/organizer-demo/events");
  };

  const publishNow = () => {
    persistShared();
    if (publishMode === "now") {
      setEventStatus(id, "published");
      router.push(`/events/${event.slug}?published=1`);
      return;
    }
    setEventStatus(id, "draft");
    router.push("/organizer-demo/events");
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-8 py-6">
      <div>
        <h1 className="text-6xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Your event is almost ready to publish</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Review your settings and let everyone find your event.</p>
      </div>

      {bannerOpen ? (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/30">
          <p className="inline-flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
            <AlertCircle className="h-4 w-4" /> Verify your phone number
          </p>
          <button type="button" className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300" onClick={() => setBannerOpen(false)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <div className="h-44 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
            <Image src={event.coverImage} alt="" width={640} height={320} className="h-full w-full object-cover" unoptimized />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{event.title}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{dateLabel}</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Event type and category</h2>
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">
            {eventTypes.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">
            {categories.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-2">
          <Label>Organizer</Label>
          <Input value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} placeholder="Organizer" />
        </div>
        <div className="space-y-2">
          <Label>Search keywords</Label>
          <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="music, party, downtown" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">0/10 tags</p>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Is your event public or private?</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={visibility === "public"} onChange={() => setVisibility("public")} /> Public
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="radio" checked={visibility === "private"} onChange={() => setVisibility("private")} /> Private
          </label>
        </div>
        <div>
          <p className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">When should we publish your event?</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={publishMode === "now"} onChange={() => setPublishMode("now")} /> Publish now
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="radio" checked={publishMode === "later"} onChange={() => setPublishMode("later")} /> Schedule for later
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Check out these tips before you publish</h3>
        <div className="mt-3 grid gap-2 text-sm text-blue-700 dark:text-blue-300 md:grid-cols-2">
          <a href="#">Create promo codes for your event</a>
          <a href="#">Add this event to a collection to increase visibility</a>
          <a href="#">Develop a safety plan for your event</a>
          <a href="#">Customize your order form</a>
        </div>
      </section>

      <WizardStepBar
        primaryLabel="Publish now"
        onPrimary={publishNow}
        secondaryLabel="Save draft"
        onSecondary={saveDraft}
      />
    </main>
  );
}
