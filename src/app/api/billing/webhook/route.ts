import { createHmac, createSign, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPlanConfig, isValidPlanId, PlanId } from "@/lib/plans";
import { invalidatePlanCache } from "@/lib/usageMeter";

export const runtime = "nodejs";

const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "resume-analysis-bd6d0";

function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const parts = signatureHeader.split(",").map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1Sigs = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));

  if (!timestamp || v1Sigs.length === 0) return false;
  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum) || Math.abs(Math.floor(Date.now() / 1000) - tsNum) > 300) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");

  return v1Sigs.some((sig) => {
    try {
      const sigBuf = Buffer.from(sig, "hex");
      return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });
}

async function getFirebaseAdminAccessToken(): Promise<string | null> {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawJson) return null;

  const sa = JSON.parse(rawJson) as { client_email?: string; private_key?: string };
  if (!sa.client_email || !sa.private_key) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = signer.sign(sa.private_key).toString("base64url");
  const jwt = `${header}.${claim}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
    signal: AbortSignal.timeout(8000),
  });
  if (!tokenRes.ok) return null;
  const data = (await tokenRes.json()) as { access_token?: string };
  return data.access_token ?? null;
}

async function persistUserBillingViaAdmin(
  uid: string,
  planId: PlanId,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<boolean> {
  const accessToken = await getFirebaseAdminAccessToken();
  if (!accessToken) {
    console.warn("[billing/webhook] FIREBASE_SERVICE_ACCOUNT_KEY not configured; cannot persist plan upgrade.");
    return false;
  }

  const plan = getPlanConfig(planId);
  const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    FIREBASE_PROJECT_ID
  )}/databases/(default)/documents/users/${encodeURIComponent(uid)}/data/billing`;

  const res = await fetch(docUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        plan: { stringValue: plan.id },
        creditsLimit: { integerValue: String(plan.creditsPerMonth) },
        stripeCustomerId: { stringValue: stripeCustomerId || "" },
        stripeSubscriptionId: { stringValue: stripeSubscriptionId || "" },
        updatedAt: { stringValue: new Date().toISOString() },
      },
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (res.ok) {
    invalidatePlanCache(uid);
  }
  return res.ok;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sigHeader = req.headers.get("stripe-signature");

  if (!webhookSecret || !sigHeader) {
    return NextResponse.json(
      { error: "Webhook verification not configured or signature missing." },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  if (!verifyStripeSignature(rawBody, sigHeader, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: {
        object?: {
          client_reference_id?: string;
          customer?: string;
          subscription?: string;
          id?: string;
          status?: string;
          metadata?: { uid?: string; planId?: string };
        };
      };
    };

    const obj = event.data?.object;
    const uid = obj?.metadata?.uid || obj?.client_reference_id;
    const rawPlan = obj?.metadata?.planId;

    if (event.type === "checkout.session.completed" && uid && isValidPlanId(rawPlan)) {
      const ok = await persistUserBillingViaAdmin(uid, rawPlan, obj?.customer, obj?.subscription);
      if (!ok) {
        return NextResponse.json(
          { error: "Failed to persist subscription entitlement." },
          { status: 500 }
        );
      }
    } else if (event.type === "customer.subscription.deleted" && uid) {
      await persistUserBillingViaAdmin(uid, "free", obj?.customer, "");
    } else if (event.type === "customer.subscription.updated" && uid) {
      const activeStatuses = new Set(["active", "trialing"]);
      const nextPlan: PlanId =
        activeStatuses.has(obj?.status || "") && isValidPlanId(rawPlan) ? rawPlan : "free";
      await persistUserBillingViaAdmin(uid, nextPlan, obj?.customer, obj?.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[billing/webhook] Processing error:", err);
    return NextResponse.json({ error: "Malformed webhook payload." }, { status: 400 });
  }
}
