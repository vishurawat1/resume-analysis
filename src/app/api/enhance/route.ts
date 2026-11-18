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
You are a Principal Executive Resume Writer and Former Big-Tech Hiring Manager.
A user has provided input for their resume bullet point (this could be a rough bullet, a fragmented sentence, or even a keyword/concept).

User Input / Concept: "${draft}"
${role ? `Target Role/Industry: "${role}"` : ""}
Requested Tone/Focus: "${tone || "Professional and Impact-Driven"}"

Your task is to generate 3 COMPLETE, production-ready, ATS-optimized bullet points.
CRITICAL REQUIREMENTS:
1. Every option MUST BE A FULL, COMPLETE BULLET POINT (never a short phrase, fragment, or single word).
2. Follow the Google XYZ Formula: "Accomplished [X] as measured by [Y] by doing [Z]".
3. Front-load with commanding, past-tense action verbs (e.g., Architected, Spearheaded, Overhauled, Orchestrated, Engineered).
4. Include realistic, quantifiable impact metrics (e.g., "cutting query latency by 42%", "saving $45,000 annually", "processing 15M+ daily requests", "increasing conversion by 28%").
5. Do NOT include bullet symbols like "•" or "-" at the start of the text.

Provide a structured JSON response EXACTLY matching this format:
{
  "options": [
    {
      "text": "<The complete, polished executive-grade bullet point>",
      "reasoning": "<1-sentence breakdown of the metric and impact highlighted>"
    },
    {
      "text": "<The complete, polished executive-grade bullet point>",
      "reasoning": "<1-sentence breakdown of the metric and impact highlighted>"
    },
    {
      "text": "<The complete, polished executive-grade bullet point>",
      "reasoning": "<1-sentence breakdown of the metric and impact highlighted>"
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
        { error: "AI rate limit or quota exceeded across all providers. Please try again shortly." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to enhance bullet point. Please try again." },
      { status: 500 }
    );
  }
}
