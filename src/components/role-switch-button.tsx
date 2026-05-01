"use client";

import { ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserRoleStore, type UserRoleMode } from "@/stores/user-role-store";

const HOME_FOR_MODE: Record<UserRoleMode, string> = {
  attending: "/attending",
  organizing: "/organizer-demo",
};

export function useHydratedRoleMode(): UserRoleMode {
  const mode = useUserRoleStore((s) => s.mode);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? mode : "attending";
}

export function RoleSwitchButton({
  variant = "inline",
  onAfterSwitch,
}: {
  variant?: "inline" | "menu";
  onAfterSwitch?: () => void;
}) {
  const router = useRouter();
  const mode = useHydratedRoleMode();
  const setMode = useUserRoleStore((s) => s.setMode);

  const nextMode: UserRoleMode = mode === "attending" ? "organizing" : "attending";
  const label = nextMode === "attending" ? "Switch to attending" : "Switch to organizing";

  const handleClick = () => {
    setMode(nextMode);
    router.push(HOME_FOR_MODE[nextMode]);
    onAfterSwitch?.();
  };

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        <ArrowLeftRight className="size-4" aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleClick}
      className="rounded-full border border-zinc-300 bg-white text-zinc-900 shadow-none hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
    >
      <ArrowLeftRight className="mr-2 size-4" aria-hidden />
      {label}
    </Button>
  );
}
