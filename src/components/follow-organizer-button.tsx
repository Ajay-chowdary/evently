"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleOrganizerFollow } from "@/actions/organizer-follow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FollowOrganizerButton({
  organizerId,
  eventSlug,
  initialFollowing,
  signedIn,
}: {
  organizerId: string;
  eventSlug: string;
  initialFollowing: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (!signedIn) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/events/${eventSlug}`)}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await toggleOrganizerFollow(organizerId, eventSlug);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.following !== null) {
        setFollowing(res.following);
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={onClick}
      className={cn(
        "rounded-md border border-zinc-300 bg-white px-4 font-medium text-zinc-900 shadow-none hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
        following && "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
      )}
    >
      {following ? "Following" : "Follow"}
    </Button>
    {error ? (
      <p className="text-xs text-red-600 dark:text-red-400" role="alert">
        {error}
      </p>
    ) : null}
    </div>
  );
}
