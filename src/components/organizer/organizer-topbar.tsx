"use client";

import Link from "next/link";
import { Bell, ChevronDown, Plus, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleSwitchButton } from "@/components/role-switch-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type HeaderUser = {
  id: string;
  email: string;
  name: string | null;
} | null;

export function OrganizerTopbar({ currentUser }: { currentUser: HeaderUser }) {
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();
  const displayName = currentUser?.name?.trim() || currentUser?.email || "Account";
  const initials = (displayName.slice(0, 2) || "AC").toUpperCase();

  const signOutNow = () => {
    startSignOut(async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
      } finally {
        router.replace("/");
        router.refresh();
      }
    });
  };

  return (
    <header className="fixed left-16 right-0 top-0 z-20 h-16 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6">
        <Link href="/organizer-demo/events" className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <span className="text-base font-extrabold text-orange-600">evently</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="rounded-full px-3 text-sm font-medium" asChild>
            <Link href="/organizer-demo/events">Updates</Link>
          </Button>

          <Button
            variant="outline"
            className="rounded-full border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/30"
            asChild
          >
            <Link href="/organizer-demo/create">
              <Plus className="h-4 w-4" aria-hidden />
              Create
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>

          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="max-w-[14rem] gap-2 rounded-full px-2" aria-label="Account menu">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
                    {initials}
                  </span>
                  <span className="truncate text-sm font-medium">{displayName}</span>
                  <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-1 py-0.5">
                  <RoleSwitchButton variant="menu" />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/help">Help Center</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/organizer-demo/settings">Account Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={signingOut} onSelect={signOutNow}>
                  {signingOut ? "Signing out..." : "Log out"}
                </DropdownMenuItem>
                <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">{currentUser.email}</div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="rounded-full" asChild>
              <Link href="/auth/signin" aria-label="Sign in">
                <UserRound className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
