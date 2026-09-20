/**
 * Minimal fixed-window rate limiter for the AI routes.
 *
 * State lives in the module scope of a single serverless/edge instance, so this
 * is best-effort: it throttles a burst from one caller against one instance, it
 * does not give an exact global count across a fleet. It needs no extra
 * infrastructure, which is the tradeoff being made. Swap in a shared store
 * (Upstash, Convex, Redis) if you need a hard global guarantee.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Bound memory on a long-lived instance: a key is only interesting until its
// window closes, so drop expired ones whenever the map grows past this.
const MAX_TRACKED_KEYS = 10_000;

const prune = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the current window closes. */
  retryAfter: number;
};

export const rateLimit = (
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult => {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) prune(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfter: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfter,
  };
};

/**
 * Best-available caller identity for an unauthenticated request. Proxies append
 * to `x-forwarded-for`, so the client address is the first entry.
 */
export const clientIpFrom = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
};

export const tooManyRequests = (retryAfter: number) =>
  new Response(
    JSON.stringify({
      error: "Too many requests. Please wait a moment and try again.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
