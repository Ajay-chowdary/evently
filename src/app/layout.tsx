import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Evently — discover local events",
    template: "%s — Evently",
  },
  description: "Find concerts, classes, markets, and community gatherings near you. Save favorites and browse by city.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="h-full"
    >
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          <SiteHeader currentUser={session?.user ?? null} />
          <div className="flex flex-1 flex-col pt-[4.5rem] sm:pt-24">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
