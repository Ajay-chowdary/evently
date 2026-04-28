"use client";

import Image from "next/image";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { claimTicket } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatCurrency(amount: number, currency: string): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function CheckoutClient({
  eventId,
  eventSlug,
  eventTitle,
  eventImageUrl,
  dateLine,
  priceLabel,
  unitPrice,
  currency,
  quantity,
  userEmail,
  userName,
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  eventImageUrl: string;
  dateLine: string;
  priceLabel: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  userEmail: string;
  userName: string;
}) {
  const lineTotal = formatCurrency(unitPrice * quantity, currency);
  const orderTotal = formatCurrency(unitPrice * quantity, currency);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState(() => {
    const parts = (userName ?? "").trim().split(/\s+/);
    return parts[0] ?? "";
  });
  const [lastName, setLastName] = useState(() => {
    const parts = (userName ?? "").trim().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(" ") : "";
  });
  const [email, setEmail] = useState(userEmail);
  const [paymentMethod, setPaymentMethod] = useState("free");
  const [keepUpdated, setKeepUpdated] = useState(true);

  const [timeLeft, setTimeLeft] = useState(20 * 60);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const handlePlaceOrder = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (timeLeft <= 0) {
      setError("Your session has expired. Please go back and try again.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await claimTicket(eventId, quantity, paymentMethod);
      if (res.claimed) {
        setSuccess(true);
        return;
      }
      if (res.error) setError(res.error);
    });
  };

  if (success) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md space-y-6 text-center">
          <CheckCircle2 className="mx-auto size-16 text-emerald-500" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">You are all set!</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {quantity} ticket{quantity > 1 ? "s" : ""} for <span className="font-semibold">{eventTitle}</span> confirmed.
            Check your email at <span className="font-medium">{email}</span> for details.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-lg bg-[#d1410c] font-semibold text-white hover:bg-[#b7370a]">
              <Link href="/account/tickets">View my tickets</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-lg">
              <Link href="/events">Browse more events</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 pt-20">
      <div className="fixed inset-0 z-50 flex overflow-auto bg-white dark:bg-zinc-950">
        <div className="flex min-h-full w-full flex-col md:flex-row">
          {/* Left: checkout form */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-lg px-6 py-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  aria-label="Go back"
                >
                  <ArrowLeft className="size-5" />
                </button>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Checkout</h1>
                <button
                  type="button"
                  onClick={() => router.push(`/events/${eventSlug}`)}
                  className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Timer */}
              <p className="mt-2 text-center text-sm text-blue-600 dark:text-blue-400">
                Time left {timerDisplay}
              </p>

              {/* Event summary card */}
              <div className="mt-6 flex items-center gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={eventImageUrl} alt="" fill className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">{eventTitle}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{dateLine}</p>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{priceLabel}</p>
                </div>
              </div>

              {/* Billing information */}
              <section className="mt-8">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Billing information</h2>
                <div className="mt-1 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>Logged in as {email}.</span>
                  <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/events/${eventSlug}/checkout?qty=${quantity}`)}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Not you?
                  </Link>
                </div>
                <p className="mt-3 text-right text-xs text-red-500">
                  <span className="text-red-500">*</span> Required
                </p>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs text-zinc-500 dark:text-zinc-400">
                      First name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-12 rounded-lg border-zinc-300 dark:border-zinc-700"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs text-zinc-500 dark:text-zinc-400">
                      Last name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 rounded-lg border-zinc-300 dark:border-zinc-700"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-zinc-500 dark:text-zinc-400">
                    Email address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-lg border-zinc-300 dark:border-zinc-700"
                    required
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keepUpdated}
                      onChange={(e) => setKeepUpdated(e.target.checked)}
                      className="mt-0.5 size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Keep me updated on more events and news from this event organizer.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Send me emails about the best events happening nearby or online.
                    </span>
                  </label>
                </div>
              </section>

              {/* Pay with */}
              <section className="mt-8">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Pay with</h2>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    disabled
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition ${
                      paymentMethod === "card"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-zinc-200 bg-white opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
                    }`}
                  >
                    <CreditCard className="size-5 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Credit or debit card</span>
                    <span className="ml-auto text-xs text-zinc-400">Coming later</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("paypal")}
                    disabled
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition ${
                      paymentMethod === "paypal"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-zinc-200 bg-white opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
                    }`}
                  >
                    <span className="flex size-5 items-center justify-center text-xs font-bold text-blue-700">P</span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">PayPal</span>
                    <span className="ml-auto text-xs text-zinc-400">Coming later</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("gpay")}
                    disabled
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition ${
                      paymentMethod === "gpay"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-zinc-200 bg-white opacity-60 dark:border-zinc-800 dark:bg-zinc-950"
                    }`}
                  >
                    <span className="flex size-5 items-center justify-center text-xs font-bold text-zinc-600">G</span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Google Pay</span>
                    <span className="ml-auto text-xs text-zinc-400">Coming later</span>
                  </button>
                </div>
              </section>

              {/* Terms + Place Order */}
              <section className="mt-8 pb-10">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  By selecting Place Order, I agree to the{" "}
                  <span className="font-medium text-blue-600 dark:text-blue-400">Evently Terms of Service</span>.
                </p>

                {error && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handlePlaceOrder}
                  disabled={pending || timeLeft <= 0}
                  className="mt-4 h-12 w-full max-w-xs rounded-lg bg-[#d1410c] text-base font-semibold text-white shadow-sm hover:bg-[#b7370a]"
                >
                  {pending ? "Processing..." : "Place Order"}
                </Button>

                <div className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
                  <span>Powered by</span>
                  <span className="font-semibold text-zinc-600 dark:text-zinc-300">Evently</span>
                </div>
              </section>
            </div>
          </div>

          {/* Right: order summary sidebar */}
          <div className="hidden w-[340px] shrink-0 border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 md:block">
            <div className="sticky top-0 px-6 py-8">
              {/* Event image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                <Image src={eventImageUrl} alt="" fill className="object-cover" unoptimized />
              </div>

              {/* Order summary */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Order summary</h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {quantity} x {eventTitle.length > 25 ? eventTitle.slice(0, 25) + "..." : eventTitle}
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-50">{lineTotal}</span>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <p className="text-zinc-600 dark:text-zinc-400">Delivery</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{quantity} x eTicket</p>
                    </div>
                    <span className="text-zinc-900 dark:text-zinc-50">Free</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <span className="font-bold text-zinc-900 dark:text-zinc-50">Total</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50">{orderTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile order summary (visible below form on small screens) */}
          <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-6 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Order summary</h3>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">{quantity} x {eventTitle}</span>
              <span className="text-zinc-900 dark:text-zinc-50">{lineTotal}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <span className="font-bold text-zinc-900 dark:text-zinc-50">Total</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-50">{orderTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
