"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseBrowserEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = requireSupabaseBrowserEnv();
  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}
