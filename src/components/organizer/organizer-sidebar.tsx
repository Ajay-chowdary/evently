"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppWindow,
  CircleHelp,
  ClipboardList,
  Gauge,
  Home,
  Landmark,
  Megaphone,
  Settings,
  SquareChartGantt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/organizer-demo", label: "Home", icon: Home },
  { href: "/organizer-demo/events", label: "Events", icon: ClipboardList },
  { href: "/organizer-demo/orders", label: "Orders", icon: SquareChartGantt },
  { href: "/organizer-demo/marketing", label: "Marketing", icon: Megaphone },
  { href: "/organizer-demo/reports", label: "Reports", icon: Gauge },
  { href: "/organizer-demo/finance", label: "Finance", icon: Landmark },
  { href: "/organizer-demo/settings", label: "Settings", icon: Settings },
];

const bottomItems = [
  { href: "/organizer-demo/apps", label: "Apps", icon: AppWindow },
  { href: "/help", label: "Help", icon: CircleHelp },
];

function isActive(pathname: string, href: string) {
  if (href === "/organizer-demo/events") {
    return pathname === "/organizer-demo" || pathname.startsWith("/organizer-demo/events");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OrganizerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/organizer-demo/events" aria-label="Organizer events" className="text-lg font-extrabold text-orange-600">
          E
        </Link>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2 py-4" aria-label="Organizer navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                active && "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col items-center gap-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                  active && "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
