"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters/currency";
import { isEventBookingOpen, isTicketPurchasable, validateQuantity } from "@/lib/booking-engine";
import type { CatalogEventDetail } from "@/types/domain";
import { useBookingStore } from "@/stores/booking-store";
import { format, formatEventDateRange } from "@/lib/format-date";

function tierMessage(code: string): string {
  switch (code) {
    case "SOLD_OUT":
      return "Sold out";
    case "HIDDEN":
      return "Unavailable";
    case "NOT_ON_SALE":
      return "Not on sale";
    case "SALE_NOT_STARTED":
      return "Sales have not started";
    case "SALE_ENDED":
      return "Sales ended";
    default:
      return "Unavailable";
  }
}

export function EventTicketPanelMock({ detail }: { detail: CatalogEventDetail }) {
  const router = useRouter();
  const effectiveRemaining = useBookingStore((s) => s.effectiveRemaining);
  const setCart = useBookingStore((s) => s.setCart);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const now = new Date();
  const endTime = detail.endDateTime ? new Date(detail.endDateTime) : new Date(detail.startDateTime);
  const eventEnded = now >= endTime;
  const salesEnd = detail.salesEndsAt ? now >= new Date(detail.salesEndsAt) : false;
  const cancelled = detail.status === "cancelled";
  const bookingOpen = isEventBookingOpen(detail);

  const purchasableTiers = useMemo(() => {
    return detail.ticketTypes.filter((t) => t.status !== "hidden");
  }, [detail.ticketTypes]);

  const anyAvailable = useMemo(() => {
    return purchasableTiers.some((t) => {
      const inv = effectiveRemaining(t);
      return isTicketPurchasable(t, inv) === null;
    });
  }, [purchasableTiers, effectiveRemaining]);

  const selected = purchasableTiers.find((t) => t.id === selectedId) ?? null;
  const selectedInv = selected ? effectiveRemaining(selected) : 0;
  const selectedBlock = selected ? isTicketPurchasable(selected, selectedInv) : null;
  const qtyError = selected ? validateQuantity(selected, qty, selectedInv) : null;

  let blockedTitle = "";
  if (cancelled) blockedTitle = "Event cancelled";
  else if (eventEnded) blockedTitle = "Event ended";
  else if (salesEnd) blockedTitle = "Sales ended";
  else if (!bookingOpen) blockedTitle = "Not available";
  else if (purchasableTiers.length === 0 || !anyAvailable) blockedTitle = "Sold out";

  const salesEndedLine = format(new Date(detail.salesEndsAt ?? detail.startDateTime));
  const exploreHref = `/events?type=${encodeURIComponent(detail.categorySlug)}`;

  const onContinue = () => {
    if (!selected || selectedBlock || qtyError) return;
    setCart({
      eventId: detail.id,
      eventSlug: detail.slug,
      ticketTypeId: selected.id,
      quantity: qty,
    });
    router.push(`/events/${detail.slug}/checkout`);
  };

  if (blockedTitle) {
    return (
      <aside className="rounded-lg border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-24">
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{blockedTitle}</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{salesEndedLine}</p>
        {detail.ticketNote ? (
          <p className="mt-3 text-sm leading-snug text-zinc-700 dark:text-zinc-300">{detail.ticketNote}</p>
        ) : null}
        <div className="mt-5">
          <Button
            asChild
            className="h-12 w-full rounded-md bg-[#d1410c] text-base font-semibold text-white shadow-sm hover:bg-[#b7370a] dark:bg-[#d1410c] dark:hover:bg-[#b7370a]"
          >
            <Link href={exploreHref}>Explore similar events</Link>
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-zinc-200 bg-white p-6 shadow-md dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-24">
      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Tickets</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {formatEventDateRange(new Date(detail.startDateTime), detail.endDateTime ? new Date(detail.endDateTime) : null)}
      </p>
      {detail.ticketNote ? (
        <p className="mt-3 text-sm leading-snug text-zinc-700 dark:text-zinc-300">{detail.ticketNote}</p>
      ) : null}

      <div className="mt-5 space-y-3" role="radiogroup" aria-label="Ticket types">
        {purchasableTiers.map((t) => {
          const inv = effectiveRemaining(t);
          const block = isTicketPurchasable(t, inv);
          const disabled = Boolean(block);
          return (
            <label
              key={t.id}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-colors ${
                selectedId === t.id
                  ? "border-orange-500 bg-orange-50/50 dark:border-orange-500 dark:bg-orange-950/20"
                  : "border-zinc-200 dark:border-zinc-700"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="tier"
                  className="mt-1"
                  checked={selectedId === t.id}
                  disabled={disabled}
                  onChange={() => {
                    setSelectedId(t.id);
                    setQty(Math.max(t.minPerOrder, 1));
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">{t.name}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.description}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(t.price, t.currency)}
                    {disabled && block ? ` · ${tierMessage(block)}` : ` · ${inv} left`}
                  </p>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {selected && !selectedBlock ? (
        <div className="mt-4 space-y-2">
          <Label htmlFor="qty">Quantity</Label>
          <input
            id="qty"
            type="number"
            min={selected.minPerOrder}
            max={Math.min(selected.maxPerOrder, selectedInv)}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          {qtyError ? <p className="text-xs text-red-600">{qtyError}</p> : null}
        </div>
      ) : null}

      <div className="mt-5">
        <Button
          type="button"
          disabled={!selected || Boolean(selectedBlock) || Boolean(qtyError)}
          onClick={onContinue}
          className="h-12 w-full rounded-md bg-[#d1410c] text-base font-semibold text-white shadow-sm hover:bg-[#b7370a] dark:bg-[#d1410c] dark:hover:bg-[#b7370a]"
        >
          Continue to checkout
        </Button>
      </div>
    </aside>
  );
}
