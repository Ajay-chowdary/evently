import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseBrowserEnv, requireSupabaseBrowserEnv } from "@/lib/env";

const PROTECTED_PREFIXES = ["/account", "/dashboard", "/bookings", "/tickets"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function updateSupabaseSession(request: NextRequest) {
  if (!hasSupabaseBrowserEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = requireSupabaseBrowserEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    const callback = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    url.searchParams.set("callbackUrl", callback);
    return NextResponse.redirect(url);
  }

  return response;
}
