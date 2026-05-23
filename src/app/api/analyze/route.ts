import { NextRequest, NextResponse } from "next/server";
import { getResumeAnalysisPrompt } from "@/lib/prompts";
import { applyRateLimit } from "@/lib/rate-limit";
import { generateAIResponse } from "@/services/aiService";

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
    
    if (resumeText.length > 20000 || jobDescription.length > 10000) {
      return NextResponse.json({ error: "Payload exceeds maximum allowed length" }, { status: 400 });
    }

    const prompt = getResumeAnalysisPrompt(resumeText, jobDescription);
    const text = await generateAIResponse(prompt);

    // Try to parse the response as JSON (handles markdown formatting)

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
    console.error("Error in AI analysis:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return NextResponse.json(
        { error: "You've hit the daily AI limit (20 requests/day on the free plan). Please try again tomorrow or upgrade your Gemini API plan." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to analyze resume with AI. Please try again." },
      { status: 500 }
    );
  }
}
