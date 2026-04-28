import { BOOKING_REFERENCE_PREFIX } from "./constants";

export function generateBookingReference(): string {
  const part = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `${BOOKING_REFERENCE_PREFIX}-${part}`;
}
