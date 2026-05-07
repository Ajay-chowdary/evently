import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: "2026-03-25.dahlia" })
  : null;

function makeReference(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

async function confirmBookingFromSession(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId?.trim();
  if (!bookingId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        lineItems: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!booking) {
      return;
    }
    if (booking.status === "CONFIRMED") {
      return;
    }
    if (booking.status !== "PENDING_PAYMENT") {
      return;
    }

    const lineItem = booking.lineItems[0];
    if (!lineItem) {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "FAILED",
          failureReason: "No booking line items were found during confirmation.",
        },
      });
      return;
    }

    const inventoryUpdate = await tx.ticketType.updateMany({
      where: {
        id: lineItem.ticketTypeId,
        inventoryRemaining: {
          gte: lineItem.quantity,
        },
      },
      data: {
        inventoryRemaining: {
          decrement: lineItem.quantity,
        },
      },
    });

    if (inventoryUpdate.count === 0) {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "FAILED",
          failureReason: "Inventory was no longer available when payment completed.",
        },
      });
      return;
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        paidAt: new Date(),
        failureReason: null,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      },
    });

    const attendeeName = session.metadata?.attendeeName?.trim() || booking.user.name || booking.user.email;
    const attendeeEmail = session.metadata?.attendeeEmail?.trim().toLowerCase() || booking.user.email;
    for (let index = 0; index < lineItem.quantity; index += 1) {
      await tx.ticket.create({
        data: {
          referenceCode: makeReference("TK"),
          bookingId: booking.id,
          userId: booking.userId,
          eventId: booking.eventId,
          ticketTypeId: lineItem.ticketTypeId,
          quantity: 1,
          paymentMethod: "stripe",
          attendeeName,
          attendeeEmail,
          qrCodeValue: crypto.randomUUID(),
        },
      });
    }
  });
}

async function expirePendingBooking(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId?.trim();
  if (!bookingId) {
    return;
  }

  await prisma.booking.updateMany({
    where: {
      id: bookingId,
      status: "PENDING_PAYMENT",
    },
    data: {
      status: "EXPIRED",
      failureReason: "Checkout session expired.",
    },
  });
}

export async function POST(request: NextRequest) {
  if (!stripe || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  // Backstop in case an attacker hammers the endpoint with bad signatures —
  // signature verification is the primary defense.
  const rl = await rateLimit("webhook").limit(`ip:${clientIp(request.headers)}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await confirmBookingFromSession(event.data.object as Stripe.Checkout.Session);
  }

  if (event.type === "checkout.session.expired") {
    await expirePendingBooking(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}
