import Link from "next/link";
import { OrganizerEventBookings } from "@/components/organizer/organizer-event-bookings";

type Props = { params: Promise<{ id: string }> };

export default async function OrganizerDemoBookingsPage({ params }: Props) {
  const { id } = await params;
  return (
    <main>
      <p className="mb-6">
        <Link href="/organizer-demo" className="text-sm text-orange-600 hover:underline dark:text-orange-400">
          Dashboard
        </Link>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Event bookings</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Mock purchases from this browser.</p>
      <div className="mt-8">
        <OrganizerEventBookings eventId={id} />
      </div>
    </main>
  );
}
