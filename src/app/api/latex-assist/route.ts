import { NextRequest, NextResponse } from "next/server";
import { authorizeMeteredRequest, buildQuotaHeaders } from "@/lib/usageMeter";
import { generateAIResponseWithMeta } from "@/services/aiService";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const authGate = await authorizeMeteredRequest(req, { bucket: "latex-assist", cost: 1, rateLimit: 35 });
    if (!authGate.ok) return authGate.response;

    const { mode, tex, errorLog, errorLine, jobDescription, missingKeywords, jobTitle } =
      await req.json();

    if (!tex || typeof tex !== "string") {
      return NextResponse.json({ error: "Missing LaTeX source" }, { status: 400 });
    }
    if (tex.length > 60000) {
      return NextResponse.json({ error: "LaTeX source too large" }, { status: 400 });
    }

    if (mode === "fix-error") {
      const prompt = `
You are a Senior LaTeX / Overleaf TeX Live Engineer.
Fix the compilation error(s) in the provided LaTeX resume file while preserving EVERY SINGLE word of the candidate's actual resume content, formatting, packages, and structure.

Common issues to fix:
- Unescaped special characters in prose: "%", "&", "$", "#", "_" (escape as "\\%", "\\&", "\\$", "\\#", "\\_") — NEVER break valid TeX syntax like "$|$" or "\\&" or math/URL arguments inside "\\href{url}{text}"!
- Unmatched curly braces "{" / "}" or unclosed environments ("\\resumeItemListStart" vs "\\resumeItemListEnd", "\\begin{...}" vs "\\end{...}").
- Undefined macros or broken line breaks ("\\\\").

COMPILER ERROR SUMMARY / LOG:
Line: ${errorLine || "Unknown"}
"""
${String(errorLog || "").slice(0, 3000)}
"""

BROKEN LATEX SOURCE:
"""
${tex}
"""

Return ONLY valid JSON matching this exact schema (no markdown fences):
{
  "fixedTex": "<complete, valid, compilable .tex document string>",
  "explanation": "<1-sentence explanation of what syntax issue was fixed>"
}
`;
      const aiMeta = await generateAIResponseWithMeta(prompt);
      const parsed = JSON.parse(aiMeta.text);
      const nextQuota = await authGate.consume(aiMeta.cached ? 0 : 1);
      return NextResponse.json(
        {
          fixedTex: parsed.fixedTex,
          explanation: parsed.explanation || "Fixed LaTeX syntax and escaped special characters.",
        },
        { headers: buildQuotaHeaders(nextQuota) }
      );
    }

    if (mode === "tailor-jd") {
      const kwList = Array.isArray(missingKeywords) ? missingKeywords.join(", ") : "";
      const prompt = `
You are a Principal Technical Resume Architect and LaTeX Expert.
Optimize the candidate's Overleaf LaTeX resume (.tex) against the target Job Description while preserving strict ATS authenticity and guaranteed pdflatex compilation.

TARGET ROLE: ${jobTitle || "Specified in JD"}
MISSING KEYWORDS TO INCORPORATE WHERE TRUTHFUL: ${kwList || "Align organically with JD requirements"}

CRITICAL RULES:
1. Return the COMPLETE, valid, 100% compilable .tex file.
2. NEVER invent fake employers, degrees, certifications, or titles. Only sharpen bullet phrasing using the Google XYZ formula, surface authentic matching keywords inside Skills or existing project/experience descriptions, and ensure impactful action verbs.
3. Escape EVERY special LaTeX character in prose ("%", "&", "$", "#", "_") properly ("\\\\%", "\\\\&", "\\\\$", "\\\\#", "\\\\_"). Remember to preserve "$|$" separators and macro braces accurately!
4. Keep clean 1-page executive density (do not bloat excessively).

TARGET JOB DESCRIPTION:
"""
${String(jobDescription || "").slice(0, 6000)}
"""

CURRENT LATEX RESUME:
"""
${tex}
"""

Return ONLY valid JSON matching this exact schema (no markdown fences):
{
  "updatedTex": "<complete tailored compilable .tex document>",
  "changesSummary": ["<specific upgrade 1>", "<specific upgrade 2>", "<specific upgrade 3>"]
}
`;
      const aiMeta = await generateAIResponseWithMeta(prompt);
      const parsed = JSON.parse(aiMeta.text);
      const nextQuota = await authGate.consume(aiMeta.cached ? 0 : 1);
      return NextResponse.json(
        {
          updatedTex: parsed.updatedTex,
          changesSummary: Array.isArray(parsed.changesSummary)
            ? parsed.changesSummary
            : ["Tailored experience bullets and skills to align with Target JD."],
        },
        { headers: buildQuotaHeaders(nextQuota) }
      );
    }

    return NextResponse.json({ error: "Unsupported assist mode" }, { status: 400 });
  } catch (error) {
    console.error("[latex-assist] Error:", error);
    return NextResponse.json(
      { error: "AI LaTeX Assistant encountered an error. Please try again." },
      { status: 500 }
    );
  }
}
