import { NextRequest, NextResponse } from "next/server";

interface RateLimitData {
  count: number;
  resetTime: number;
}

// Simple in-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitData>();

const LIMIT = 50; // Max 50 attempts per 15 minutes
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function applyRateLimit(req: NextRequest) {
  // Use a fallback IP since Vercel forwards the real IP via headers
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const now = Date.now();
  
  const record = rateLimitStore.get(ip);
  
  if (!record) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return null; // Allowed
  }
  
  // If window has expired, reset
  if (now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return null; // Allowed
  }
  
  // Increment count
  record.count += 1;
  rateLimitStore.set(ip, record);
  
  if (record.count > LIMIT) {
    return NextResponse.json(
      { error: "Too many requests detected. Please try again after 15 minutes to protect API quotas." },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString()
        }
      }
    );
  }
  
  return null; // Allowed
}
