import { OrganizerEditForm } from "@/components/organizer/organizer-edit-form";

type Props = { params: Promise<{ id: string }> };

export default async function OrganizerDemoEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <main>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Edit event</h1>
      <div className="mt-10">
        <OrganizerEditForm eventId={id} />
      </div>
    </main>
  );
}
