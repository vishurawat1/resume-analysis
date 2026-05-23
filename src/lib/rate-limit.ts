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
}
