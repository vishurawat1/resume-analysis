import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { generateAIResponse } from "@/services/aiService";

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
    
    if (resumeText.length > 20000) {
      return NextResponse.json({ error: "Resume payload exceeds maximum allowed length" }, { status: 400 });
    }

    const prompt = `
Act as a strict ATS evaluator and Senior Tech Recruiter.
Analyze the following resume holistically without comparing it to any specific job description.

Evaluate it based on:
1. Impact & Measurability (Are achievements quantified?)
2. Action Verbs (Are strong action words used?)
3. Tech Keyword Density & Formatting (Is it easily parsable by ATS, are relevant skills clearly defined?)

Provide a structured JSON response EXACTLY matching this structure:
{
  "score": <number 0-100>,
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "recommended_addons": [
    {
      "category": "<e.g., Skills, Metrics, Formatting>",
      "suggestion": "<actionable thing to add or change>"
    }
  ],
  "suggestions": [
    {
      "original": "The exact original bullet point from the resume that needs improvement",
      "improved": "The rewritten, highly optimized, metrics-driven bullet point",
      "reason": "Why this improvement was made (e.g., added missing keyword, quantified impact)",
      "impact": "High"
    }
  ],
  "summary": "<a 2-3 sentence overall review>"
}

Constraints for suggestions:
- Provide exactly 3 to 5 bullet point improvements focusing on the weakest points.
- The "original" MUST be an exact substring from the resume text so it can be replaced in the frontend.

RESUME TEXT:
"""
${resumeText}
"""
`;

    const text = await generateAIResponse(prompt);

    try {
      const parsedJSON = JSON.parse(text);
      return NextResponse.json(parsedJSON);
    } catch {
      console.error("Failed to parse Gemini JSON:", text);
      return NextResponse.json(
        { error: "AI returned invalid JSON format." },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error("Error in AI review:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return NextResponse.json(
        { error: "You've hit the daily AI limit (20 requests/day on the free plan). Please try again tomorrow or upgrade your Gemini API plan." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to review resume with AI. Please try again." },
      { status: 500 }
    );
  }
}
