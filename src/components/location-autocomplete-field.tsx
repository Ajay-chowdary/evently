"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LocationSuggestion } from "@/lib/location/types";
import { cn } from "@/lib/utils";

export type ResolvedLocation = {
  venueName: string;
  city: string;
  region: string;
  country?: string;
  addressLine1?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  label?: string;
};

type Props = {
  id?: string;
  label: string;
  defaultDisplay: string;
  onResolved: (next: ResolvedLocation) => void;
};

export function LocationAutocompleteField({ id, label, defaultDisplay, onResolved }: Props) {
  const genId = useId();
  const inputId = id ?? `loc-${genId}`;
  const listId = `${inputId}-list`;
  const [draft, setDraft] = useState(defaultDisplay);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedRef = useRef(defaultDisplay);

  useEffect(() => {
    setDraft(defaultDisplay);
    committedRef.current = defaultDisplay;
  }, [defaultDisplay]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runFetch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/location/suggest?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as { suggestions?: LocationSuggestion[] };
      setSuggestions(data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleFetch = useCallback(
    (query: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void runFetch(query);
      }, 220);
    },
    [runFetch],
  );

  const onSelect = useCallback(
    async (s: LocationSuggestion) => {
      setOpen(false);
      setSuggestions([]);
      if (s.placeId) {
        setLoading(true);
        try {
          const res = await fetch(`/api/location/suggest?placeId=${encodeURIComponent(s.placeId)}`);
          const data = (await res.json()) as { detail?: LocationSuggestion | null };
          const d = data.detail;
          if (d) {
            onResolved({
              venueName: d.venueName,
              city: d.city,
              region: d.region,
              country: d.country,
              addressLine1: d.addressLine1,
              postalCode: d.postalCode,
              latitude: d.latitude,
              longitude: d.longitude,
              label: d.label,
            });
            setDraft(d.label);
            committedRef.current = d.label;
            setLoading(false);
            return;
          }
        } catch {
          /* use row below */
        }
        setLoading(false);
      }
      onResolved({
        venueName: s.venueName,
        city: s.city,
        region: s.region,
        country: s.country,
        addressLine1: s.addressLine1,
        postalCode: s.postalCode,
        latitude: s.latitude,
        longitude: s.longitude,
        label: s.label,
      });
      setDraft(s.label);
      committedRef.current = s.label;
    },
    [onResolved],
  );

  return (
    <div ref={wrapRef} className="relative space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
        <Input
          id={inputId}
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            setDraft(v);
            setOpen(true);
            setActive(0);
            scheduleFetch(v);
          }}
          onFocus={() => {
            setOpen(true);
            if (draft.trim()) scheduleFetch(draft);
          }}
          onBlur={() => {
            setOpen(false);
            const t = draft.trim();
            if (!t) return;
            if (t === committedRef.current) return;
            const parts = t.split(",").map((x) => x.trim());
            const maybeCity = parts.length > 1 ? parts[parts.length - 2] ?? parts[parts.length - 1] : parts[0];
            const cityGuess = maybeCity ?? t;
            const venueGuess = parts.length > 2 ? parts.slice(0, -2).join(", ") : parts.length === 2 ? parts[0]! : "";
            onResolved({
              venueName: venueGuess,
              city: cityGuess || t,
              region: parts.length > 1 ? parts[parts.length - 1] ?? "" : "",
              addressLine1: t,
              label: t,
            });
            committedRef.current = t;
          }}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) {
              if (e.key === "Escape") setOpen(false);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const pick = suggestions[active];
              if (pick) void onSelect(pick);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-11 rounded-xl pl-9"
          placeholder="Search venue, neighborhood, or city..."
        />
        {loading ? (
          <Loader2
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-zinc-400"
            aria-hidden
          />
        ) : null}
      </div>
      {open && draft.trim() ? (
        suggestions.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 text-zinc-900 shadow-lg dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          >
            {suggestions.map((s, i) => (
              <li key={s.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={cn(
                    "flex w-full px-3 py-2.5 text-left text-sm",
                    i === active ? "bg-zinc-100 dark:bg-zinc-900" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60",
                  )}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => void onSelect(s)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        ) : !loading ? (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-500 shadow-lg dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
            No matches. Press Tab to use what you typed.
          </div>
        ) : null
      ) : null}
    </div>
  );
}
