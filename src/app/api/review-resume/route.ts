import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { generateAIResponse } from "@/services/aiService";
import { getResumeReviewPrompt } from "@/lib/prompts";

interface RawReviewResult {
  score?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommended_addons?: Array<{
    category?: string;
    suggestion?: string;
  }>;
  suggestions?: Array<{
    original?: string;
    improved?: string;
    reason?: string;
    impact?: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = applyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    const { resumeText } = await req.json();

    if (!resumeText) {
      return NextResponse.json(
        { error: "Missing resumeText" },
        { status: 400 }
      );
    }
    
    if (typeof resumeText !== "string") {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }
    
    if (resumeText.length > 25000) {
      return NextResponse.json({ error: "Resume payload exceeds maximum allowed length" }, { status: 400 });
    }

    const prompt = getResumeReviewPrompt(resumeText);
    const text = await generateAIResponse(prompt);

    let parsed: RawReviewResult;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Failed to parse AI review JSON:", text);
      return NextResponse.json(
        { error: "AI returned invalid JSON format. Please try again." },
        { status: 500 }
      );
    }

    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 72)));
    const summary = typeof parsed.summary === "string" && parsed.summary.trim().length > 0
      ? parsed.summary.trim()
      : "Overall strong foundation with solid experience, but needs more metrics-driven bullets and sharpened technical keywords to maximize ATS pass-through.";

    const strengths = Array.isArray(parsed.strengths) && parsed.strengths.length > 0
      ? parsed.strengths.map(String)
      : ["Clear career trajectory", "Solid demonstration of industry tools"];

    const weaknesses = Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0
      ? parsed.weaknesses.map(String)
      : ["Achievements could be better quantified with metrics", "Action verbs could be stronger in recent roles"];

    const recommended_addons = Array.isArray(parsed.recommended_addons) && parsed.recommended_addons.length > 0
      ? parsed.recommended_addons.map((a) => ({
          category: a.category ? String(a.category) : "Metrics & KPIs",
          suggestion: a.suggestion ? String(a.suggestion) : "Quantify impact with % improvements or revenue metrics",
        }))
      : [
          { category: "Metrics & KPIs", suggestion: "Add measurable percentages and scale to bullet points" },
          { category: "Action Verbs", suggestion: "Start bullets with high-impact leadership verbs" },
          { category: "Tech Architecture", suggestion: "Group technical proficiencies into distinct categories" },
        ];

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter((s) => s && typeof s.original === "string" && typeof s.improved === "string")
          .map((s) => ({
            original: s.original!.trim(),
            improved: s.improved!.trim(),
            reason: s.reason ? String(s.reason) : "Rewritten for impact using the Google XYZ formula",
            impact: s.impact && ["High", "Critical", "Medium"].includes(s.impact) ? s.impact : "High",
          }))
      : [];

    const sanitizedResult = {
      score,
      summary,
      strengths,
      weaknesses,
      recommended_addons,
      suggestions,
    };

    return NextResponse.json(sanitizedResult);
  } catch (error: unknown) {
    console.error("Error in AI review:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return NextResponse.json(
        { error: "AI rate limit or quota exceeded across all providers. Please try again shortly." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to review resume with AI. Please try again." },
      { status: 500 }
    );
  }
}
