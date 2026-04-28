/* eslint-disable @next/next/no-img-element -- cover URLs are user-provided from any host */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { format } from "@/lib/format-date";
import { EVENT_COVER_PLACEHOLDER, normalizeCoverImageUrl } from "@/lib/cover-image";
import type { Event } from "@/generated/prisma/client";
import type { PublicEventListItem } from "@/types/domain";
import { cn } from "@/lib/utils";

type EventCardModel =
  | Pick<Event, "id" | "slug" | "title" | "category" | "city" | "imageUrl" | "startsAt">
  | PublicEventListItem;

function cardStartsAt(event: EventCardModel): Date {
  const s = event.startsAt as Date | string;
  return s instanceof Date ? s : new Date(s);
}

export function EventCard({ event, className }: { event: EventCardModel; className?: string }) {
  const reduceMotion = useReducedMotion();
  const startsAt = cardStartsAt(event);
  const rawUrl = event.imageUrl;
  const [src, setSrc] = useState(() => normalizeCoverImageUrl(rawUrl));

  useEffect(() => {
    setSrc(normalizeCoverImageUrl(rawUrl));
  }, [rawUrl]);

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn("group h-full", className)}
    >
      <Link
        href={`/events/${event.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <img
            src={src}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setSrc(EVENT_COVER_PLACEHOLDER)}
          />
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-zinc-900 backdrop-blur dark:bg-zinc-950/90 dark:text-zinc-50">
            {event.category}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="text-lg font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
            {event.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {event.city} - {format(startsAt)}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}
