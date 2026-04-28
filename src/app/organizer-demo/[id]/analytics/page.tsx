import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function OrganizerDemoAnalyticsPage({ params }: Props) {
  await params;
  return (
    <main>
      <p className="mb-6">
        <Link href="/organizer-demo" className="text-sm text-orange-600 hover:underline dark:text-orange-400">
          Dashboard
        </Link>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Performance</h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        Analytics are coming later. This demo route is only for navigation shell; there are no real metrics yet.
      </p>
    </main>
  );
}
