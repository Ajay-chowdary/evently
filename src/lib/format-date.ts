function formatParts(
  date: Date,
  options: Intl.DateTimeFormatOptions,
) {
  const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);
  const map = new Map<string, string>();
  for (const part of parts) {
    if (part.type !== "literal") {
      map.set(part.type, part.value);
    }
  }
  return map;
}

export function format(date: Date) {
  const parts = formatParts(date, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return `${parts.get("weekday")}, ${parts.get("month")} ${parts.get("day")}, ${parts.get("hour")}:${parts.get("minute")} ${parts.get("dayPeriod")}`;
}

export function formatLongDateTime(date: Date) {
  const parts = formatParts(date, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return `${parts.get("weekday")}, ${parts.get("month")} ${parts.get("day")} at ${parts.get("hour")}:${parts.get("minute")} ${parts.get("dayPeriod")}`;
}

export function formatEventDateRange(startsAt: Date, endsAt: Date | null) {
  const start = formatLongDateTime(startsAt);
  if (!endsAt) return start;
  return `${start} to ${formatLongDateTime(endsAt)}`;
}
