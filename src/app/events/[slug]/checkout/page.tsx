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
  searchParams: Promise<{ qty?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isMockCatalog()) return { title: "Checkout" };
  const event = await getEventBySlug(slug);
  return { title: event ? `Checkout - ${event.title}` : "Checkout" };
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { qty } = await searchParams;

  if (isMockCatalog()) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 pt-20 sm:px-8">
        <MockCheckoutWrapper slug={slug} />
      </main>
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/events/${slug}/checkout?qty=${qty ?? "1"}`)}`);
  }

  const event = await getEventBySlug(slug);
  if (!event || !event.published) {
    redirect(`/events/${slug}`);
  }

  const now = new Date();
  const eventEnded = now >= (event.endsAt ?? event.startsAt);
  if (eventEnded) redirect(`/events/${slug}`);

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

  const quantity = Math.min(10, Math.max(1, parseInt(qty ?? "1", 10) || 1));

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
  const isFree = !event.ticketPrice || event.ticketPrice === 0;
  const priceLabel = isFree
    ? "Free"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: event.ticketCurrency ?? "USD" }).format(event.ticketPrice);

  return (
    <CheckoutClient
      eventId={event.id}
      eventSlug={event.slug}
      eventTitle={event.title}
      eventImageUrl={event.imageUrl}
      dateLine={dateLine}
      priceLabel={priceLabel}
      unitPrice={event.ticketPrice ?? 0}
      currency={event.ticketCurrency ?? "USD"}
      quantity={quantity}
      userEmail={user?.email ?? session.user.email ?? ""}
      userName={user?.name ?? ""}
    />
  );
}
