import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/env";

export const runtime = "nodejs";
// Always run live — no caching for health checks.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Health = {
  ok: boolean;
  ts: string;
  uptimeSec: number;
  dbOk: boolean | null;
  commit: string | null;
};

const startedAt = Date.now();

export async function GET() {
  let dbOk: boolean | null = null;
  if (hasDatabaseUrl()) {
    try {
      // Cheapest possible query — round-trips the connection pool.
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
  }

  const body: Health = {
    ok: dbOk !== false,
    ts: new Date().toISOString(),
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    dbOk,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  };

  return NextResponse.json(body, { status: body.ok ? 200 : 503 });
}
