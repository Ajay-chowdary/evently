"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const slides = [
  {
    code: "EV",
    title: "Discover what is on near you.",
    bullets: ["Search by city, date, or vibe", "Curated categories from music to classes"],
    className:
      "bg-gradient-to-br from-orange-500 via-orange-500 to-amber-600 text-white dark:from-orange-600 dark:via-orange-600 dark:to-amber-700",
    index: "01",
  },
  {
    code: "SV",
    title: "Save the nights you do not want to miss.",
    bullets: ["One tap to bookmark any listing", "Your picks sync when you sign in"],
    className:
      "bg-gradient-to-br from-sky-500 via-blue-600 to-teal-800 text-white dark:from-sky-600 dark:via-blue-700 dark:to-teal-900",
    index: "02",
    cta: { href: "/auth/signup", label: "Get started" },
  },
  {
    code: "GO",
    title: "Browse the full calendar.",
    bullets: ["Filters that stay out of your way", "Detail pages with everything you need"],
    className:
      "bg-gradient-to-br from-violet-600 via-purple-700 to-zinc-900 text-white dark:from-violet-700 dark:via-purple-800 dark:to-black",
    index: "03",
    cta: { href: "/events", label: "Browse events" },
  },
];

function SlideContent({ slide, i }: { slide: (typeof slides)[number]; i: number }) {
  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 text-xs font-medium uppercase tracking-[0.2em] opacity-80">
        ({slide.code})
      </div>
      <div className="relative z-[1] mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-xl space-y-6">
          <h2
            id={`slide-title-${i}`}
            className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            {slide.title}
          </h2>
          <ul className="space-y-2 text-base opacity-90 sm:text-lg">
            {slide.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span aria-hidden className="opacity-70">
                  -
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          {slide.cta && (
            <div className="pt-4">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white text-zinc-900 hover:bg-white/90 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
              >
                <Link href={slide.cta.href}>{slide.cta.label}</Link>
              </Button>
            </div>
          )}
        </div>
        <div
          className="select-none text-right text-[clamp(5rem,18vw,12rem)] font-extralight leading-none opacity-25"
          aria-hidden
        >
          {slide.index}
        </div>
      </div>
    </>
  );
}

export function PosterSlides() {
  const reduceMotion = useReducedMotion();

  const cardSectionClass = (slide: (typeof slides)[number]) =>
    cn(
      "relative flex min-h-[min(calc(100dvh-5.5rem),680px)] flex-col justify-center overflow-hidden rounded-3xl px-6 py-20 shadow-2xl ring-1 ring-black/10 sm:px-12 lg:px-16 dark:ring-white/10",
      slide.className,
    );

  if (reduceMotion) {
    return (
      <div className="flex flex-col gap-6 bg-zinc-200/90 px-4 pb-10 pt-2 dark:bg-zinc-950 sm:px-6">
        {slides.map((slide, i) => (
          <section
            key={slide.index}
            className={cardSectionClass(slide)}
            aria-labelledby={`slide-title-${i}`}
          >
            <SlideContent slide={slide} i={i} />
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="relative bg-zinc-300/80 dark:bg-zinc-950">
      {slides.map((slide, i) => (
        <div
          key={slide.index}
          className="sticky top-20 pb-6 sm:top-24 sm:pb-8"
          style={{ zIndex: (i + 1) * 10 }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <section className={cardSectionClass(slide)} aria-labelledby={`slide-title-${i}`}>
              <SlideContent slide={slide} i={i} />
            </section>
          </div>
        </div>
      ))}
    </div>
  );
}
