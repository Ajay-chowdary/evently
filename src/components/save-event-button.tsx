"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toggleFavorite } from "@/actions/favorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SaveEventButton({
  eventId,
  eventSlug,
  initialSaved,
  signedIn,
  compact,
}: {
  eventId: string;
  eventSlug: string;
  initialSaved: boolean;
  signedIn: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (!signedIn) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/events/${eventSlug}`)}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await toggleFavorite(eventId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.saved !== null) {
        setSaved(res.saved);
      }
    });
  };

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
            saved && "text-orange-600 dark:text-orange-400",
          )}
          disabled={pending}
          onClick={onClick}
          aria-pressed={saved}
          aria-label={signedIn ? (saved ? "Saved" : "Save event") : "Sign in to save"}
          title={signedIn ? (saved ? "Saved" : "Save event") : "Sign in to save"}
        >
          <Bookmark className={cn("size-5", saved && "fill-current")} aria-hidden />
        </Button>
        {error ? (
          <span className="max-w-[12rem] text-right text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <Button
        type="button"
        variant={saved ? "default" : "secondary"}
        className={cn("gap-2 rounded-full", saved && "ring-2 ring-offset-2 ring-zinc-900 dark:ring-offset-zinc-950")}
        disabled={pending}
        onClick={onClick}
        aria-pressed={saved}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} aria-hidden />
        {signedIn ? (saved ? "Saved" : "Save event") : "Sign in to save"}
      </Button>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
