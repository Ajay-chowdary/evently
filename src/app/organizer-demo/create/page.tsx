import { OrganizerCreateForm } from "@/components/organizer/organizer-create-form";

export const metadata = { title: "Create event (demo)" };

export default function OrganizerDemoCreatePage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Create event</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Saved to this browser only.</p>
      <div className="mt-10">
        <OrganizerCreateForm />
      </div>
    </main>
  );
}
