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

type AuthSyncUser = AppSession["user"];

function normalizeDisplayName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function organizerHandleSeed(email: string, name: string | null) {
  const raw = (name ?? email.split("@")[0] ?? "evently-organizer").toLowerCase();
  const normalized = raw
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return normalized || "evently-organizer";
}

function buildFallbackUser(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthSyncUser | null {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) {
    return null;
  }

  const displayName =
    normalizeDisplayName(authUser.user_metadata?.full_name) ??
    normalizeDisplayName(authUser.user_metadata?.name);

  return {
    id: authUser.id,
    authUserId: authUser.id,
    email,
    name: displayName,
    role: "ATTENDEE",
  };
}

function isDatabaseConnectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PrismaClientInitializationError" ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("PrismaClientInitializationError")
  );
}

async function ensureOrganizerForUser(
  prisma: Awaited<typeof import("@/lib/db")>["prisma"],
  user: AuthSyncUser,
) {
  const existingOrganizer = await prisma.organizer.findUnique({
    where: { id: user.id },
    select: { id: true },
  });

  if (!existingOrganizer) {
    const baseHandle = organizerHandleSeed(user.email, user.name);
    let handle = baseHandle;
    let suffix = 1;

    while (await prisma.organizer.findUnique({ where: { handle }, select: { id: true } })) {
      suffix += 1;
      handle = `${baseHandle}-${suffix}`;
    }

    await prisma.organizer.create({
      data: {
        id: user.id,
        handle,
        name: user.name ?? user.email.split("@")[0] ?? "Evently organizer",
        contactEmail: user.email,
      },
    });
  }

  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
    return prisma.user.update({
      where: { id: user.id },
      data: { role: "ORGANIZER" },
    });
  }

  return user;
}

async function syncAppUser(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const fallbackUser = buildFallbackUser(authUser);
  if (!fallbackUser) {
    return null;
  }

  if (!hasDatabaseUrl()) {
    return fallbackUser;
  }

  try {
    const { prisma } = await import("@/lib/db");

    const preferredName =
      normalizeDisplayName(authUser.user_metadata?.full_name) ??
      normalizeDisplayName(authUser.user_metadata?.name);

    const existingByAuthUserId = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
    });

    if (existingByAuthUserId) {
      const user = await prisma.user.update({
        where: { id: existingByAuthUserId.id },
        data: {
          email: fallbackUser.email,
          name: preferredName ?? existingByAuthUserId.name,
        },
      });
      return ensureOrganizerForUser(prisma, user);
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email: fallbackUser.email },
    });

    if (existingByEmail) {
      const user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          authUserId: authUser.id,
          name: preferredName ?? existingByEmail.name,
        },
      });
      return ensureOrganizerForUser(prisma, user);
    }

    const user = await prisma.user.create({
      data: {
        authUserId: authUser.id,
        email: fallbackUser.email,
        name: preferredName,
      },
    });
    return ensureOrganizerForUser(prisma, user);
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return fallbackUser;
    }
    throw error;
  }
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
