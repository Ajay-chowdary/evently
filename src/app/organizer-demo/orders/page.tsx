import { Button } from "@/components/ui/button";

export default function OrganizerOrdersPage() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Order Management</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Manage all orders, including editing buyer info, resending tickets, and processing refunds.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          type="text"
          placeholder="Search order number, email, or name"
          className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <select className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          <option>Search by Buyer</option>
        </select>
        <select className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          <option>Past 3 months</option>
        </select>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <Button className="rounded-md bg-orange-600 hover:bg-orange-700">Load all orders</Button>
        <p className="mt-5 text-sm text-zinc-500 dark:text-zinc-400">
          For faster results, apply filters if you have a large number of events.
        </p>
      </div>
    </main>
  );
}
