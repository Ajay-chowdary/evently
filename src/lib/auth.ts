import { cache } from "react";
import { hasDatabaseUrl, hasSupabaseBrowserEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppSession = {
  user: {
    id: string;
    authUserId: string;
    email: string;
    name: string | null;
    role: string;
  };
};

function normalizeDisplayName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

async function syncAppUser(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) {
    return null;
  }

  if (!hasDatabaseUrl()) {
    const displayName =
      normalizeDisplayName(authUser.user_metadata?.full_name) ??
      normalizeDisplayName(authUser.user_metadata?.name);
    return {
      id: authUser.id,
      authUserId: authUser.id,
      email,
      name: displayName,
      role: "ATTENDEE" as const,
    };
  }

  const { prisma } = await import("@/lib/db");

  const preferredName =
    normalizeDisplayName(authUser.user_metadata?.full_name) ??
    normalizeDisplayName(authUser.user_metadata?.name);

  const existingByAuthUserId = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
  });

  if (existingByAuthUserId) {
    return prisma.user.update({
      where: { id: existingByAuthUserId.id },
      data: {
        email,
        name: preferredName ?? existingByAuthUserId.name,
      },
    });
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        authUserId: authUser.id,
        name: preferredName ?? existingByEmail.name,
      },
    });
  }

  return prisma.user.create({
    data: {
      authUserId: authUser.id,
      email,
      name: preferredName,
    },
  });
}

export const auth = cache(async (): Promise<AppSession | null> => {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const user = await syncAppUser(authUser);
  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }
  return session;
}
