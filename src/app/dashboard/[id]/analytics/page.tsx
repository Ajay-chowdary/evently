import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/formatters/currency";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const ev = await prisma.event.findUnique({ where: { id }, select: { title: true } });
  return { title: ev ? `Performance · ${ev.title}` : "Event performance" };
}

export default async function DashboardEventAnalyticsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      bookings: {
        include: {
          tickets: true,
        },
      },
      ticketTypes: true,
    },
  });
  if (!event || event.organizerId !== session.user.id) {
    notFound();
  }

  const confirmedBookings = event.bookings.filter((booking) => booking.status === "CONFIRMED");
  const grossSales = confirmedBookings.reduce((sum, booking) => sum + booking.total, 0);
  const serviceFees = confirmedBookings.reduce((sum, booking) => sum + booking.serviceFee, 0);
  const attendees = confirmedBookings.reduce((sum, booking) => sum + booking.tickets.length, 0);
  const pendingBookings = event.bookings.filter((booking) => booking.status === "PENDING_PAYMENT").length;

  return (
    <main>
      <p className="mb-6 text-sm">
        <Link href="/dashboard" className="text-orange-600 hover:underline dark:text-orange-400">
          Dashboard
        </Link>
        <span className="mx-2 text-zinc-400">/</span>
        <span className="text-zinc-600 dark:text-zinc-400">Performance</span>
      </p>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{event.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Live booking performance for this event.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Gross sales</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCurrency(grossSales, event.ticketCurrency)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Service fees</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCurrency(serviceFees, event.ticketCurrency)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Confirmed bookings</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{confirmedBookings.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">Attendees</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{attendees}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Ticket types</h2>
          <ul className="mt-4 space-y-3">
            {event.ticketTypes.map((ticketType) => (
              <li key={ticketType.id} className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{ticketType.name}</p>
                  <p className="text-sm text-zinc-500">
                    {ticketType.inventoryRemaining} of {ticketType.inventoryTotal} remaining
                  </p>
                </div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(ticketType.price, ticketType.currency)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Booking status</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Pending payment</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{pendingBookings}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Cancelled / refunded</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                {event.bookings.filter((booking) => booking.status !== "CONFIRMED" && booking.status !== "PENDING_PAYMENT").length}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
