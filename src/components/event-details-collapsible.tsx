"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EventDetailsCollapsible({ description }: { description: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full max-w-md rounded-md border border-zinc-300 bg-white font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex w-full items-center justify-center gap-2">
          {open ? "Hide event details" : "View all event details"}
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </span>
      </Button>
      {open ? (
        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-700 dark:text-zinc-300">{description}</p>
        </div>
      ) : null}
    </div>
  );
}
