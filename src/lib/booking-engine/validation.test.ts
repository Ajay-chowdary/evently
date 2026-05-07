import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canCancelBookingForEvent,
  isTicketPurchasable,
  validateQuantity,
} from "./validation";
import type { TicketType } from "@/types/domain";

function makeTicket(overrides: Partial<TicketType> = {}): TicketType {
  return {
    id: "tt_1",
    eventId: "ev_1",
    name: "General",
    description: "",
    price: 25,
    currency: "USD",
    inventoryTotal: 100,
    inventoryRemaining: 100,
    minPerOrder: 1,
    maxPerOrder: 10,
    saleStart: null,
    saleEnd: null,
    perks: [],
    status: "on_sale",
    ...overrides,
  };
}

describe("isTicketPurchasable", () => {
  it("returns null when on sale with inventory", () => {
    expect(isTicketPurchasable(makeTicket(), 5)).toBeNull();
  });

  it("flags hidden tickets", () => {
    expect(isTicketPurchasable(makeTicket({ status: "hidden" }), 10)).toBe("HIDDEN");
  });

  it("flags paused as NOT_ON_SALE", () => {
    expect(isTicketPurchasable(makeTicket({ status: "paused" }), 10)).toBe("NOT_ON_SALE");
  });

  it("flags zero inventory as SOLD_OUT", () => {
    expect(isTicketPurchasable(makeTicket(), 0)).toBe("SOLD_OUT");
  });

  it("flags status sold_out even with reported remaining", () => {
    expect(isTicketPurchasable(makeTicket({ status: "sold_out" }), 5)).toBe("SOLD_OUT");
  });

  describe("with mocked clock", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("blocks purchase before saleStart", () => {
      const tt = makeTicket({ saleStart: "2026-06-15T00:00:00Z" });
      expect(isTicketPurchasable(tt, 5)).toBe("SALE_NOT_STARTED");
    });

    it("blocks purchase after saleEnd", () => {
      const tt = makeTicket({ saleEnd: "2026-05-20T00:00:00Z" });
      expect(isTicketPurchasable(tt, 5)).toBe("SALE_ENDED");
    });

    it("allows purchase when within saleStart..saleEnd window", () => {
      const tt = makeTicket({
        saleStart: "2026-05-01T00:00:00Z",
        saleEnd: "2026-07-01T00:00:00Z",
      });
      expect(isTicketPurchasable(tt, 5)).toBeNull();
    });
  });
});

describe("validateQuantity", () => {
  it("rejects below minPerOrder", () => {
    expect(validateQuantity(makeTicket({ minPerOrder: 2 }), 1, 10)).toBe("QTY_TOO_LOW");
  });

  it("rejects above maxPerOrder", () => {
    expect(validateQuantity(makeTicket({ maxPerOrder: 5 }), 6, 100)).toBe("QTY_TOO_HIGH");
  });

  it("rejects when over inventory", () => {
    expect(validateQuantity(makeTicket(), 5, 3)).toBe("INSUFFICIENT_INVENTORY");
  });

  it("returns null on valid qty", () => {
    expect(validateQuantity(makeTicket(), 2, 10)).toBeNull();
  });
});

describe("canCancelBookingForEvent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("permits cancellation > cutoff before event", () => {
    const eventStart = new Date("2026-06-05T00:00:00Z"); // 4 days out
    expect(canCancelBookingForEvent(eventStart, 24)).toBe(true);
  });

  it("blocks cancellation inside the cutoff window", () => {
    const eventStart = new Date("2026-06-01T12:00:00Z"); // 12h out
    expect(canCancelBookingForEvent(eventStart, 24)).toBe(false);
  });

  it("blocks cancellation for past events", () => {
    const eventStart = new Date("2026-05-01T00:00:00Z");
    expect(canCancelBookingForEvent(eventStart, 24)).toBe(false);
  });
});
