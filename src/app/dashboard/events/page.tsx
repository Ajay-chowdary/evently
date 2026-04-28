import { redirect } from "next/navigation";
import { isMockCatalog } from "@/lib/data-source";

type Props = { searchParams: Promise<{ saved?: string; pub?: string }> };

export default async function DashboardEventsPage({ searchParams }: Props) {
  const q = await searchParams;
  const sp = new URLSearchParams();
  if (q.saved) sp.set("saved", q.saved);
  if (q.pub === "1") sp.set("pub", "1");
  const tail = sp.toString() ? `?${sp.toString()}` : "";

  if (isMockCatalog()) {
    redirect(`/organizer-demo${tail}`);
  }

  redirect("/dashboard");
}
