import { NextRequest, NextResponse } from "next/server";

interface RateLimitData {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
  bucket?: string;
  identityKey?: string;
}

const rateLimitStore = new Map<string, RateLimitData>();
const DEFAULT_LIMIT = 45;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const MAX_STORE_ENTRIES = 5000;

function extractClientIp(req: NextRequest): string {
  const vercelIp = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelIp) return vercelIp;

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // Prefer the rightmost hop appended by the reverse proxy over client-spoofed prefix values
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (hops.length > 0) {
      return hops[hops.length - 1];
    }
  }

  return "local";
}

function pruneExpiredEntries(now: number): void {
  if (rateLimitStore.size < MAX_STORE_ENTRIES) return;
  for (const [k, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(k);
    }
  }
  // Evict oldest keys if still above cap under flood conditions
  while (rateLimitStore.size >= MAX_STORE_ENTRIES) {
    const firstKey = rateLimitStore.keys().next().value;
    if (!firstKey) break;
    rateLimitStore.delete(firstKey);
  }
}

export function applyRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): NextResponse | null {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const bucket = options.bucket ?? "global";
  const ip = extractClientIp(req);
  const subject = options.identityKey || ip;
  const key = `${bucket}:${subject}`;
  const now = Date.now();

  pruneExpiredEntries(now);

  const existing = rateLimitStore.get(key);
  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  if (existing.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please wait briefly before retrying to protect platform availability.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(existing.resetTime / 1000)),
        },
      }
    );
  }

  return null;
}
