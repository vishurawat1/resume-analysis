import { NextRequest, NextResponse } from "next/server";
import { generateAIResponseWithMeta } from "@/services/aiService";
import { authorizeMeteredRequest, buildQuotaHeaders } from "@/lib/usageMeter";

export async function POST(req: NextRequest) {
  try {
    const authGate = await authorizeMeteredRequest(req, { bucket: "build-resume", cost: 1, rateLimit: 30 });
    if (!authGate.ok) return authGate.response;

    const { resumeText } = await req.json();

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing resumeText" },
        { status: 400 }
      );
    }

    if (resumeText.length > 20000) {
      return NextResponse.json(
        { error: "Payload exceeds maximum allowed length" },
        { status: 400 }
      );
    }

    const prompt = `
You are a Principal Executive Resume Architect and Typesetter.
Your job is to parse the raw resume text and extract all information into a pristine, high-fidelity structured JSON object for executive PDF rendering.

Guidelines:
1. Do NOT hallucinate skills or employers not present in the text.
2. Clean every bullet point: strip any leading bullet markers ("•", "-", "*", "–"), ensure it starts with an active capitalized verb, and ends with a period.
3. Group skills into clean, logical categories (e.g. "Languages", "Frameworks & Libraries", "Cloud & DevOps", "Tools & Databases").
4. Format contact links cleanly: extract URL or handle for LinkedIn, GitHub, and Portfolio.

The JSON MUST perfectly match this structure:
{
  "personalInfo": {
    "name": "Extract full name",
    "email": "Extract email or empty string",
    "phone": "Extract phone or empty string",
    "location": "Extract city, state/country or empty string",
    "linkedin": "Extract linkedin URL or empty string",
    "github": "Extract github URL or empty string",
    "portfolio": "Extract portfolio URL or empty string"
  },
  "summary": "Extract professional summary if present, otherwise empty string",
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "date": "Date range (e.g. Jan 2021 – Present)",
      "location": "Location if available",
      "bullets": ["Clean polished bullet point without leading symbol", "..."]
    }
  ],
  "education": [
    {
      "institution": "University or School Name",
      "degree": "Degree and Major",
      "date": "Graduation Date (e.g. May 2020)",
      "gpa": "GPA if available",
      "bullets": ["Honors or notable achievements if any"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Tech stack or brief 1-line description",
      "link": "Project URL if available",
      "date": "Date if available",
      "bullets": ["Clean accomplishment bullet point"]
    }
  ],
  "skills": [
    {
      "category": "Languages | Frameworks | Cloud & Tools",
      "items": ["Skill 1", "Skill 2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Year / Date"
    }
  ]
}

RESUME TEXT:
"""
${resumeText}
"""
    `;

    const aiMeta = await generateAIResponseWithMeta(prompt);
    const text = aiMeta.text;

    try {
      const parsedJSON = JSON.parse(text);
      const nextQuota = await authGate.consume(aiMeta.cached ? 0 : 1);
      return NextResponse.json(parsedJSON, {
        headers: buildQuotaHeaders(nextQuota),
      });
    } catch {
      console.error("Failed to parse JSON for PDF Build:", text);
      return NextResponse.json(
        { error: "AI failed to generate a valid document structure." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error in AI PDF build:", error);
    return NextResponse.json(
      { error: "Failed to generate structured resume." },
      { status: 500 }
    );
  }
}
