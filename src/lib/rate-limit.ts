import { NextRequest, NextResponse } from "next/server";

interface RateLimitData {
  count: number;
  resetTime: number;
}

// Simple in-memory store (Note: In a true multi-server/serverless environment, 
// this resets per instance. For production, Redis like Upstash is recommended).
const rateLimitStore = new Map<string, RateLimitData>();

const LIMIT = 5; // Max 5 attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function applyRateLimit(req: NextRequest) {
  // Rate limiting disabled per user request since Groq has high quota
  return null;
  const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
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
      { error: "Too many requests. Please try again after 15 minutes." },
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
