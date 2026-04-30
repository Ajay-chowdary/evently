const tabs = ["Organizer Profile", "Team Management", "Ticket Fees", "Plan Management", "App Extensions"];

export default function OrganizerSettingsPage() {
  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">ORGANIZER</p>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Organization Settings</h1>
      </div>

      <div className="flex flex-wrap items-center gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {tabs.map((tab, index) => (
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

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Organizer profiles</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Each profile describes a unique organizer and shows all of their events on one page.
        </p>
        <div className="flex justify-end">
          <button type="button" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
            Add organizer profile
          </button>
        </div>
      </section>
    </main>
  );
}
