"use client";

import { useId, useMemo } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { joinDatetimeLocal, splitDatetimeLocal } from "@/lib/datetime-local";
import { cn } from "@/lib/utils";

export const eventDateTimeInputClass =
  "flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm transition-[border-color,box-shadow] focus-visible:border-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:border-orange-400/40 dark:focus-visible:ring-orange-400/15";

const innerInputClass =
  "h-9 w-full rounded-lg border border-transparent bg-transparent px-2 text-sm text-zinc-900 transition-colors focus-visible:border-orange-500/40 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 dark:text-zinc-50 dark:focus-visible:bg-zinc-950 dark:focus-visible:border-orange-400/40";

type Props = {
  className?: string;
  startsAt: string;
  onStartsAtChange: (v: string) => void;
  startName?: string;
  endsAt?: string;
  onEndsAtChange?: (v: string) => void;
  endName?: string;
  showEnds?: boolean;
  compact?: boolean;
  /** When false, omit hidden inputs (client-only forms). Default true. */
  writeHiddenFormFields?: boolean;
};

function humanRange(startsAt: string, endsAt: string): string {
  if (!startsAt) return "Pick a start date and time";
  const s = new Date(startsAt);
  if (Number.isNaN(s.getTime())) return "Pick a start date and time";
  const dayFmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const startLine = `${dayFmt.format(s)} · ${timeFmt.format(s)}`;
  if (!endsAt) return startLine;
  const e = new Date(endsAt);
  if (Number.isNaN(e.getTime())) return startLine;
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();
  return sameDay
    ? `${dayFmt.format(s)} · ${timeFmt.format(s)} – ${timeFmt.format(e)}`
    : `${startLine} → ${dayFmt.format(e)} · ${timeFmt.format(e)}`;
}

function FieldGroup({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  required,
}: {
  label: string;
  date: string;
  time: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  required?: boolean;
}) {
  const rid = useId();
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </Label>
      <div className="flex items-stretch gap-2 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm transition-shadow focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/15 dark:border-zinc-700 dark:bg-zinc-950">
        <div className="flex flex-1 items-center gap-2 border-r border-zinc-200 px-2 dark:border-zinc-800">
          <CalendarDays className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
          <input
            id={`${rid}-d`}
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            required={required}
            className={innerInputClass}
            aria-label={`${label} date`}
          />
        </div>
        <div className="flex w-32 items-center gap-2 px-2 sm:w-36">
          <Clock className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
          <input
            id={`${rid}-t`}
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            required={required}
            step={300}
            className={innerInputClass}
            aria-label={`${label} time`}
          />
        </div>
      </div>
    </div>
  );
}

export function EventDatetimeFields({
  className,
  startsAt,
  onStartsAtChange,
  startName,
  endsAt = "",
  onEndsAtChange,
  endName = "endsAt",
  showEnds = true,
  compact = false,
  writeHiddenFormFields = true,
}: Props) {
  const sd = splitDatetimeLocal(startsAt);
  const ed = splitDatetimeLocal(endsAt);

  const setStart = (date: string, time: string) => onStartsAtChange(joinDatetimeLocal(date, time));
  const setEnd = (date: string, time: string) => onEndsAtChange?.(joinDatetimeLocal(date, time));

  const summary = useMemo(() => humanRange(startsAt, endsAt), [startsAt, endsAt]);

  return (
    <div className={cn("space-y-4", className)}>
      {writeHiddenFormFields && startName ? <input type="hidden" name={startName} value={startsAt} readOnly /> : null}
      {writeHiddenFormFields && showEnds && onEndsAtChange ? (
        <input type="hidden" name={endName} value={endsAt} readOnly />
      ) : null}

      <div className={cn("grid gap-3", compact ? "" : "sm:grid-cols-2")}>
        <FieldGroup
          label="Starts"
          date={sd.date}
          time={sd.time}
          onDateChange={(d) => setStart(d, sd.time || "10:00")}
          onTimeChange={(t) => setStart(sd.date, t)}
          required
        />
        {showEnds && onEndsAtChange ? (
          <FieldGroup
            label="Ends (optional)"
            date={ed.date}
            time={ed.time}
            onDateChange={(d) => setEnd(d, ed.time || "12:00")}
            onTimeChange={(t) => setEnd(ed.date || sd.date, t)}
          />
        ) : null}
      </div>

      <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-400">
        {summary}
      </p>
    </div>
  );
}
