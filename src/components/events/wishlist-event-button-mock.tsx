"use client";

import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlist-store";

export function WishlistEventButtonMock({ eventId, compact }: { eventId: string; compact?: boolean }) {
  const has = useWishlistStore((s) => s.has(eventId));
  const toggle = useWishlistStore((s) => s.toggle);

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
          has && "text-orange-600 dark:text-orange-400",
        )}
        onClick={() => toggle(eventId)}
        aria-pressed={has}
        aria-label={has ? "Remove from saved" : "Save event"}
      >
        <Bookmark className={cn("size-5", has && "fill-current")} />
      </Button>
    );
  }

  return (
    <Button type="button" variant="secondary" className="rounded-full" onClick={() => toggle(eventId)}>
      <Bookmark className={cn("mr-2 size-4", has && "fill-current")} />
      {has ? "Saved" : "Save"}
    </Button>
  );
}
