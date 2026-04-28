"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ticket } from "lucide-react";
import { claimTicket } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ClaimTicketButton({
  eventId,
  eventSlug,
  initialClaimed,
  signedIn,
  className,
}: {
  eventId: string;
  eventSlug: string;
  initialClaimed: boolean;
  signedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [claimed, setClaimed] = useState(initialClaimed);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (!signedIn) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/events/${eventSlug}`)}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await claimTicket(eventId);
      if (res.claimed) {
        setClaimed(true);
        router.refresh();
        return;
      }
      if (res.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="w-full space-y-2">
    <Button
      type="button"
      variant={claimed ? "default" : "default"}
      disabled={pending || claimed}
      onClick={onClick}
      className={cn("gap-2 font-semibold", className)}
    >
      <Ticket className="h-4 w-4" aria-hidden />
      {signedIn ? (claimed ? "Ticket claimed" : pending ? "Claiming…" : "Get tickets") : "Sign in for ticket"}
    </Button>
    {error ? (
      <p className="text-center text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </p>
    ) : null}
    </div>
  );
}
