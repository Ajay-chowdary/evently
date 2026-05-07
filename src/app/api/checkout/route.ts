import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { computeTotals } from "@/lib/booking-engine";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env, hasStripeEnv } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: "2026-03-25.dahlia" })
  : null;

function makeReference(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  if (!hasStripeEnv() || !stripe) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured yet." },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const rl = await rateLimit("checkout").limit(`user:${session.user.id}:${clientIp(request.headers)}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        eventId?: string;
        ticketTypeId?: string;
        quantity?: number;
        attendeeName?: string;
        attendeeEmail?: string;
      }
    | null;

  const eventId = body?.eventId?.trim();
  const ticketTypeId = body?.ticketTypeId?.trim();
  const attendeeName = body?.attendeeName?.trim();
  const attendeeEmail = body?.attendeeEmail?.trim().toLowerCase();
  const quantity = Number(body?.quantity ?? 0);

  if (!eventId || !ticketTypeId || !attendeeName || !attendeeEmail) {
    return NextResponse.json({ error: "Missing checkout details." }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
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
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const ticketType = event.ticketTypes.find((row) => row.id === ticketTypeId);
  if (!ticketType) {
    return NextResponse.json({ error: "Ticket type not found." }, { status: 404 });
  }
  if (ticketType.price <= 0) {
    return NextResponse.json({ error: "Free tickets do not require Stripe checkout." }, { status: 400 });
  }
  if (quantity < ticketType.minPerOrder || quantity > ticketType.maxPerOrder) {
    return NextResponse.json({ error: "Selected quantity is outside the allowed range." }, { status: 400 });
  }
  if (quantity > ticketType.inventoryRemaining) {
    return NextResponse.json({ error: "Not enough tickets remain." }, { status: 409 });
  }

  const now = new Date();
  if (now >= (event.endsAt ?? event.startsAt)) {
    return NextResponse.json({ error: "This event has ended." }, { status: 409 });
  }
  if (event.salesEndsAt && now >= event.salesEndsAt) {
    return NextResponse.json({ error: "Ticket sales have ended." }, { status: 409 });
  }
  if (ticketType.saleStart && now < ticketType.saleStart) {
    return NextResponse.json({ error: "This ticket is not on sale yet." }, { status: 409 });
  }
  if (ticketType.saleEnd && now > ticketType.saleEnd) {
    return NextResponse.json({ error: "Ticket sales have ended." }, { status: 409 });
  }

  const existingBooking = await prisma.booking.findFirst({
    where: {
      userId: session.user.id,
      eventId: event.id,
      status: {
        in: ["PENDING_PAYMENT", "CONFIRMED"],
      },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existingBooking) {
    return NextResponse.json(
      { error: "You already have an active booking for this event." },
      { status: 409 },
    );
  }

  const { subtotal, serviceFee, total, currency } = computeTotals(ticketType.price * quantity, ticketType.currency);
  const checkoutExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const booking = await prisma.booking.create({
    data: {
      referenceCode: makeReference("BK"),
      userId: session.user.id,
      eventId: event.id,
      status: "PENDING_PAYMENT",
      subtotal,
      serviceFee,
      total,
      currency,
      checkoutExpiresAt,
      lineItems: {
        create: {
          ticketTypeId: ticketType.id,
          ticketTypeName: ticketType.name,
          quantity,
          unitPrice: ticketType.price,
          lineTotal: subtotal,
        },
      },
    },
  });

  try {
    const baseUrl = env.appUrl || request.nextUrl.origin;
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: booking.referenceCode,
      customer_email: attendeeEmail,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${event.title} — ${ticketType.name}`,
              description: event.description.slice(0, 500),
            },
            unit_amount: Math.round(ticketType.price * 100),
          },
          quantity,
        },
      ],
      metadata: {
        bookingId: booking.id,
        eventId: event.id,
        ticketTypeId: ticketType.id,
        userId: session.user.id,
        attendeeName,
        attendeeEmail,
        quantity: String(quantity),
      },
      success_url: `${baseUrl}/book/success?booking=${encodeURIComponent(booking.id)}&ref=${encodeURIComponent(booking.referenceCode)}`,
      cancel_url: `${baseUrl}/book/failure?booking=${encodeURIComponent(booking.id)}&event=${encodeURIComponent(event.slug)}&qty=${quantity}&ticketType=${encodeURIComponent(ticketType.id)}&reason=${encodeURIComponent("Checkout was cancelled.")}`,
      expires_at: Math.floor(checkoutExpiresAt.getTime() / 1000),
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripeCheckoutSessionId: stripeSession.id,
      },
    });

    return NextResponse.json({ url: stripeSession.url, bookingId: booking.id });
  } catch (error) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "FAILED",
        failureReason: error instanceof Error ? error.message : "Unable to create checkout session.",
      },
    });

    return NextResponse.json(
      { error: "Unable to start secure checkout. Please try again." },
      { status: 500 },
    );
  }
}
