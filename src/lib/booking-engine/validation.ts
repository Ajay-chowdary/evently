import type { DomainEvent, TicketType } from "@/types/domain";

export type TicketSelectionError =
  | "SOLD_OUT"
  | "NOT_ON_SALE"
  | "HIDDEN"
  | "SALE_NOT_STARTED"
  | "SALE_ENDED"
  | "QTY_TOO_LOW"
  | "QTY_TOO_HIGH"
  | "INSUFFICIENT_INVENTORY";

const now = () => new Date();

export function isTicketPurchasable(
  tt: TicketType,
  inventoryRemaining: number,
): TicketSelectionError | null {
  if (tt.status === "hidden") return "HIDDEN";
  if (tt.status === "paused") return "NOT_ON_SALE";
  if (tt.status === "sold_out" || inventoryRemaining <= 0) return "SOLD_OUT";
  if (tt.saleStart) {
    const s = new Date(tt.saleStart);
    if (now() < s) return "SALE_NOT_STARTED";
  }
  if (tt.saleEnd) {
    const e = new Date(tt.saleEnd);
    if (now() > e) return "SALE_ENDED";
  }
  return null;
}

export function validateQuantity(
  tt: TicketType,
  qty: number,
  inventoryRemaining: number,
): TicketSelectionError | null {
  if (qty < tt.minPerOrder) return "QTY_TOO_LOW";
  if (qty > tt.maxPerOrder) return "QTY_TOO_HIGH";
  if (qty > inventoryRemaining) return "INSUFFICIENT_INVENTORY";
  return null;
}

export function canCancelBookingForEvent(eventStart: Date, cutoffHours = 24): boolean {
  const ms = cutoffHours * 60 * 60 * 1000;
  return Date.now() < eventStart.getTime() - ms;
}

export function isEventBookingOpen(ev: DomainEvent): boolean {
  if (ev.status === "cancelled" || ev.status === "draft") return false;
  if (ev.status !== "published" && ev.status !== "sold_out") return false;
  const end = ev.endDateTime ? new Date(ev.endDateTime) : new Date(ev.startDateTime);
  if (now() >= end) return false;
  return true;
}
