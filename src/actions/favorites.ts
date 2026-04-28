"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function revalidateEventPaths(eventId: string) {
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { slug: true },
  });
  if (ev?.slug) revalidatePath(`/events/${ev.slug}`);
}

export async function toggleFavorite(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in to save events.", saved: null as boolean | null };
  }

  const userId = session.user.id;
  const existing = await prisma.savedEvent.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (existing) {
    await prisma.savedEvent.delete({
      where: { userId_eventId: { userId, eventId } },
    });
    await revalidateEventPaths(eventId);
    revalidatePath("/events");
    revalidatePath("/account/saved");
    revalidatePath("/");
    return { saved: false, error: null as string | null };
  }

  await prisma.savedEvent.create({
    data: { userId, eventId },
  });
  await revalidateEventPaths(eventId);
  revalidatePath("/events");
  revalidatePath("/account/saved");
  revalidatePath("/");
  return { saved: true, error: null as string | null };
}
