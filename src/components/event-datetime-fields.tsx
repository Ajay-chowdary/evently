"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { joinDatetimeLocal, splitDatetimeLocal } from "@/lib/datetime-local";
import { cn } from "@/lib/utils";

export const eventDateTimeInputClass =
  "flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm transition-[border-color,box-shadow] focus-visible:border-orange-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:border-orange-400/40 dark:focus-visible:ring-orange-400/15";

const fieldClass = eventDateTimeInputClass;

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
  const rid = useId();
  const sd = splitDatetimeLocal(startsAt);
  const ed = splitDatetimeLocal(endsAt);

  const setStart = (date: string, time: string) => onStartsAtChange(joinDatetimeLocal(date, time));
  const setEnd = (date: string, time: string) => onEndsAtChange?.(joinDatetimeLocal(date, time));

  return (
    <div className={cn("space-y-6", className)}>
      {writeHiddenFormFields && startName ? <input type="hidden" name={startName} value={startsAt} readOnly /> : null}
      {writeHiddenFormFields && showEnds && onEndsAtChange ? (
        <input type="hidden" name={endName} value={endsAt} readOnly />
      ) : null}

      <div className={cn("grid gap-4", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
        <div className="space-y-2">
          <Label htmlFor={`${rid}-sd`} className="text-zinc-700 dark:text-zinc-300">
            Start date
          </Label>
          <input
            id={`${rid}-sd`}
            type="date"
            value={sd.date}
            onChange={(e) => setStart(e.target.value, sd.time)}
            required
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${rid}-st`} className="text-zinc-700 dark:text-zinc-300">
            Start time
          </Label>
          <input
            id={`${rid}-st`}
            type="time"
            value={sd.time}
            onChange={(e) => setStart(sd.date, e.target.value)}
            required
            step={300}
            className={fieldClass}
          />
        </div>
        {showEnds && onEndsAtChange ? (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${rid}-ed`} className="text-zinc-700 dark:text-zinc-300">
                End date (optional)
              </Label>
              <input
                id={`${rid}-ed`}
                type="date"
                value={ed.date}
                onChange={(e) => setEnd(e.target.value, ed.time)}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${rid}-et`} className="text-zinc-700 dark:text-zinc-300">
                End time (optional)
              </Label>
              <input
                id={`${rid}-et`}
                type="time"
                value={ed.time}
                onChange={(e) => setEnd(ed.date, e.target.value)}
                step={300}
                className={fieldClass}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
