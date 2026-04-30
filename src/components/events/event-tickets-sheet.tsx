"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/formatters/currency";
import { isEventBookingOpen, isTicketPurchasable } from "@/lib/booking-engine";
import { useBookingStore } from "@/stores/booking-store";
import type { CatalogEventDetail } from "@/types/domain";

function tierMessage(code: string): string {
  switch (code) {
    case "SOLD_OUT":
      return "Sold out";
    case "HIDDEN":
      return "Unavailable";
    case "NOT_ON_SALE":
      return "Not on sale";
    case "SALE_NOT_STARTED":
      return "Not on sale yet";
    case "SALE_ENDED":
      return "Sales ended";
    default:
      return "Unavailable";
  }
}

export function EventTicketsSheet({
  detail,
  trigger,
}: {
  detail: CatalogEventDetail;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const effectiveRemaining = useBookingStore((s) => s.effectiveRemaining);
  const setCart = useBookingStore((s) => s.setCart);
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const visibleTiers = useMemo(
    () => detail.ticketTypes.filter((t) => t.status !== "hidden"),
    [detail.ticketTypes],
  );

  const now = new Date();
  const eventEnded = now >= new Date(detail.endDateTime ?? detail.startDateTime);
  const cancelled = detail.status === "cancelled";
  const bookingOpen = isEventBookingOpen(detail);
  const closed = cancelled || eventEnded || !bookingOpen;

  const tierData = visibleTiers.map((t) => {
    const inv = effectiveRemaining(t);
    const block = isTicketPurchasable(t, inv);
    const qty = quantities[t.id] ?? 0;
    return { tier: t, inv, block, qty };
  });

  const totalQty = tierData.reduce((sum, d) => sum + d.qty, 0);
  const totalAmount = tierData.reduce((sum, d) => sum + d.qty * d.tier.price, 0);
  const currency = visibleTiers[0]?.currency ?? "USD";
  const activeTier = tierData.find((d) => d.qty > 0);

  const setQty = (id: string, value: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if (value <= 0) {
        delete next[id];
      } else {
        next[id] = value;
      }
      return next;
    });
  };

  const onCheckout = () => {
    if (!activeTier) return;
    if (tierData.filter((d) => d.qty > 0).length > 1) {
      const first = tierData.find((d) => d.qty > 0);
      if (!first) return;
    }
    setCart({
      eventId: detail.id,
      eventSlug: detail.slug,
      ticketTypeId: activeTier.tier.id,
      quantity: activeTier.qty,
    });
    setOpen(false);
    router.push(`/events/${detail.slug}/checkout`);
  };

  const multipleTiersSelected = tierData.filter((d) => d.qty > 0).length > 1;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex w-full max-w-md flex-col gap-0 p-0">
        <div className="flex items-start justify-between border-b border-zinc-200 px-6 pb-4 pt-6 dark:border-zinc-800">
          <div className="min-w-0 pr-8">
            <SheetTitle>Choose tickets</SheetTitle>
            <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">{detail.title}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {closed ? (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-200">
              {cancelled ? "Event cancelled" : eventEnded ? "Event ended" : "Sales are not open"}
            </p>
          ) : tierData.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No ticket types available.</p>
          ) : (
            <ul className="space-y-3">
              {tierData.map(({ tier, inv, block, qty }) => {
                const disabled = Boolean(block);
                const max = Math.min(tier.maxPerOrder, inv);
                const min = tier.minPerOrder || 1;
                return (
                  <li
                    key={tier.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      qty > 0
                        ? "border-orange-500 bg-orange-50/50 dark:border-orange-500 dark:bg-orange-950/20"
                        : "border-zinc-200 dark:border-zinc-800"
                    } ${disabled ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">{tier.name}</p>
                        {tier.description ? (
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{tier.description}</p>
                        ) : null}
                        <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {tier.price > 0 ? formatCurrency(tier.price, tier.currency) : "Free"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {disabled && block ? tierMessage(block) : `${inv} left`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Decrease ${tier.name} quantity`}
                          disabled={disabled || qty <= 0}
                          onClick={() => setQty(tier.id, Math.max(0, qty - 1))}
                          className="flex size-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                          {qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${tier.name} quantity`}
                          disabled={disabled || (max > 0 && qty >= max)}
                          onClick={() => {
                            const next = qty === 0 ? Math.max(min, 1) : qty + 1;
                            if (max > 0 && next > max) return;
                            setQty(tier.id, next);
                          }}
                          className="flex size-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              {totalQty} {totalQty === 1 ? "ticket" : "tickets"}
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {totalAmount > 0 ? formatCurrency(totalAmount, currency) : "—"}
            </span>
          </div>
          {multipleTiersSelected ? (
            <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">
              Only one ticket type per order is supported right now. Checkout will use your first selected type.
            </p>
          ) : null}
          <Button
            type="button"
            disabled={closed || !activeTier}
            onClick={onCheckout}
            className="h-12 w-full rounded-md bg-[#d1410c] text-base font-semibold text-white shadow-sm hover:bg-[#b7370a] disabled:opacity-50 dark:bg-[#d1410c] dark:hover:bg-[#b7370a]"
          >
            Checkout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
