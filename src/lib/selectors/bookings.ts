import type { Booking } from "@/types/domain";

export function partitionByEventStart(
  bookings: Booking[],
  eventStartById: Map<string, Date>,
  now = new Date(),
): { upcoming: Booking[]; past: Booking[] } {
  const upcoming: Booking[] = [];
  const past: Booking[] = [];
  for (const b of bookings) {
    if (b.status === "cancelled" || b.status === "failed") {
      past.push(b);
      continue;
    }
    const start = eventStartById.get(b.eventId);
    if (!start) {
      upcoming.push(b);
      continue;
    }
    if (start.getTime() >= now.getTime()) upcoming.push(b);
    else past.push(b);
  }
  return { upcoming, past };
}
