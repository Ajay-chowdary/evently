import { OrganizerDemoDashboard } from "@/components/organizer/organizer-demo-dashboard";

export const metadata = { title: "Organizer demo" };

type Props = { searchParams: Promise<{ saved?: string; pub?: string }> };

export default async function OrganizerDemoPage({ searchParams }: Props) {
  const q = await searchParams;
  return (
    <main>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Organizer demo</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Local-only event management. Nothing here touches your Prisma database.
      </p>
      <div className="mt-10">
        <OrganizerDemoDashboard highlightSlug={q.saved} highlightPublished={q.pub === "1"} />
      </div>
    </main>
  );
}
