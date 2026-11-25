import { NextRequest, NextResponse } from "next/server";
import { getCurrentPeriodKey, getPlanConfig, isValidPlanId, PlanId } from "./plans";
import { applyRateLimit } from "./rate-limit";
import { VerifiedRequestUser, verifyRequestUser } from "./serverAuth";

const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "";

export interface UserQuotaStatus {
  uid: string;
  plan: PlanId;
  planName: string;
  periodKey: string;
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  maxSavedScans: number;
}

// Fast per-process mirror prevents rapid concurrent bursts before Firestore settles
const usageMirror = new Map<string, { periodKey: string; creditsUsed: number; updatedAtMs: number }>();
const planMirror = new Map<string, { plan: PlanId; fetchedAtMs: number }>();
const PLAN_CACHE_TTL_MS = 60_000;

function firestoreDocUrl(uid: string, docName: "billing" | "usage"): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    FIREBASE_PROJECT_ID
  )}/databases/(default)/documents/users/${encodeURIComponent(uid)}/data/${docName}`;
}

function readFirestoreString(fields: Record<string, Record<string, unknown>> | undefined, key: string): string | null {
  const val = fields?.[key]?.stringValue;
  return typeof val === "string" ? val : null;
}

function readFirestoreInt(fields: Record<string, Record<string, unknown>> | undefined, key: string): number | null {
  const raw = fields?.[key]?.integerValue ?? fields?.[key]?.doubleValue;
  if (raw === undefined || raw === null) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? Math.floor(num) : null;
}

async function fetchUserFirestoreDoc(
  uid: string,
  docName: "billing" | "usage",
  idToken: string
): Promise<Record<string, Record<string, unknown>> | null> {
  try {
    const res = await fetch(firestoreDocUrl(uid, docName), {
      method: "GET",
      headers: { Authorization: `Bearer ${idToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { fields?: Record<string, Record<string, unknown>> };
    return json.fields ?? null;
  } catch {
    return null;
  }
}

async function writeUsageDoc(
  uid: string,
  idToken: string,
  periodKey: string,
  creditsUsed: number
): Promise<void> {
  const nowIso = new Date().toISOString();
  try {
    await fetch(
      `${firestoreDocUrl(uid, "usage")}?updateMask.fieldPaths=periodKey&updateMask.fieldPaths=creditsUsed&updateMask.fieldPaths=updatedAt`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            periodKey: { stringValue: periodKey },
            creditsUsed: { integerValue: String(Math.max(0, Math.floor(creditsUsed))) },
            updatedAt: { stringValue: nowIso },
          },
        }),
        signal: AbortSignal.timeout(4500),
      }
    );
  } catch (err) {
    console.warn("[usageMeter] Non-blocking Firestore usage persist warning:", err);
  }
}

export async function getUserQuotaStatus(user: VerifiedRequestUser): Promise<UserQuotaStatus> {
  const periodKey = getCurrentPeriodKey();

  // Check cached plan briefly unless forced
  let plan: PlanId = "free";
  const cachedPlan = planMirror.get(user.uid);
  const now = Date.now();

  let billingFields: Record<string, Record<string, unknown>> | null = null;
  if (cachedPlan && now - cachedPlan.fetchedAtMs < PLAN_CACHE_TTL_MS) {
    plan = cachedPlan.plan;
  } else {
    billingFields = await fetchUserFirestoreDoc(user.uid, "billing", user.idToken);
    const rawPlan = readFirestoreString(billingFields ?? undefined, "plan");
    if (isValidPlanId(rawPlan)) {
      plan = rawPlan;
    }
    planMirror.set(user.uid, { plan, fetchedAtMs: now });
  }

  const planDef = getPlanConfig(plan);
  const customLimit = readFirestoreInt(billingFields ?? undefined, "creditsLimit");
  const creditsLimit = customLimit && customLimit > 0 ? customLimit : planDef.creditsPerMonth;

  const usageFields = await fetchUserFirestoreDoc(user.uid, "usage", user.idToken);
  const storedPeriod = readFirestoreString(usageFields ?? undefined, "periodKey");
  const storedUsed = storedPeriod === periodKey ? readFirestoreInt(usageFields ?? undefined, "creditsUsed") ?? 0 : 0;

  const localMirror = usageMirror.get(user.uid);
  const mirrorUsed = localMirror && localMirror.periodKey === periodKey ? localMirror.creditsUsed : 0;

  const creditsUsed = Math.max(0, storedUsed, mirrorUsed);
  usageMirror.set(user.uid, { periodKey, creditsUsed, updatedAtMs: now });

  return {
    uid: user.uid,
    plan,
    planName: planDef.name,
    periodKey,
    creditsUsed,
    creditsLimit,
    creditsRemaining: Math.max(0, creditsLimit - creditsUsed),
    maxSavedScans: planDef.maxSavedScans,
  };
}

export function buildQuotaHeaders(status: UserQuotaStatus): Record<string, string> {
  return {
    "X-Plan-Id": status.plan,
    "X-Credits-Used": String(status.creditsUsed),
    "X-Credits-Limit": String(status.creditsLimit),
    "X-Credits-Remaining": String(status.creditsRemaining),
  };
}

export interface MeteredRequestSuccess {
  ok: true;
  user: VerifiedRequestUser;
  quota: UserQuotaStatus;
  consume: (cost?: number) => Promise<UserQuotaStatus>;
}

export interface MeteredRequestFailure {
  ok: false;
  response: NextResponse;
}

export async function authorizeMeteredRequest(
  req: NextRequest,
  options: { bucket: string; cost?: number; rateLimit?: number }
): Promise<MeteredRequestSuccess | MeteredRequestFailure> {
  const user = await verifyRequestUser(req);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Authentication required. Please sign in to use AI analysis and optimization features.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      ),
    };
  }

  const rateLimited = applyRateLimit(req, {
    bucket: options.bucket,
    identityKey: user.uid,
    limit: options.rateLimit ?? 35,
  });
  if (rateLimited) {
    return { ok: false, response: rateLimited };
  }

  const cost = options.cost ?? 1;
  const quota = await getUserQuotaStatus(user);

  if (cost > 0 && quota.creditsUsed + cost > quota.creditsLimit) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Monthly AI credit limit reached (${quota.creditsUsed}/${quota.creditsLimit} used on ${quota.planName}). Upgrade your plan for higher monthly capacity.`,
          code: "QUOTA_EXCEEDED",
          plan: quota.plan,
          creditsUsed: quota.creditsUsed,
          creditsLimit: quota.creditsLimit,
          upgradeUrl: "/pricing",
        },
        { status: 402, headers: buildQuotaHeaders(quota) }
      ),
    };
  }

  let consumed = false;
  const consume = async (actualCost = cost): Promise<UserQuotaStatus> => {
    if (consumed || actualCost <= 0) return quota;
    consumed = true;
    const nextUsed = quota.creditsUsed + actualCost;
    const updated: UserQuotaStatus = {
      ...quota,
      creditsUsed: nextUsed,
      creditsRemaining: Math.max(0, quota.creditsLimit - nextUsed),
    };
    usageMirror.set(user.uid, {
      periodKey: quota.periodKey,
      creditsUsed: nextUsed,
      updatedAtMs: Date.now(),
    });
    await writeUsageDoc(user.uid, user.idToken, quota.periodKey, nextUsed);
    return updated;
  };

  return { ok: true, user, quota, consume };
}

/** Updates a user's billing mirror immediately (used by admin/webhook flows). */
export function invalidatePlanCache(uid: string): void {
  planMirror.delete(uid);
}
