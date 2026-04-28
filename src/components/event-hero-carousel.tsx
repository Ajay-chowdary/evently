"use client";

/* eslint-disable @next/next/no-img-element -- cover URLs may be data URIs or user-provided */

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
};

export function EventHeroCarousel({ images }: Props) {
  const slides = images.length > 0 ? images : [];
  const [index, setIndex] = useState(0);

  const i = slides.length ? index % slides.length : 0;
  const src = slides[i];

  const go = (delta: number) => {
    if (slides.length <= 1) return;
    setIndex((prev) => (prev + delta + slides.length) % slides.length);
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      {src ? (
        <img
          src={src}
          alt=""
          className="block w-full max-h-[520px] object-contain"
          draggable={false}
        />
      ) : (
        <div className="aspect-[2/1] w-full bg-gradient-to-br from-violet-900 via-purple-900 to-zinc-950" />
      )}

      {slides.length > 1 ? (
        <>
          <div className="absolute inset-y-0 left-2 z-[2] flex items-center sm:left-4">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full border-0 bg-white/90 text-zinc-900 shadow-md hover:bg-white dark:bg-white dark:text-zinc-900"
              aria-label="Previous slide"
              onClick={() => go(-1)}
            >
              <ChevronLeft className="size-5" />
            </Button>
          </div>
          <div className="absolute inset-y-0 right-2 z-[2] flex items-center sm:right-4">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full border-0 bg-white/90 text-zinc-900 shadow-md hover:bg-white dark:bg-white dark:text-zinc-900"
              aria-label="Next slide"
              onClick={() => go(1)}
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
          <div className="absolute bottom-4 left-1/2 z-[2] flex -translate-x-1/2 gap-2">
            {slides.map((_, dot) => (
              <button
                key={dot}
                type="button"
                aria-label={`Go to slide ${dot + 1}`}
                className={cn(
                  "size-2.5 rounded-full transition-colors",
                  dot === i ? "bg-white" : "bg-white/40 hover:bg-white/70",
                )}
                onClick={() => setIndex(dot)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
