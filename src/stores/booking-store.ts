"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getMockEventBySlug, getTicketTypeById } from "@/lib/mock-db/catalog";
import { getOrganizerExtraTicketsFromStorage } from "@/stores/organizer-mock-store";
import {
  computeTotals,
  generateBookingReference,
  MOCK_USER_ID,
  validateQuantity,
  isTicketPurchasable,
  canCancelBookingForEvent,
} from "@/lib/booking-engine";
import type { Booking, BookingLineItem, IssuedTicket, TicketType } from "@/types/domain";

export type CartState = {
  eventId: string;
  eventSlug: string;
  ticketTypeId: string;
  quantity: number;
};

type BookingStore = {
  cart: CartState | null;
  bookings: Booking[];
  issuedTickets: IssuedTicket[];
  inventoryRemaining: Record<string, number>;
  setCart: (cart: CartState | null) => void;
  setQuantity: (qty: number) => void;
  effectiveRemaining: (tt: TicketType) => number;
  confirmCart: (
    attendeeName: string,
    attendeeEmail: string,
    organizerExtraEvents?: import("@/types/domain").DomainEvent[],
  ) => { ok: true; booking: Booking } | { ok: false; error: string };
  cancelBooking: (
    bookingId: string,
    organizerExtraEvents?: import("@/types/domain").DomainEvent[],
  ) => { ok: true } | { ok: false; error: string };
  getBooking: (id: string) => Booking | undefined;
  getTicketsForBooking: (bookingId: string) => IssuedTicket[];
  getTicketById: (ticketId: string) => IssuedTicket | undefined;
};

function effectiveInv(state: BookingStore, tt: TicketType): number {
  const v = state.inventoryRemaining[tt.id];
  return v !== undefined ? v : tt.inventoryRemaining;
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      cart: null,
      bookings: [],
      issuedTickets: [],
      inventoryRemaining: {},

      setCart: (cart) => set({ cart }),

      setQuantity: (qty) => {
        const c = get().cart;
        if (!c) return;
        set({ cart: { ...c, quantity: Math.max(1, qty) } });
      },

      effectiveRemaining: (tt) => effectiveInv(get(), tt),

      confirmCart: (attendeeName, attendeeEmail, organizerExtraEvents = []) => {
        const cart = get().cart;
        if (!cart) return { ok: false, error: "No tickets selected." };
        const trimmedName = attendeeName.trim();
        const trimmedEmail = attendeeEmail.trim();
        if (!trimmedName || !trimmedEmail) return { ok: false, error: "Name and email are required." };

        const extraTix = getOrganizerExtraTicketsFromStorage();
        const detail = getMockEventBySlug(cart.eventSlug, organizerExtraEvents, extraTix);
        if (!detail) return { ok: false, error: "Event not found." };

        const tt = detail.ticketTypes.find((t) => t.id === cart.ticketTypeId);
        if (!tt) return { ok: false, error: "Ticket type not found." };

        const inv = effectiveInv(get(), tt);
        const block = isTicketPurchasable(tt, inv);
        if (block) return { ok: false, error: `Tickets unavailable (${block}).` };

        const qErr = validateQuantity(tt, cart.quantity, inv);
        if (qErr) return { ok: false, error: `Invalid quantity (${qErr}).` };

        const lineTotal = tt.price * cart.quantity;
        const { subtotal, serviceFee, total, currency } = computeTotals(lineTotal, tt.currency);
        const bookingId = crypto.randomUUID();
        const referenceCode = generateBookingReference();

        const lineItem: BookingLineItem = {
          id: crypto.randomUUID(),
          bookingId,
          ticketTypeId: tt.id,
          ticketTypeName: tt.name,
          quantity: cart.quantity,
          unitPrice: tt.price,
          lineTotal: subtotal,
        };

        const booking: Booking = {
          id: bookingId,
          referenceCode,
          userId: MOCK_USER_ID,
          eventId: detail.id,
          eventSlug: detail.slug,
          eventTitle: detail.title,
          eventStartsAt: detail.startDateTime,
          status: "confirmed",
          currency,
          subtotal,
          serviceFee,
          total,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lineItems: [lineItem],
          ticketsIssuedCount: cart.quantity,
          attendeeName: trimmedName,
          attendeeEmail: trimmedEmail,
        };

        const tickets: IssuedTicket[] = [];
        for (let i = 0; i < cart.quantity; i++) {
          const tid = crypto.randomUUID();
          tickets.push({
            id: tid,
            bookingId,
            eventId: detail.id,
            ticketTypeId: tt.id,
            attendeeName: trimmedName,
            attendeeEmail: trimmedEmail,
            qrCodeValue: `${referenceCode}-${tid.slice(0, 8).toUpperCase()}`,
            status: "active",
            issuedAt: new Date().toISOString(),
          });
        }

        const newInv = inv - cart.quantity;
        set((s) => ({
          bookings: [...s.bookings, booking],
          issuedTickets: [...s.issuedTickets, ...tickets],
          inventoryRemaining: { ...s.inventoryRemaining, [tt.id]: newInv },
          cart: null,
        }));

        return { ok: true, booking };
      },

      cancelBooking: (bookingId, organizerExtraEvents = []) => {
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b) return { ok: false, error: "Booking not found." };
        if (b.status === "cancelled") return { ok: false, error: "Already cancelled." };

        const extraTix = getOrganizerExtraTicketsFromStorage();
        const detail = getMockEventBySlug(b.eventSlug, organizerExtraEvents, extraTix);
        const start = detail ? new Date(detail.startDateTime) : new Date(b.eventStartsAt);
        if (!canCancelBookingForEvent(start, 24)) {
          return { ok: false, error: "This booking can no longer be cancelled." };
        }

        const li = b.lineItems[0];
        if (li) {
          const tt = getTicketTypeById(li.ticketTypeId, extraTix);
          if (tt) {
            const cur = effectiveInv(get(), tt);
            set((s) => ({
              bookings: s.bookings.map((x) =>
                x.id === bookingId
                  ? { ...x, status: "cancelled" as const, updatedAt: new Date().toISOString() }
                  : x,
              ),
              issuedTickets: s.issuedTickets.map((t) =>
                t.bookingId === bookingId ? { ...t, status: "cancelled" as const } : t,
              ),
              inventoryRemaining: {
                ...s.inventoryRemaining,
                [li.ticketTypeId]: cur + li.quantity,
              },
            }));
            return { ok: true };
          }
        }

        set((s) => ({
          bookings: s.bookings.map((x) =>
            x.id === bookingId
              ? { ...x, status: "cancelled" as const, updatedAt: new Date().toISOString() }
              : x,
          ),
          issuedTickets: s.issuedTickets.map((t) =>
            t.bookingId === bookingId ? { ...t, status: "cancelled" as const } : t,
          ),
        }));
        return { ok: true };
      },

      getBooking: (id) => get().bookings.find((b) => b.id === id),
      getTicketsForBooking: (bookingId) => get().issuedTickets.filter((t) => t.bookingId === bookingId),
      getTicketById: (ticketId) => get().issuedTickets.find((t) => t.id === ticketId),
    }),
    {
      name: "evently-bookings-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        bookings: s.bookings,
        issuedTickets: s.issuedTickets,
        inventoryRemaining: s.inventoryRemaining,
      }),
    },
  ),
);
