"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronDown, Heart, MapPin, Plus, Search, SunMoon, Ticket, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { MOCK_CATALOG } from "@/lib/public-env";
import { getMockSearchSuggestions } from "@/lib/mock-db/search-suggestions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { RoleSwitchButton, useHydratedRoleMode } from "@/components/role-switch-button";

type HeaderUser = {
  id: string;
  email: string;
  name: string | null;
} | null;

export function SiteHeader({ currentUser }: { currentUser: HeaderUser }) {
  const pathname = usePathname();
  const isOrganizerConsole = pathname.startsWith("/organizer-demo") || pathname.startsWith("/dashboard");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const userEmail = currentUser?.email ?? "";
  const createHref = MOCK_CATALOG ? "/organizer-demo/create" : "/dashboard/create";
  const ticketsHref = MOCK_CATALOG ? "/bookings" : "/account/tickets";
  const organizerHomeHref = MOCK_CATALOG ? "/organizer-demo" : "/dashboard";
  const attendingHomeHref = "/attending";
  const roleMode = useHydratedRoleMode();
  const isOrganizing = roleMode === "organizing";

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

  useEffect(() => {
    if (!MOCK_CATALOG) return;
    const term = query.trim();
    if (!term) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const handle = window.setTimeout(() => {
      const next = getMockSearchSuggestions(term, 5);
      setSuggestions(next);
      setShowSuggestions(next.length > 0);
    }, 150);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  if (isOrganizerConsole) {
    return null;
  }

  return (
    <>
      <header className="pointer-events-none fixed left-0 right-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="pointer-events-auto relative mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 sm:h-14">
          <Link
            href="/"
            className="shrink-0 flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-semibold tracking-tight text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:text-white dark:focus-visible:ring-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
              E
            </span>
            <span className="hidden sm:inline">Evently</span>
          </Link>

          <div
            ref={searchRef}
            className="absolute left-1/2 top-1/2 w-[min(calc(100vw-12rem),24rem)] -translate-x-1/2 -translate-y-1/2"
          >
            <nav
              className="flex items-center gap-0.5 overflow-hidden rounded-full border border-zinc-200/80 bg-zinc-950 px-1 py-1 text-zinc-50 shadow-lg ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-white/10"
              aria-label="Search and site controls"
            >
              <form
                className="flex min-w-0 flex-1 items-center gap-1 px-1 sm:gap-1.5 sm:px-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const q = query.trim();
                  const city = String(fd.get("city") ?? "").trim();
                  const params = new URLSearchParams();
                  if (q) params.set("q", q);
                  if (city) params.set("city", city);
                  const search = params.toString();
                  setShowSuggestions(false);
                  router.push(search ? `/events?${search}` : "/events");
                }}
              >
                <Search className="h-3.5 w-3.5 shrink-0 opacity-70 sm:h-4 sm:w-4" aria-hidden />
                <input
                  type="search"
                  name="q"
                  placeholder="Search events"
                  aria-label="Search events"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="min-w-0 w-16 bg-transparent text-xs font-medium placeholder:text-white/50 focus:outline-none sm:w-28 sm:text-sm dark:placeholder:text-zinc-500 dark:text-zinc-900"
                />
                <span className="h-4 w-px shrink-0 bg-white/20 dark:bg-zinc-900/15" aria-hidden />
                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70 sm:h-4 sm:w-4" aria-hidden />
                <input
                  type="text"
                  name="city"
                  placeholder="Location"
                  aria-label="City or location"
                  className="min-w-0 w-14 bg-transparent text-xs font-medium placeholder:text-white/50 focus:outline-none sm:w-24 sm:text-sm dark:placeholder:text-zinc-500 dark:text-zinc-900"
                />
                <button
                  type="submit"
                  className="ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:bg-red-600 dark:hover:bg-red-700"
                  aria-label="Run search"
                >
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </button>
              </form>
              <span className="mx-0.5 h-5 w-px shrink-0 bg-white/20 dark:bg-zinc-900/15" aria-hidden />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full text-zinc-50 hover:bg-white/10 dark:text-zinc-900 dark:hover:bg-zinc-900/10"
                onClick={toggleTheme}
                aria-label="Toggle color theme"
              >
                <SunMoon className="h-4 w-4" aria-hidden />
              </Button>
            </nav>
            {MOCK_CATALOG && showSuggestions ? (
              <ul className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                {suggestions.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("q", name);
                        setQuery(name);
                        setShowSuggestions(false);
                        router.push(`/events?${params.toString()}`);
                      }}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 text-zinc-900 dark:text-zinc-50 sm:gap-1">
            {isOrganizing ? (
              <>
                <Button variant="ghost" className="hidden rounded-full px-2 lg:inline-flex" asChild>
                  <Link href={createHref} className="gap-1.5 text-sm font-medium">
                    <Plus className="h-5 w-5" aria-hidden />
                    Create
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full lg:hidden" asChild>
                  <Link href={createHref} aria-label="Create an event">
                    <Plus className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" className="hidden rounded-full px-2 lg:inline-flex" asChild>
                  <Link href={organizerHomeHref} className="gap-1.5 text-sm font-medium">
                    <Ticket className="h-5 w-5" aria-hidden />
                    Manage events
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full lg:hidden" asChild>
                  <Link href={organizerHomeHref} aria-label="Manage my events">
                    <Ticket className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="hidden rounded-full px-2 lg:inline-flex" asChild>
                  <Link href={MOCK_CATALOG ? "/saved" : "/account/saved"} className="gap-1.5 text-sm font-medium">
                    <Heart className="h-5 w-5" aria-hidden />
                    Likes
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full lg:hidden" asChild>
                  <Link href={MOCK_CATALOG ? "/saved" : "/account/saved"} aria-label="Likes and saved events">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" className="hidden rounded-full px-2 lg:inline-flex" asChild>
                  <Link href={ticketsHref} className="gap-1.5 text-sm font-medium">
                    <Ticket className="h-5 w-5" aria-hidden />
                    Tickets
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full lg:hidden" asChild>
                  <Link href={ticketsHref} aria-label="My tickets">
                    <Ticket className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            )}
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden max-w-[11rem] gap-1 rounded-full px-2 lg:inline-flex"
                    aria-label="Account menu"
                  >
                    <UserRound className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="truncate text-sm font-medium">{userEmail}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</div>
                  <DropdownMenuSeparator />
                  <div className="px-1 py-0.5">
                    <RoleSwitchButton variant="menu" />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={isOrganizing ? organizerHomeHref : attendingHomeHref}>
                      {isOrganizing ? "Organizer dashboard" : "My attending dashboard"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={MOCK_CATALOG ? "/saved" : "/account/saved"}>Likes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookings">Bookings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ticketsHref}>Tickets</Link>
                  </DropdownMenuItem>
                  {MOCK_CATALOG ? (
                    <DropdownMenuItem asChild>
                      <Link href="/organizer-demo">Organizer demo</Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={signingOut} onSelect={signOutNow}>
                    {signingOut ? "Signing out..." : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="hidden rounded-full lg:inline-flex" asChild>
                <Link href="/auth/signin" aria-label="Sign in">
                  <UserRound className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open account menu"
            >
              <UserRound className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent className="gap-6" aria-describedby={undefined}>
          <SheetTitle className="text-left">Account</SheetTitle>
          <nav className="flex flex-col" aria-label="Primary">
            <div className="pb-4">
              <RoleSwitchButton variant="inline" onAfterSwitch={() => setMenuOpen(false)} />
            </div>
            <div className="flex flex-col gap-1 border-t border-zinc-200 py-4 dark:border-zinc-800">
              <Link
                href="/events"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900",
                  pathname === "/events" && "bg-zinc-100 dark:bg-zinc-900",
                )}
              >
                Browse events
              </Link>
              <Link
                href={attendingHomeHref}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900",
                  pathname === attendingHomeHref && "bg-zinc-100 dark:bg-zinc-900",
                )}
              >
                Attending
              </Link>
              <Link
                href={organizerHomeHref}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900",
                  (pathname === "/organizer-demo" || pathname === "/dashboard") && "bg-zinc-100 dark:bg-zinc-900",
                )}
              >
                Manage my events
              </Link>
              <Link
                href="/help"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900",
                  pathname === "/help" && "bg-zinc-100 dark:bg-zinc-900",
                )}
              >
                Get Help
              </Link>
            </div>

            <div className="border-t border-zinc-200 py-4 dark:border-zinc-800">
              <div className="flex flex-col gap-1">
                <Link
                  href="/bookings"
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900",
                    pathname === "/bookings" && "bg-zinc-100 dark:bg-zinc-900",
                  )}
                >
                  Tickets
                </Link>
                <Link
                  href={MOCK_CATALOG ? "/saved" : "/account/saved"}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900",
                    (pathname === "/saved" || pathname === "/account/saved") && "bg-zinc-100 dark:bg-zinc-900",
                  )}
                >
                  Liked
                </Link>
              </div>
            </div>

            {currentUser ? (
              <div className="border-t border-zinc-200 py-4 dark:border-zinc-800">
                <p className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">{userEmail}</p>
              </div>
            ) : null}

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              {currentUser ? (
                <button
                  type="button"
                  className="w-full rounded-xl px-4 py-3 text-left text-base font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  onClick={() => {
                    setMenuOpen(false);
                    signOutNow();
                  }}
                >
                  {signingOut ? "Signing out..." : "Log out"}
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900",
                      pathname === "/auth/signin" && "bg-zinc-100 dark:bg-zinc-900",
                    )}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900",
                      pathname === "/auth/signup" && "bg-zinc-100 dark:bg-zinc-900",
                    )}
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
