import { createPublicKey, verify, type JsonWebKey as NodeJsonWebKey, type KeyObject } from "node:crypto";
import { NextRequest } from "next/server";

const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "";

const JWK_ENDPOINT =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export interface VerifiedRequestUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  idToken: string;
}

interface CachedJwks {
  keys: Map<string, KeyObject>;
  expiresAt: number;
}

let cachedJwks: CachedJwks | null = null;

function decodeBase64UrlJson<T>(segment: string): T | null {
  try {
    const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

async function getFirebasePublicKeys(): Promise<Map<string, KeyObject>> {
  const now = Date.now();
  if (cachedJwks && now < cachedJwks.expiresAt && cachedJwks.keys.size > 0) {
    return cachedJwks.keys;
  }

  const res = await fetch(JWK_ENDPOINT, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    if (cachedJwks?.keys.size) return cachedJwks.keys;
    throw new Error(`Failed to fetch Firebase JWKS (${res.status})`);
  }

  const body = (await res.json()) as { keys?: Array<NodeJsonWebKey & { kid?: string }> };
  const keyMap = new Map<string, KeyObject>();
  for (const jwk of body.keys || []) {
    if (jwk.kid) {
      try {
        keyMap.set(jwk.kid, createPublicKey({ key: jwk, format: "jwk" }));
      } catch {
        // Skip malformed key entry
      }
    }
  }

  const cc = res.headers.get("cache-control") || "";
  const maxAgeMatch = /max-age=(\d+)/i.exec(cc);
  const ttlMs = maxAgeMatch ? Math.max(60, Number(maxAgeMatch[1])) * 1000 : 1000 * 60 * 60;

  if (keyMap.size > 0) {
    cachedJwks = { keys: keyMap, expiresAt: now + ttlMs };
  }
  return keyMap;
}

export function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return null;
  const match = /^Bearer\s+([^\s]+)$/i.exec(authHeader.trim());
  return match ? match[1] : null;
}

/**
 * Cryptographically verifies a Firebase ID JWT using Google's official RS256 JWK keys.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedRequestUser | null> {
  if (!FIREBASE_PROJECT_ID) return null;
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;

  const [headerSeg, payloadSeg, sigSeg] = parts;
  const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(headerSeg);
  const payload = decodeBase64UrlJson<{
    aud?: string;
    iss?: string;
    sub?: string;
    user_id?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    exp?: number;
    iat?: number;
    auth_time?: number;
  }>(payloadSeg);

  if (!header || !payload || header.alg !== "RS256" || !header.kid) {
    return null;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  const uid = payload.sub || payload.user_id || "";

  if (
    payload.aud !== FIREBASE_PROJECT_ID ||
    payload.iss !== expectedIssuer ||
    !uid ||
    uid.length > 128 ||
    typeof payload.exp !== "number" ||
    payload.exp <= nowSec - 30 ||
    typeof payload.iat !== "number" ||
    payload.iat > nowSec + 300
  ) {
    return null;
  }

  const keys = await getFirebasePublicKeys();
  const keyObj = keys.get(header.kid);
  if (!keyObj) return null;

  const signedContent = Buffer.from(`${headerSeg}.${payloadSeg}`, "utf8");
  const signature = Buffer.from(sigSeg.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  const valid = verify("RSA-SHA256", signedContent, keyObj, signature);
  if (!valid) return null;

  return {
    uid,
    email: typeof payload.email === "string" ? payload.email : "",
    emailVerified: Boolean(payload.email_verified),
    name: typeof payload.name === "string" ? payload.name : undefined,
    idToken,
  };
}

/** Authenticates an incoming NextRequest via Bearer Firebase ID token. */
export async function verifyRequestUser(req: NextRequest): Promise<VerifiedRequestUser | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  try {
    return await verifyFirebaseIdToken(token);
  } catch (err) {
    console.warn("[serverAuth] Token verification error:", err);
    return null;
  }
}

/** Checks if an unauthenticated request originates from the app's own browser origin. */
export function isSameOriginBrowserRequest(req: NextRequest): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin") return true;

  const host = req.headers.get("host");
  const origin = req.headers.get("origin");
  if (host && origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  return false;
}
