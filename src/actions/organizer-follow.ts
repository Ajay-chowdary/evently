"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function toggleOrganizerFollow(organizerId: string, eventSlug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in to follow organizers.", following: null as boolean | null };
  }
  if (organizerId === session.user.id) {
    return { error: "You cannot follow yourself.", following: null };
  }

  const existing = await prisma.organizerFollow.findFirst({
    where: { followerId: session.user.id, organizerId },
  });

  if (existing) {
    await prisma.organizerFollow.deleteMany({
      where: { followerId: session.user.id, organizerId },
    });
    revalidatePath(`/events/${eventSlug}`);
    revalidatePath("/events");
    return { error: null as string | null, following: false };
  }

  await prisma.organizerFollow.create({
    data: { followerId: session.user.id, organizerId },
  });
  revalidatePath(`/events/${eventSlug}`);
  revalidatePath("/events");
  return { error: null as string | null, following: true };
}
