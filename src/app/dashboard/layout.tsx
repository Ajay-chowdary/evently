import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 sm:px-8">
      <nav className="mb-10 flex flex-wrap items-center gap-4 border-b border-zinc-200 pb-6 text-sm font-medium dark:border-zinc-800">
        <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          My events
        </Link>
        <Link
          href="/dashboard/create"
          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Create event
        </Link>
        <Link href="/events" className="ml-auto text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
          Browse public events
        </Link>
      </nav>
      {children}
    </div>
  );
}
