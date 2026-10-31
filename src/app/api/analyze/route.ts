import { NextRequest, NextResponse } from "next/server";
import { getResumeAnalysisPrompt } from "@/lib/prompts";
import { applyRateLimit } from "@/lib/rate-limit";
import { generateAIResponse } from "@/services/aiService";

interface RawAnalysisResult {
  overallScore?: number;
  roleFitAnalysis?: string;
  sectionScores?: Record<string, number>;
  weaknesses?: string[];
  strengths?: string[];
  suggestions?: Array<{
    original?: string;
    improved?: string;
    reason?: string;
    impact?: string;
  }>;
  keywordAnalysis?: {
    missing?: string[];
    density?: number;
  };
  improvementImpact?: number;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = applyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Missing resumeText or jobDescription" },
        { status: 400 }
      );
    }

    if (typeof resumeText !== "string" || typeof jobDescription !== "string") {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    if (resumeText.length > 25000 || jobDescription.length > 15000) {
      return NextResponse.json({ error: "Payload exceeds maximum allowed length" }, { status: 400 });
    }

    const prompt = getResumeAnalysisPrompt(resumeText, jobDescription);
    const text = await generateAIResponse(prompt);

    let parsed: RawAnalysisResult;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Failed to parse AI JSON response:", text);
      return NextResponse.json(
        { error: "AI returned invalid JSON format. Please try again." },
        { status: 500 }
      );
    }

    // High-precision normalization and validation
    const overallScore = Math.max(0, Math.min(100, Math.round(Number(parsed.overallScore) || 70)));
    
    // Ensure all 6 radar & breakdown sections are present
    const defaultSections: Record<string, number> = {
      Experience: overallScore,
      Skills: overallScore,
      Education: Math.min(100, overallScore + 5),
      Projects: overallScore,
      Formatting: 85,
      KeywordOptimization: Math.max(40, overallScore - 10),
    };

    const sectionScores: Record<string, number> = {};
    const rawSections = parsed.sectionScores || {};
    for (const key of Object.keys(defaultSections)) {
      const val = Number(rawSections[key]);
      sectionScores[key] = isNaN(val) ? defaultSections[key] : Math.max(0, Math.min(100, Math.round(val)));
    }

    const weaknesses = Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0
      ? parsed.weaknesses.map(String)
      : ["Quantifiable impact metrics could be increased across experience bullets", "Ensure keywords from the job description are prominent"];

    const strengths = Array.isArray(parsed.strengths) && parsed.strengths.length > 0
      ? parsed.strengths.map(String)
      : ["Clear career progression documented", "Core skills align with foundational requirements"];

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter((s) => s && typeof s.original === "string" && typeof s.improved === "string")
          .map((s) => ({
            original: s.original!.trim(),
            improved: s.improved!.trim(),
            reason: s.reason ? String(s.reason) : "Optimized for quantifiable impact and ATS alignment",
            impact: s.impact && ["High", "Critical", "Medium"].includes(s.impact) ? s.impact : "High",
          }))
      : [];

    const missingKeywords = Array.isArray(parsed.keywordAnalysis?.missing)
      ? parsed.keywordAnalysis!.missing.map(String)
      : [];

    const density = Math.max(0, Math.min(100, Math.round(Number(parsed.keywordAnalysis?.density) || 60)));

    const improvementImpact = Math.max(5, Math.min(25, Math.round(Number(parsed.improvementImpact) || 15)));

    const roleFitAnalysis = typeof parsed.roleFitAnalysis === "string" && parsed.roleFitAnalysis.trim().length > 0
      ? parsed.roleFitAnalysis.trim()
      : "The candidate shows relevant background for key aspects of the role, with notable opportunities to better highlight target technologies and quantified accomplishments.";

    const sanitizedResult = {
      overallScore,
      roleFitAnalysis,
      sectionScores,
      weaknesses,
      strengths,
      suggestions,
      keywordAnalysis: {
        missing: missingKeywords,
        density,
      },
      improvementImpact,
    };

    return NextResponse.json(sanitizedResult);
  } catch (error: unknown) {
    console.error("Error in AI analysis:", error);
    const errorMessage = error instanceof Error ? error.message : "";

    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return NextResponse.json(
        { error: "AI rate limit or quota exceeded across all providers. Please try again shortly." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze resume with AI. Please try again." },
      { status: 500 }
    );
  }
}
