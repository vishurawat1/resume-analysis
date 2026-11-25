import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/serverAuth";
import { getUserQuotaStatus } from "@/lib/usageMeter";
import { applyRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await verifyRequestUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  const rateLimited = applyRateLimit(req, {
    bucket: "usage",
    identityKey: user.uid,
    limit: 120,
  });
  if (rateLimited) return rateLimited;

  const status = await getUserQuotaStatus(user);
  return NextResponse.json({
    ...status,
    billingConfigured: Boolean(
      process.env.STRIPE_SECRET_KEY &&
        (process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_ELITE_MONTHLY)
    ),
  });
}
