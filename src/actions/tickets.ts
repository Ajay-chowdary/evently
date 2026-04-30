"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function revalidatePathsForEvent(slug: string) {
  revalidatePath(`/events/${slug}`);
  revalidatePath("/events");
  revalidatePath("/bookings");
  revalidatePath("/account/tickets");
  revalidatePath("/");
}

function makeReference(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

export type ClaimTicketCode =
  | "OK"
  | "NOT_FOUND"
  | "AUTH"
  | "SALES_ENDED"
  | "EVENT_ENDED"
  | "SOLD_OUT"
  | "ALREADY"
  | "PAID_ONLY";

export type ClaimTicketResult = {
  error: string | null;
  claimed: boolean | null;
  code: ClaimTicketCode;
};

export async function claimTicket(
  eventId: string,
  quantity: number = 1,
  paymentMethod: string = "free",
  ticketTypeId?: string,
): Promise<ClaimTicketResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in to get a ticket.", claimed: null, code: "AUTH" };
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return { error: "Quantity must be between 1 and 10.", claimed: null, code: "NOT_FOUND" };
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, published: true },
    include: {
      ticketTypes: {
        where: { status: "ACTIVE" },
        orderBy: [{ price: "asc" }, { sortOrder: "asc" }],
      },
    },
  });

  if (!event) {
    return { error: "Event not found.", claimed: null, code: "NOT_FOUND" };
  }

  const now = new Date();
  const eventEnded = now >= (event.endsAt ?? event.startsAt);
  if (eventEnded) {
    return { error: "This event has ended.", claimed: null, code: "EVENT_ENDED" };
  }
  if (event.salesEndsAt && now >= event.salesEndsAt) {
    return { error: "Ticket sales have ended.", claimed: null, code: "SALES_ENDED" };
  }

  const existing = await prisma.booking.findFirst({
    where: {
      userId: session.user.id,
      eventId,
      status: "CONFIRMED",
    },
  });
  if (existing) {
    return { error: "You already have tickets for this event.", claimed: true, code: "ALREADY" };
  }

  const ticketType =
    event.ticketTypes.find((candidate) => candidate.id === ticketTypeId) ??
    event.ticketTypes[0];
  if (!ticketType) {
    return { error: "No active ticket type is available.", claimed: null, code: "NOT_FOUND" };
  }
  if (ticketType.price > 0 || paymentMethod !== "free") {
    return { error: "This event requires secure checkout.", claimed: null, code: "PAID_ONLY" };
  }
  if (ticketType.saleStart && now < ticketType.saleStart) {
    return { error: "This ticket is not on sale yet.", claimed: null, code: "NOT_FOUND" };
  }
  if (ticketType.saleEnd && now > ticketType.saleEnd) {
    return { error: "Ticket sales have ended.", claimed: null, code: "SALES_ENDED" };
  }
  if (quantity < ticketType.minPerOrder || quantity > ticketType.maxPerOrder) {
    return { error: "Selected quantity is outside the allowed range.", claimed: null, code: "NOT_FOUND" };
  }
  if (ticketType.inventoryRemaining < quantity) {
    return { error: "Not enough tickets remain.", claimed: null, code: "SOLD_OUT" };
  }

  const attendee = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  try {
    await prisma.$transaction(async (tx) => {
      const inventoryUpdate = await tx.ticketType.updateMany({
        where: {
          id: ticketType.id,
          inventoryRemaining: {
            gte: quantity,
          },
        },
        data: {
          inventoryRemaining: {
            decrement: quantity,
          },
        },
      });

      if (inventoryUpdate.count === 0) {
        throw new Error("EVENTLY_INVENTORY_CONFLICT");
      }

      const booking = await tx.booking.create({
        data: {
          referenceCode: makeReference("BK"),
          userId: session.user.id,
          eventId,
          status: "CONFIRMED",
          subtotal: 0,
          serviceFee: 0,
          total: 0,
          currency: ticketType.currency,
          paidAt: new Date(),
          lineItems: {
            create: {
              ticketTypeId: ticketType.id,
              ticketTypeName: ticketType.name,
              quantity,
              unitPrice: 0,
              lineTotal: 0,
            },
          },
        },
      });

      for (let index = 0; index < quantity; index += 1) {
        await tx.ticket.create({
          data: {
            referenceCode: makeReference("TK"),
            bookingId: booking.id,
            userId: session.user.id,
            eventId,
            ticketTypeId: ticketType.id,
            quantity: 1,
            paymentMethod: "free",
            attendeeName: attendee?.name?.trim() || attendee?.email || "Guest",
            attendeeEmail: attendee?.email || session.user.email,
            qrCodeValue: crypto.randomUUID(),
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EVENTLY_INVENTORY_CONFLICT") {
      return { error: "Not enough tickets remain.", claimed: null, code: "SOLD_OUT" };
    }

    throw error;
  }

  revalidatePathsForEvent(event.slug);
  return { error: null, claimed: true, code: "OK" };
}

export async function cancelTicket(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in required.", cancelled: false };
  }

  const booking = await prisma.booking.findFirst({
    where: { userId: session.user.id, eventId, status: "CONFIRMED" },
    include: { lineItems: true, event: { select: { slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!booking) {
    return { error: "Booking not found.", cancelled: false };
  }

  await prisma.$transaction(async (tx) => {
    for (const lineItem of booking.lineItems) {
      await tx.ticketType.update({
        where: { id: lineItem.ticketTypeId },
        data: {
          inventoryRemaining: {
            increment: lineItem.quantity,
          },
        },
      });
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    await tx.ticket.updateMany({
      where: { bookingId: booking.id },
      data: {
        status: "CANCELLED",
      },
    });
  });

  revalidatePathsForEvent(booking.event.slug);
  return { error: null as string | null, cancelled: true };
}
