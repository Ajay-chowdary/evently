import { auth } from "@/lib/auth";
import { OrganizerSidebar } from "@/components/organizer/organizer-sidebar";
import { OrganizerTopbar } from "@/components/organizer/organizer-topbar";

export default async function OrganizerDemoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="relative -mt-[4.5rem] min-h-screen bg-white sm:-mt-24 dark:bg-zinc-950">
      <OrganizerSidebar />
      <OrganizerTopbar currentUser={session?.user ?? null} />
      <div className="pl-16 pt-16">
        <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
