"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ShareEventButton({ path, className }: { path: string; className?: string }) {
  const [hint, setHint] = useState<string | null>(null);

  const onClick = async () => {
    setHint(null);
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}` : path;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ url, title: document.title });
        setHint("Shared");
        window.setTimeout(() => setHint(null), 2000);
        return;
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      setHint("Link copied");
      window.setTimeout(() => setHint(null), 2000);
    } catch {
      setHint("Could not copy");
      window.setTimeout(() => setHint(null), 2500);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800", className)}
        aria-label="Share event"
        onClick={() => void onClick()}
      >
        <Share2 className="size-5" />
      </Button>
      {hint ? <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span> : null}
    </div>
  );
}
