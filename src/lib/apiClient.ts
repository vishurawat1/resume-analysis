"use client";

import { auth } from "@/lib/firebase";

export const USAGE_UPDATED_EVENT = "resume-ai-usage-updated";
export const QUOTA_EXCEEDED_EVENT = "resume-ai-quota-exceeded";

export interface QuotaExceededDetail {
  plan?: string;
  creditsUsed?: number;
  creditsLimit?: number;
  message?: string;
}

/** Dispatches a live event so UI badges refresh credit counts immediately. */
export function notifyUsageUpdated(detail?: { creditsRemaining?: number; plan?: string }): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(USAGE_UPDATED_EVENT, { detail }));
}

/**
 * Authenticated fetch wrapper that attaches the active user's Firebase ID token
 * and broadcasts plan credit updates / 402 upgrade triggers across the dashboard.
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);

  if (!headers.has("Authorization") && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch {
      // Proceed cleanly; server rejects missing auth with 401 if required
    }
  }

  const res = await fetch(input, { ...init, headers });

  if (typeof window !== "undefined") {
    const remainingHeader = res.headers.get("X-Credits-Remaining");
    const planHeader = res.headers.get("X-Plan-Id");
    if (remainingHeader !== null || planHeader !== null) {
      notifyUsageUpdated({
        creditsRemaining: remainingHeader !== null ? Number(remainingHeader) : undefined,
        plan: planHeader || undefined,
      });
    }

    if (res.status === 402) {
      try {
        const clone = res.clone();
        const data = (await clone.json()) as QuotaExceededDetail & { error?: string };
        window.dispatchEvent(
          new CustomEvent<QuotaExceededDetail>(QUOTA_EXCEEDED_EVENT, {
            detail: {
              plan: data.plan,
              creditsUsed: data.creditsUsed,
              creditsLimit: data.creditsLimit,
              message: data.error,
            },
          })
        );
      } catch {
        window.dispatchEvent(new CustomEvent<QuotaExceededDetail>(QUOTA_EXCEEDED_EVENT, { detail: {} }));
      }
    }
  }

  return res;
}
