import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { generateAIResponse } from "@/services/aiService";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = applyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    const { draft, role, tone } = await req.json();

    if (!draft) {
      return NextResponse.json(
        { error: "Missing draft bullet point" },
        { status: 400 }
      );
    }
    
    if (typeof draft !== "string") {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }
    
    if (draft.length > 2000 || (role && role.length > 100) || (tone && tone.length > 100)) {
      return NextResponse.json({ error: "Input exceeds maximum allowed length" }, { status: 400 });
    }

    const prompt = `
You are an expert Executive Resume Writer and Career Coach. 
A user has provided a weak or draft bullet point for their resume. 

Draft Bullet Point: "${draft}"
${role ? `Target Role/Industry: "${role}"` : ""}
Requested Tone/Focus: "${tone || "Professional and Impact-Driven"}"

Your task is to rewrite this bullet point into 3 highly polished, ATS-optimized variations.
Each variation should start with a strong action verb and, where possible, imply or use placeholder metrics (like "by X%" or "saving $Y") to encourage the user to quantify their achievements.

Provide a structured JSON response EXACTLY matching this format:
{
  "options": [
    {
      "text": "<The rewritten bullet point>",
      "reasoning": "<A brief 1-sentence explanation of why this version is strong or what it highlights>"
    },
    {
      "text": "<The rewritten bullet point>",
      "reasoning": "<A brief 1-sentence explanation of why this version is strong or what it highlights>"
    },
    {
      "text": "<The rewritten bullet point>",
      "reasoning": "<A brief 1-sentence explanation of why this version is strong or what it highlights>"
    }
  ]
}
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
    console.error("Error in AI enhance:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return NextResponse.json(
        { error: "You've hit the daily AI limit (20 requests/day on the free plan). Please try again tomorrow or upgrade your Gemini API plan." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to enhance bullet point. Please try again." },
      { status: 500 }
    );
  }
}
