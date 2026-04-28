import type { DomainEvent, TicketType } from "@/types/domain";

export function defaultGaTicketTypesForEvent(ev: DomainEvent): TicketType[] {
  return [
    {
      id: `tt-${ev.id}-ga`,
      eventId: ev.id,
      name: "General admission",
      description: "Standard entry",
      price: 25,
      currency: "USD",
      inventoryTotal: 200,
      inventoryRemaining: 200,
      minPerOrder: 1,
      maxPerOrder: 6,
      saleStart: null,
      saleEnd: null,
      perks: ["Entry"],
      status: "on_sale",
    },
  ];
}
