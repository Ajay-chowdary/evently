"use client";

import { useTransition } from "react";
import { deleteEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      className="rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this event? This cannot be undone.")) return;
        startTransition(async () => {
          try {
            const fd = new FormData();
            fd.set("id", eventId);
            const res = await deleteEvent(fd);
            if (res && "error" in res && res.error) {
              alert(res.error);
            }
          } catch {
            // redirect after delete
          }
        });
      }}
    >
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
