"use client";

import { format } from "@/lib/format-date";
import { formatCurrency } from "@/lib/formatters/currency";
import { Button } from "@/components/ui/button";
import { EventTicketsSheet } from "@/components/events/event-tickets-sheet";
import type { CatalogEventDetail } from "@/types/domain";

export function EventDetailBottomBar({
  detail,
  priceLabel,
  startDate,
  ctaLabel = "Get tickets",
  disabled = false,
}: {
  detail: CatalogEventDetail;
  priceLabel: string;
  startDate: Date;
  ctaLabel?: string;
  disabled?: boolean;
}) {
  const cta = (
    <Button
      type="button"
      disabled={disabled}
      className="h-11 rounded-md bg-[#d1410c] px-6 text-base font-semibold text-white shadow-sm hover:bg-[#b7370a] disabled:opacity-50 dark:bg-[#d1410c] dark:hover:bg-[#b7370a]"
    >
      {ctaLabel}
    </Button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white shadow-[0_-4px_18px_-12px_rgba(0,0,0,0.25)] dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{priceLabel}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{format(startDate)}</p>
        </div>
        {disabled ? cta : <EventTicketsSheet detail={detail} trigger={cta} />}
      </div>
    </div>
  );
}

export function buildPriceLabel(min: number, currency: string, hasMultiple: boolean) {
  if (!Number.isFinite(min) || min <= 0) return "Free";
  const formatted = formatCurrency(min, currency);
  return hasMultiple ? `From ${formatted}` : formatted;
}
