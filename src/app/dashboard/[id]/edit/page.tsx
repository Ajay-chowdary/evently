import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EventForm } from "@/components/event-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const ev = await prisma.event.findUnique({ where: { id }, select: { title: true } });
  return { title: ev ? `Edit ${ev.title}` : "Edit event" };
}

export default async function EditEventPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.organizerId !== session.user.id) {
    notFound();
  }

  return (
    <main className="-mx-2 sm:-mx-4">
      <EventForm mode="edit" event={event} />
    </main>
  );
}
