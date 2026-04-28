"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeTotals, isTicketPurchasable, validateQuantity } from "@/lib/booking-engine";
import { formatCurrency } from "@/lib/formatters/currency";
import type { CatalogEventDetail } from "@/types/domain";
import { useBookingStore } from "@/stores/booking-store";
import { getOrganizerPublishedFromStorage } from "@/stores/organizer-mock-store";

export function CheckoutClient({ detail }: { detail: CatalogEventDetail }) {
  const router = useRouter();
  const cart = useBookingStore((s) => s.cart);
  const effectiveRemaining = useBookingStore((s) => s.effectiveRemaining);
  const confirmCart = useBookingStore((s) => s.confirmCart);
  const setCart = useBookingStore((s) => s.setCart);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const tt = useMemo(() => {
    if (!cart || cart.eventSlug !== detail.slug) return null;
    return detail.ticketTypes.find((t) => t.id === cart.ticketTypeId) ?? null;
  }, [cart, detail]);

  const inv = tt ? effectiveRemaining(tt) : 0;
  const block = tt ? isTicketPurchasable(tt, inv) : "NOT_ON_SALE";
  const qty = cart?.quantity ?? 0;
  const qtyErr = tt && cart ? validateQuantity(tt, qty, inv) : "QTY_TOO_LOW";

  const pricing = useMemo(() => {
    if (!tt || !cart) return null;
    return computeTotals(tt.price * cart.quantity, tt.currency);
  }, [tt, cart]);

  if (!cart || cart.eventSlug !== detail.slug || !tt) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">No tickets in checkout</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Select a ticket on the event page first.</p>
        <Button className="mt-6 rounded-xl" asChild>
          <Link href={`/events/${detail.slug}`}>Back to event</Link>
        </Button>
      </div>
    );
  }

  if (block || qtyErr) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Checkout unavailable</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This selection is no longer valid. Refresh and try again.
        </p>
        <Button className="mt-6 rounded-xl" asChild>
          <Link href={`/events/${detail.slug}`}>Back to event</Link>
        </Button>
      </div>
    );
  }

  const onConfirm = () => {
    setError(null);
    setPending(true);
    const extra = getOrganizerPublishedFromStorage();
    const res = confirmCart(name, email, extra);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCart(null);
    router.push(`/book/success?ref=${encodeURIComponent(res.booking.referenceCode)}`);
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Checkout</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{detail.title}</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-2">
            <Label htmlFor="attendeeName">Full name</Label>
            <Input
              id="attendeeName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendeeEmail">Email</Label>
            <Input
              id="attendeeEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl"
              autoComplete="email"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" className="rounded-xl" asChild>
            <Link href={`/events/${detail.slug}`}>Back</Link>
          </Button>
          <Button type="button" className="rounded-xl" disabled={pending} onClick={onConfirm}>
            {pending ? "Confirming…" : "Confirm booking"}
          </Button>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-600 dark:text-zinc-400">
              {tt.name} × {cart.quantity}
            </dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {pricing ? formatCurrency(pricing.subtotal, tt.currency) : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-600 dark:text-zinc-400">Service fee</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {pricing ? formatCurrency(pricing.serviceFee, tt.currency) : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <dt className="font-semibold text-zinc-900 dark:text-zinc-50">Total</dt>
            <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
              {pricing ? formatCurrency(pricing.total, tt.currency) : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          Mock checkout only. No payment is processed.
        </p>
      </aside>
    </div>
  );
}
