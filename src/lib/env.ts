function trim(value: string | undefined): string {
  return value?.trim() ?? "";
}

function isPostgresUrl(value: string) {
  return value.startsWith("postgresql://") || value.startsWith("postgres://");
}

export const env = {
  appUrl: trim(process.env.NEXT_PUBLIC_APP_URL) || (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : "") || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000"),
  databaseUrl: trim(process.env.DATABASE_URL),
  directUrl: trim(process.env.DIRECT_URL),
  supabaseUrl: trim(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey:
    trim(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || trim(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseServiceRoleKey: trim(process.env.SUPABASE_SERVICE_ROLE_KEY),
  stripePublishableKey: trim(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  stripeSecretKey: trim(process.env.STRIPE_SECRET_KEY),
  stripeWebhookSecret: trim(process.env.STRIPE_WEBHOOK_SECRET),
  resendApiKey: trim(process.env.RESEND_API_KEY),
  googleMapsApiKey: trim(process.env.GOOGLE_MAPS_SERVER_KEY) || trim(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
  mockCatalog: trim(process.env.NEXT_PUBLIC_USE_MOCK_CATALOG) === "true",
};

export function hasSupabaseBrowserEnv() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

export function hasDatabaseUrl() {
  return isPostgresUrl(env.databaseUrl);
}

export function requireSupabaseBrowserEnv() {
  if (!hasSupabaseBrowserEnv()) {
    throw new Error("Missing Supabase browser environment variables.");
  }
  return {
    url: env.supabaseUrl,
    publishableKey: env.supabasePublishableKey,
  };
}

export function hasStripeEnv() {
  return Boolean(env.stripeSecretKey && env.stripePublishableKey);
}

export function hasResendEnv() {
  return Boolean(env.resendApiKey);
}

/**
 * When NEXT_PUBLIC_EVENTS_SOURCE=supabase and Supabase URL plus publishable key exist,
 * public /events and /events/[slug] read from Postgres via Supabase JS (RLS), even if
 * NEXT_PUBLIC_USE_MOCK_CATALOG is true for the rest of the app.
 */
export function shouldUseSupabasePublicEvents(): boolean {
  const src = trim(process.env.NEXT_PUBLIC_EVENTS_SOURCE).toLowerCase();
  return src === "supabase" && hasSupabaseBrowserEnv();
}
