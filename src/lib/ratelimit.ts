import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Server-side rate limiting via Upstash Redis.
 *
 * If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are not set,
 * `limit()` becomes a no-op that always allows the request. A single
 * console.warn is emitted on first use so misconfigured deploys are visible
 * in logs.
 *
 * Usage in a route handler:
 *
 *   const { success } = await rateLimit("checkout").limit(`user:${userId}`);
 *   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

type Limiter = {
  limit: (identifier: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

let warned = false;
function warnOnce() {
  if (warned) return;
  warned = true;
  console.warn(
    "[ratelimit] Upstash env not configured — rate limiting is disabled. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in production.",
  );
}

const noopLimiter: Limiter = {
  async limit() {
    warnOnce();
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  },
};

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const limiters = new Map<string, Limiter>();

type LimiterName = "checkout" | "webhook" | "location-suggest";

function buildLimiter(name: LimiterName): Limiter {
  const r = getRedis();
  if (!r) return noopLimiter;

  // Tunable per limiter. Generous defaults — tighten once we have real traffic.
  const config = (() => {
    switch (name) {
      case "checkout":
        return Ratelimit.slidingWindow(10, "1 m"); // 10 attempts/min/user
      case "webhook":
        return Ratelimit.slidingWindow(120, "1 m"); // 120/min/IP — Stripe bursts on retry
      case "location-suggest":
        return Ratelimit.slidingWindow(60, "1 m"); // 60/min/IP — Google Places quota guard
    }
  })();

  return new Ratelimit({
    redis: r,
    limiter: config,
    analytics: false,
    prefix: `evently:ratelimit:${name}`,
  });
}

export function rateLimit(name: LimiterName): Limiter {
  let l = limiters.get(name);
  if (!l) {
    l = buildLimiter(name);
    limiters.set(name, l);
  }
  return l;
}

/** Best-effort caller IP from common reverse-proxy headers. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
