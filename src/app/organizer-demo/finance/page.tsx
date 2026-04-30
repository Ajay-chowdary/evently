const financeTabs = ["Payouts", "Charges & Credits", "Invoices", "Settings"];

export default function OrganizerFinancePage() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Finance</h1>
      </div>

      <div className="flex flex-wrap items-center gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {financeTabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            disabled={index !== 0}
            className={index === 0 ? "border-b-2 border-blue-600 pb-2 text-sm font-semibold text-blue-700 dark:text-blue-300" : "pb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400"}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[220px,1fr]">
        <div className="space-y-2">
          <div className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Summary</div>
          <div className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">Upcoming</div>
          <div className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">Exports</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          You do not have any payouts yet.
        </div>
      </div>
    </main>
  );
}
