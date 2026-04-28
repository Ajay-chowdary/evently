"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Minus,
  Plus,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type TicketBlockReason = "EVENT_ENDED" | "SALES_ENDED" | "SOLD_OUT" | null;

function fmtCurrency(amount: number, currency: string): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
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
  unitPrice = 0,
  currency = "USD",
  sidebarDateLine,
  eventImageUrl,
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
  unitPrice?: number;
  currency?: string;
  sidebarDateLine?: string;
  eventImageUrl?: string;
}) {
  const router = useRouter();
  const exploreHref = `/events?category=${encodeURIComponent(category)}`;
  const blocked = blockReason !== null;
  const price = priceLabel ?? "Free";

  const [modalOpen, setModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(initialClaimed ? initialQuantity : 1);
  const confirmed = initialClaimed;

  const openModal = useCallback(() => {
    if (!signedIn) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/events/${eventSlug}`)}`);
      return;
    }
    setModalOpen(true);
  }, [signedIn, router, eventSlug]);

  const goToCheckout = () => {
    setModalOpen(false);
    router.push(`/events/${eventSlug}/checkout?qty=${quantity}`);
  };

  return (
    <>
      {/* Sticky sidebar card */}
      <aside className="lg:sticky lg:top-24">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{priceLabel ?? "Free"}</p>
          {sidebarDateLine && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{sidebarDateLine}</p>
          )}

          <div className="mt-4">
            {confirmed ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                  <span className="text-sm font-semibold">{initialQuantity} ticket{initialQuantity > 1 ? "s" : ""} confirmed</span>
                </div>
                <Button asChild variant="secondary" className="h-11 w-full rounded-md text-sm font-semibold">
                  <Link href="/account/tickets">View my tickets</Link>
                </Button>
              </div>
            ) : blocked ? (
              <>
                <p className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {blockReason === "EVENT_ENDED" ? "This event has ended." : blockReason === "SOLD_OUT" ? "This event is sold out." : "Ticket sales have ended."}
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

      {/* Ticket selection modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-zinc-950">
            {/* Modal header */}
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{eventTitle}</h2>
                  {sidebarDateLine && (
                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{sidebarDateLine}</p>
                  )}
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

            {/* Modal body */}
            <div className="flex flex-col md:flex-row">
              {/* Left: ticket selection */}
              <div className="flex-1 px-6 py-6">
                <div className="rounded-lg border-2 border-blue-500 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{eventTitle}</p>
                      <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{price}</p>
                      {ticketNote && (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{ticketNote}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="flex size-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="min-w-[2rem] text-center text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= 10}
                        onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                        className="flex size-8 items-center justify-center rounded-full bg-[#d1410c] text-white transition hover:bg-[#b7370a] disabled:opacity-30"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: order summary + event image */}
              <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900 md:w-[280px] md:border-l md:border-t-0">
                {eventImageUrl && (
                  <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg">
                    <Image src={eventImageUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                )}
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Order summary</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>{quantity} x {eventTitle.length > 28 ? eventTitle.slice(0, 28) + "..." : eventTitle}</span>
                    <span>{fmtCurrency(unitPrice * quantity, currency)}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Total</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{fmtCurrency(unitPrice * quantity, currency)}</span>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <span className="text-xs text-zinc-400">Powered by Evently</span>
              <Button
                onClick={goToCheckout}
                className="h-10 rounded-md bg-[#d1410c] px-8 text-sm font-semibold text-white shadow-sm hover:bg-[#b7370a]"
              >
                Check out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
