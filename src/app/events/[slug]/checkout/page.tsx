import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEventBySlug } from "@/lib/events";
import { isMockCatalog } from "@/lib/data-source";
import { prisma } from "@/lib/db";
import { CheckoutClient } from "./checkout-client";
import { MockCheckoutWrapper } from "./mock-checkout-wrapper";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ qty?: string; ticketType?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isMockCatalog()) return { title: "Checkout" };
  const event = await getEventBySlug(slug);
  return { title: event ? `Checkout - ${event.title}` : "Checkout" };
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { qty, ticketType } = await searchParams;

  if (isMockCatalog()) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 pt-20 sm:px-8">
        <MockCheckoutWrapper slug={slug} />
      </main>
    );
  }

  const event = await getEventBySlug(slug);
  if (!event || !event.published) {
    redirect(`/events/${slug}`);
  }

  const session = await auth();
  if (!session?.user?.id) {
    const callback = new URLSearchParams({
      qty: qty ?? "1",
      ...(ticketType ? { ticketType } : {}),
    });
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/events/${slug}/checkout?${callback.toString()}`)}`);
  }

  const now = new Date();
  const eventEnded = now >= (event.endsAt ?? event.startsAt);
  if (eventEnded) redirect(`/events/${slug}`);

  const selectedTicketType =
    event.ticketTypes.find((row) => row.id === ticketType) ??
    event.ticketTypes.find((row) => row.status === "ACTIVE") ??
    null;
  if (!selectedTicketType) {
    redirect(`/events/${slug}`);
  }
  if (selectedTicketType.inventoryRemaining < selectedTicketType.minPerOrder) {
    redirect(`/events/${slug}`);
  }
  if (selectedTicketType.saleStart && now < selectedTicketType.saleStart) {
    redirect(`/events/${slug}`);
  }
  if (selectedTicketType.saleEnd && now > selectedTicketType.saleEnd) {
    redirect(`/events/${slug}`);
  }

  const existing = await prisma.booking.findFirst({
    where: {
      userId: session.user.id,
      eventId: event.id,
      status: {
        in: ["PENDING_PAYMENT", "CONFIRMED"],
      },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    redirect(`/events/${slug}`);
  }

  const quantity = Math.min(
    selectedTicketType.maxPerOrder,
    selectedTicketType.inventoryRemaining,
    Math.max(selectedTicketType.minPerOrder, parseInt(qty ?? "1", 10) || selectedTicketType.minPerOrder),
  );

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  function formatShortDate(d: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(d);
  }

  function formatShortTime(d: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  }

  const dateLine = `${formatShortDate(event.startsAt)} · ${formatShortTime(event.startsAt)}`;
  const priceLabel =
    selectedTicketType.price === 0
      ? "Free"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: selectedTicketType.currency,
        }).format(selectedTicketType.price);

  return (
    <CheckoutClient
      eventId={event.id}
      eventSlug={event.slug}
      ticketTypeId={selectedTicketType.id}
      ticketTypeName={selectedTicketType.name}
      eventTitle={event.title}
      eventImageUrl={event.imageUrl}
      dateLine={dateLine}
      priceLabel={priceLabel}
      unitPrice={selectedTicketType.price}
      currency={selectedTicketType.currency}
      quantity={quantity}
      userEmail={user?.email ?? session.user.email ?? ""}
      userName={user?.name ?? ""}
    />
  );
}
