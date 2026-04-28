import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function CategoryRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/events?type=${encodeURIComponent(slug)}`);
}
