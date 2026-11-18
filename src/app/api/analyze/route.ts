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
  locationIntelligence?: {
    candidateLocation?: string;
    jobLocation?: string;
    workModel?: string;
    commuteFeasibility?: string;
    distanceEstimate?: string;
    verdict?: string;
    relocationAdvice?: string;
  };
  companyIntelligence?: {
    name?: string;
    legitimacyStatus?: string;
    legitimacyScore?: number;
    industry?: string;
    estimatedTier?: string;
    overview?: string;
    greenFlags?: string[];
    redFlags?: string[];
    verdict?: string;
  };
  seniorityFit?: {
    candidateLevel?: string;
    jobLevel?: string;
    fitVerdict?: string;
    estimatedSalaryRange?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = applyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    const { resumeText, jobDescription, company, location, jobTitle, candidateLocation } = await req.json();

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

    const prompt = getResumeAnalysisPrompt(resumeText, jobDescription, {
      company: typeof company === "string" ? company.trim() : undefined,
      location: typeof location === "string" ? location.trim() : undefined,
      jobTitle: typeof jobTitle === "string" ? jobTitle.trim() : undefined,
      candidateLocation: typeof candidateLocation === "string" ? candidateLocation.trim() : undefined,
    });
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

    // Normalize Location & Commute Intelligence
    const rawLoc = parsed.locationIntelligence;
    const resolvedCandidateLoc = (typeof candidateLocation === "string" && candidateLocation.trim().length > 0)
      ? candidateLocation.trim()
      : (rawLoc?.candidateLocation?.trim() || "Not specified on resume");

    const locationIntelligence = {
      candidateLocation: resolvedCandidateLoc,
      jobLocation: rawLoc?.jobLocation?.trim() || location || "As specified in job posting",
      workModel: rawLoc?.workModel || "On-Site / Hybrid",
      commuteFeasibility: rawLoc?.commuteFeasibility || "Manageable",
      distanceEstimate: rawLoc?.distanceEstimate || "Local / Regional",
      verdict: rawLoc?.verdict?.trim() || "Location appears standard for this type of position.",
      relocationAdvice: rawLoc?.relocationAdvice?.trim() || "Confirm work arrangement (remote vs on-site) during initial interview.",
    };

    // Normalize Company Intelligence
    const rawComp = parsed.companyIntelligence;
    const companyIntelligence = {
      name: rawComp?.name?.trim() || company || "Target Organization",
      legitimacyStatus: rawComp?.legitimacyStatus || "Verified Enterprise",
      legitimacyScore: Math.max(0, Math.min(100, Math.round(Number(rawComp?.legitimacyScore) || 85))),
      industry: rawComp?.industry?.trim() || "Technology & Services",
      estimatedTier: rawComp?.estimatedTier?.trim() || "Established Corporate / Scale-up",
      overview: rawComp?.overview?.trim() || "Active employer hiring for this engineering and technical position.",
      greenFlags: Array.isArray(rawComp?.greenFlags) && rawComp.greenFlags.length > 0
        ? rawComp.greenFlags.map(String)
        : ["Transparent job responsibilities", "Industry standard requirements"],
      redFlags: Array.isArray(rawComp?.redFlags) ? rawComp.redFlags.map(String) : [],
      verdict: rawComp?.verdict?.trim() || "Legitimate employer with standard hiring criteria.",
    };

    // Normalize Seniority Fit & Salary
    const rawSen = parsed.seniorityFit;
    const seniorityFit = {
      candidateLevel: rawSen?.candidateLevel?.trim() || "Mid-Level Professional",
      jobLevel: rawSen?.jobLevel?.trim() || "Mid-Senior Level",
      fitVerdict: rawSen?.fitVerdict?.trim() || "Well Aligned",
      estimatedSalaryRange: rawSen?.estimatedSalaryRange?.trim() || "Competitive / Market Standard",
    };

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
      locationIntelligence,
      companyIntelligence,
      seniorityFit,
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
