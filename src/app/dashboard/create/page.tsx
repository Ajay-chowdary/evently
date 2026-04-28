import { redirect } from "next/navigation";
import { EventForm } from "@/components/event-form";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Create event",
};

export default async function CreateEventPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard/create");
  }

  return (
    <main className="-mx-2 sm:-mx-4">
      <EventForm mode="create" />
    </main>
  );
}
