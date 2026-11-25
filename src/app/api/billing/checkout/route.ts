import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/serverAuth";
import { applyRateLimit } from "@/lib/rate-limit";
import { BillingInterval, CurrencyCode, PLANS } from "@/lib/plans";

export const runtime = "nodejs";

function resolveStripePriceId(
  planId: "pro" | "elite",
  interval: BillingInterval,
  currency: CurrencyCode
): string | null {
  const upperPlan = planId.toUpperCase();
  const upperInt = interval.toUpperCase();
  const currencySpecific = process.env[`STRIPE_PRICE_${upperPlan}_${upperInt}_${currency}`];
  if (currencySpecific) return currencySpecific;
  return process.env[`STRIPE_PRICE_${upperPlan}_${upperInt}`] || null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in before upgrading your plan.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const rateLimited = applyRateLimit(req, {
      bucket: "checkout",
      identityKey: user.uid,
      limit: 20,
    });
    if (rateLimited) return rateLimited;

    const body = (await req.json()) as {
      planId?: string;
      interval?: BillingInterval;
      currency?: CurrencyCode;
    };

    const planId = body?.planId === "pro" || body?.planId === "elite" ? body.planId : null;
    const interval: BillingInterval = body?.interval === "yearly" ? "yearly" : "monthly";
    const currency: CurrencyCode = body?.currency === "INR" ? "INR" : "USD";

    if (!planId) {
      return NextResponse.json({ error: "Select a valid paid plan (pro or elite)." }, { status: 400 });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const priceId = resolveStripePriceId(planId, interval, currency);

    if (!stripeSecret || !priceId) {
      return NextResponse.json(
        {
          configured: false,
          code: "BILLING_NOT_CONFIGURED",
          plan: PLANS[planId],
          error:
            "Online checkout is not activated yet on this server. Add STRIPE_SECRET_KEY and STRIPE_PRICE_* keys in environment settings to accept live payments.",
        },
        { status: 503 }
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "https://vr-resume-analysis.vercel.app";

    const params = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      client_reference_id: user.uid,
      "metadata[uid]": user.uid,
      "metadata[planId]": planId,
      "metadata[interval]": interval,
      "subscription_data[metadata][uid]": user.uid,
      "subscription_data[metadata][planId]": planId,
      success_url: `${origin}/dashboard/settings?billing=success&plan=${planId}`,
      cancel_url: `${origin}/pricing?billing=cancelled`,
    });

    if (user.email) {
      params.set("customer_email", user.email);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(12000),
    });

    const stripeData = (await stripeRes.json()) as { url?: string; error?: { message?: string } };
    if (!stripeRes.ok || !stripeData.url) {
      return NextResponse.json(
        { error: stripeData.error?.message || "Failed to initialize checkout session." },
        { status: 502 }
      );
    }

    return NextResponse.json({ configured: true, url: stripeData.url });
  } catch (err) {
    console.error("[billing/checkout] Error:", err);
    return NextResponse.json({ error: "Checkout initialization failed." }, { status: 500 });
  }
}
