import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function OrganizerDemoEditPage({ params }: Props) {
  const { id } = await params;
  redirect(`/organizer-demo/${id}/build`);
}
