import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bootTimeMs = Date.now();

export async function GET() {
  const aiReady = Boolean(
    process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
  );

  return NextResponse.json(
    {
      status: aiReady ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - bootTimeMs) / 1000),
      services: {
        aiWaterfall: aiReady,
        latexCompiler: true,
        billingConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      },
    },
    { status: aiReady ? 200 : 503 }
  );
}
