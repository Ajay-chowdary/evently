import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Supabase Storage public URLs (any project)
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Google OAuth avatars
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

// Wrapping is a no-op for runtime when SENTRY_DSN is unset; sourcemap upload
// during build is also skipped without SENTRY_AUTH_TOKEN.
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
  // Delete the .map files from the bundle after upload so we don't serve them.
  sourcemaps: {
    filesToDeleteAfterUpload: ["./.next/**/*.map"],
  },
});
