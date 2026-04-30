"use client";

import Image from "next/image";
import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TicketBlockReason = "EVENT_ENDED" | "SALES_ENDED" | "SOLD_OUT" | null;

export type SidebarTicketType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  inventoryRemaining: number;
  minPerOrder: number;
  maxPerOrder: number;
  saleStart: string | null;
  saleEnd: string | null;
  status: "ACTIVE" | "SOLD_OUT";
};

function fmtCurrency(amount: number, currency: string): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function ticketAvailability(tt: SidebarTicketType): "SALE_NOT_STARTED" | "SALE_ENDED" | "SOLD_OUT" | null {
  if (tt.status === "SOLD_OUT" || tt.inventoryRemaining <= 0) {
    return "SOLD_OUT";
  }

  const now = Date.now();
  if (tt.saleStart) {
    const saleStart = new Date(tt.saleStart).getTime();
    if (Number.isFinite(saleStart) && now < saleStart) {
      return "SALE_NOT_STARTED";
    }
  }
  if (tt.saleEnd) {
    const saleEnd = new Date(tt.saleEnd).getTime();
    if (Number.isFinite(saleEnd) && now > saleEnd) {
      return "SALE_ENDED";
    }
  }

  return null;
}

function availabilityLabel(code: ReturnType<typeof ticketAvailability>) {
  if (code === "SALE_NOT_STARTED") return "Not on sale yet";
  if (code === "SALE_ENDED") return "Sales ended";
  if (code === "SOLD_OUT") return "Sold out";
  return "Available";
}

export function EventTicketSidebar({
  eventSlug,
  eventTitle,
  category,
  initialClaimed,
  initialQuantity,
  signedIn,
  blockReason,
  ticketNote,
  priceLabel,
  currency = "USD",
  sidebarDateLine,
  eventImageUrl,
  ticketTypes,
}: {
  eventSlug: string;
  eventTitle: string;
  category: string;
  initialClaimed: boolean;
  initialQuantity: number;
  signedIn: boolean;
  blockReason: TicketBlockReason;
  ticketNote: string | null;
  priceLabel?: string;
  currency?: string;
  sidebarDateLine?: string;
  eventImageUrl?: string;
  ticketTypes: SidebarTicketType[];
}) {
  const router = useRouter();
  const exploreHref = `/events?category=${encodeURIComponent(category)}`;
  const confirmed = initialClaimed;

  const visibleTicketTypes = useMemo(
    () => ticketTypes.filter((tt) => tt.status === "ACTIVE" || tt.status === "SOLD_OUT"),
    [ticketTypes],
  );
  const defaultTicketTypeId = useMemo(
    () => visibleTicketTypes.find((tt) => ticketAvailability(tt) === null)?.id ?? visibleTicketTypes[0]?.id ?? null,
    [visibleTicketTypes],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | null>(defaultTicketTypeId);
  const [quantity, setQuantity] = useState(initialClaimed ? initialQuantity : 1);

  const selectedTicketType = useMemo(
    () => visibleTicketTypes.find((tt) => tt.id === selectedTicketTypeId) ?? visibleTicketTypes[0] ?? null,
    [selectedTicketTypeId, visibleTicketTypes],
  );
  const selectedAvailability = selectedTicketType ? ticketAvailability(selectedTicketType) : "SOLD_OUT";
  const blocked = blockReason !== null || visibleTicketTypes.length === 0;

  const openModal = useCallback(() => {
    if (!signedIn) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/events/${eventSlug}`)}`);
      return;
    }
    setModalOpen(true);
  }, [signedIn, router, eventSlug]);

  const changeSelectedTicketType = (ticketTypeId: string) => {
    const next = visibleTicketTypes.find((tt) => tt.id === ticketTypeId);
    if (!next) return;
    setSelectedTicketTypeId(next.id);
    const nextMin = Math.max(1, next.minPerOrder);
    const nextMax = Math.max(nextMin, Math.min(next.maxPerOrder, next.inventoryRemaining || next.maxPerOrder));
    setQuantity((current) => Math.min(Math.max(current, nextMin), nextMax));
  };

  const goToCheckout = () => {
    if (!selectedTicketType) return;
    setModalOpen(false);
    const params = new URLSearchParams({
      qty: String(quantity),
      ticketType: selectedTicketType.id,
    });
    router.push(`/events/${eventSlug}/checkout?${params.toString()}`);
  };

  const asidePrice = selectedTicketType ? fmtCurrency(selectedTicketType.price, selectedTicketType.currency) : priceLabel ?? fmtCurrency(0, currency);
  const asideSubtitle = selectedTicketType && visibleTicketTypes.length > 1
    ? `${selectedTicketType.name} selected`
    : sidebarDateLine;

  return (
    <>
      <aside className="lg:sticky lg:top-24">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{priceLabel ?? asidePrice}</p>
          {asideSubtitle ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{asideSubtitle}</p>
          ) : null}

          <div className="mt-4">
            {confirmed ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                  <span className="text-sm font-semibold">
                    {initialQuantity} ticket{initialQuantity > 1 ? "s" : ""} confirmed
                  </span>
                </div>
                <Button asChild variant="secondary" className="h-11 w-full rounded-md text-sm font-semibold">
                  <Link href="/account/tickets">View my tickets</Link>
                </Button>
              </div>
            ) : blocked ? (
              <>
                <p className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {blockReason === "EVENT_ENDED"
                    ? "This event has ended."
                    : blockReason === "SOLD_OUT" || visibleTicketTypes.length === 0
                      ? "This event is sold out."
                      : "Ticket sales have ended."}
                </p>
                <Button
                  asChild
                  className="h-11 w-full rounded-md bg-[#d1410c] text-sm font-semibold text-white shadow-sm hover:bg-[#b7370a]"
                >
                  <Link href={exploreHref}>Find similar events</Link>
                </Button>
              </>
            ) : (
              <Button
                onClick={openModal}
                className="h-11 w-full rounded-md bg-[#d1410c] text-sm font-semibold text-white shadow-sm hover:bg-[#b7370a]"
              >
                Get tickets
              </Button>
            )}
          </div>
        </div>
      </aside>

      {modalOpen && selectedTicketType ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-zinc-950">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{eventTitle}</h2>
                  {sidebarDateLine ? (
                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{sidebarDateLine}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row">
              <div className="flex-1 px-6 py-6">
                <div className="space-y-3">
                  {visibleTicketTypes.map((ticketType) => {
                    const availability = ticketAvailability(ticketType);
                    const isSelected = selectedTicketType.id === ticketType.id;
                    return (
                      <button
                        key={ticketType.id}
                        type="button"
                        onClick={() => changeSelectedTicketType(ticketType.id)}
                        className={`w-full rounded-lg border p-4 text-left transition ${
                          isSelected
                            ? "border-blue-500 ring-1 ring-blue-200 dark:ring-blue-900"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{ticketType.name}</p>
                            {ticketType.description ? (
                              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{ticketType.description}</p>
                            ) : ticketNote ? (
                              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{ticketNote}</p>
                            ) : null}
                            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                              {availabilityLabel(availability)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                              {fmtCurrency(ticketType.price, ticketType.currency)}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {ticketType.inventoryRemaining} left
                            </p>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                              Order between {ticketType.minPerOrder} and {Math.min(ticketType.maxPerOrder, ticketType.inventoryRemaining)}.
                            </div>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                disabled={quantity <= ticketType.minPerOrder}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuantity((q) => Math.max(ticketType.minPerOrder, q - 1));
                                }}
                                className="flex size-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="min-w-[2rem] text-center text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                disabled={quantity >= Math.min(ticketType.maxPerOrder, ticketType.inventoryRemaining)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuantity((q) => Math.min(Math.min(ticketType.maxPerOrder, ticketType.inventoryRemaining), q + 1));
                                }}
                                className="flex size-8 items-center justify-center rounded-full bg-[#d1410c] text-white transition hover:bg-[#b7370a] disabled:opacity-30"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900 md:w-[280px] md:border-l md:border-t-0">
                {eventImageUrl ? (
                  <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg">
                    <Image src={eventImageUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : null}
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Order summary</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>
                      {quantity} x {selectedTicketType.name}
                    </span>
                    <span>{fmtCurrency(selectedTicketType.price * quantity, selectedTicketType.currency)}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Total</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {fmtCurrency(selectedTicketType.price * quantity, selectedTicketType.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <span className="text-xs text-zinc-400">Powered by Evently</span>
              <Button
                onClick={goToCheckout}
                disabled={selectedAvailability !== null}
                className="h-10 rounded-md bg-[#d1410c] px-8 text-sm font-semibold text-white shadow-sm hover:bg-[#b7370a]"
              >
                {selectedTicketType.price > 0 ? "Continue" : "Check out"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
