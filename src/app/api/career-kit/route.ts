import { NextRequest, NextResponse } from "next/server";
import { authorizeMeteredRequest, buildQuotaHeaders } from "@/lib/usageMeter";
import { escapeLatex } from "@/lib/latexTemplates";
import { generateAIResponseWithMeta } from "@/services/aiService";

export const runtime = "nodejs";
export const maxDuration = 45;

type CareerKitMode = "cover-letter" | "interview-prep" | "both";
type InterviewCategory = "Technical" | "Behavioral" | "System Design" | "Gap Probe";

interface CoverLetterOutput {
  subject: string;
  salutation: string;
  paragraphs: string[];
  signOff: string;
  fullText: string;
  latexSource: string;
}

interface InterviewQuestionOutput {
  question: string;
  category: InterviewCategory;
  targetingGap: string;
  whyAsked: string;
  talkingPoints: string[];
  sampleOpener: string;
}

interface RawCareerKitAIResponse {
  coverLetter?: {
    subject?: unknown;
    salutation?: unknown;
    paragraphs?: unknown;
    signOff?: unknown;
  };
  interviewPrep?: unknown[];
}

function normalizeForPdflatex(text?: string): string {
  if (!text) return "";
  return text
    .replace(/[\u2192\u2794]/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2265/g, ">=")
    .replace(/\u2264/g, "<=")
    .replace(/\u00d7/g, "x")
    .replace(/[\u2022\u00b7]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\uFE00-\uFE0F\u200D]/gu, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

function safeLatex(text?: string): string {
  const noMarkdownBold = (text || "").replace(/\*\*([\s\S]*?)\*\*/g, "$1");
  return escapeLatex(normalizeForPdflatex(noMarkdownBold));
}

function extractContactFromResume(resumeText: string, explicitName?: string): {
  name: string;
  email: string;
  phone: string;
} {
  const emailMatch = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.exec(resumeText);
  const phoneMatch = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.exec(resumeText);

  let inferredName = explicitName?.trim() || "";
  if (!inferredName) {
    const firstLines = resumeText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 5);
    for (const line of firstLines) {
      if (
        line.length >= 3 &&
        line.length <= 50 &&
        !/@|http|www\.|resume|curriculum|summary|experience|education/i.test(line) &&
        !/\d{3}/.test(line)
      ) {
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 4) {
          inferredName = line;
          break;
        }
      }
    }
  }

  return {
    name: inferredName || "Candidate Name",
    email: emailMatch ? emailMatch[0].trim() : "",
    phone: phoneMatch ? phoneMatch[0].trim() : "",
  };
}

function buildCoverLetterLatex(params: {
  candidateName: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  salutation: string;
  paragraphs: string[];
  signOff: string;
}): string {
  const escName = safeLatex(params.candidateName || "Candidate Name");
  const escCompany = safeLatex(params.company);
  const escSubject = safeLatex(params.subject);
  const escSalutation = safeLatex(params.salutation);
  const escSignOff = safeLatex(params.signOff);

  const contactItems: string[] = [];
  if (params.phone) contactItems.push(safeLatex(params.phone));
  if (params.email && !/[\\{}\s%#&$^~]/.test(params.email)) {
    contactItems.push(`\\href{mailto:${params.email}}{\\underline{${safeLatex(params.email)}}}`);
  }
  const contactLine = contactItems.join(" $|$ ");

  const escapedParagraphs = params.paragraphs
    .map((p) => safeLatex(p))
    .filter((p) => p.length > 0);

  const subjectLine = /^re:/i.test(params.subject.trim())
    ? escSubject
    : `Re: ${escSubject}`;

  return [
    `%-------------------------`,
    `% Overleaf-Ready Cover Letter (TeX Live / pdfLaTeX)`,
    `%-------------------------`,
    ``,
    `\\documentclass[letterpaper,11pt]{article}`,
    ``,
    `\\usepackage[empty]{fullpage}`,
    `\\usepackage{enumitem}`,
    `\\usepackage[hidelinks]{hyperref}`,
    `\\usepackage{fancyhdr}`,
    `\\usepackage[english]{babel}`,
    `\\usepackage{xcolor}`,
    `\\input{glyphtounicode}`,
    ``,
    `\\pagestyle{fancy}`,
    `\\fancyhf{}`,
    `\\fancyfoot{}`,
    `\\renewcommand{\\headrulewidth}{0pt}`,
    `\\renewcommand{\\footrulewidth}{0pt}`,
    ``,
    `\\addtolength{\\oddsidemargin}{-0.35in}`,
    `\\addtolength{\\evensidemargin}{-0.35in}`,
    `\\addtolength{\\textwidth}{0.7in}`,
    `\\addtolength{\\topmargin}{-0.4in}`,
    `\\addtolength{\\textheight}{0.8in}`,
    ``,
    `\\urlstyle{same}`,
    `\\raggedright`,
    `\\setlength{\\parindent}{0pt}`,
    `\\setlength{\\parskip}{10pt}`,
    `\\pdfgentounicode=1`,
    ``,
    `\\begin{document}`,
    ``,
    `%----------HEADER----------`,
    `\\noindent{\\LARGE \\textbf{${escName}}}${contactLine ? `\\\\[4pt]\n{\\small ${contactLine}}` : ""}`,
    ``,
    `\\vspace{2pt}`,
    `\\noindent\\rule{\\textwidth}{0.6pt}`,
    `\\vspace{8pt}`,
    ``,
    `%----------RECIPIENT----------`,
    `\\today`,
    ``,
    `\\textbf{Hiring Team}${escCompany ? ` \\\\\n${escCompany}` : ""} \\\\`,
    `\\textit{${subjectLine}}`,
    ``,
    `\\vspace{4pt}`,
    ``,
    `${escSalutation}`,
    ``,
    ...escapedParagraphs.flatMap((p) => [p, ""]),
    `${escSignOff}`,
    ``,
    `\\vspace{8pt}`,
    `\\textbf{${escName}}`,
    ``,
    `\\end{document}`,
    ``,
  ].join("\n");
}

function buildFallbackCoverLetter(ctx: {
  candidateName: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  track: string;
  missingKeywords: string[];
  weaknesses: string[];
}): CoverLetterOutput {
  const roleLabel = ctx.jobTitle || ctx.track || "this role";
  const companyLabel = ctx.company || "your team";
  const kwHighlight =
    ctx.missingKeywords.length > 0
      ? ctx.missingKeywords.slice(0, 3).join(", ")
      : "cross-functional delivery, scalable architecture, and measurable outcomes";
  const growthFocus =
    ctx.weaknesses.length > 0
      ? `In particular, I am excited to apply my hands-on experience while deepening impact around ${ctx.weaknesses[0].toLowerCase().replace(/\.$/, "")}.`
      : `My background delivering reliable systems and collaborating across product and engineering teams translates directly to ${companyLabel}'s priorities.`;

  const subject = `Application for ${roleLabel}${ctx.company ? ` - ${ctx.company}` : ""}`;
  const salutation = ctx.company ? `Dear ${ctx.company} Hiring Team,` : "Dear Hiring Manager,";
  const paragraphs = [
    `I am writing to express my strong interest in the ${roleLabel} position at ${companyLabel}. With a proven track record of shipping high-impact work and aligning technical execution with business goals, I am eager to bring immediate momentum to your team.`,
    `Across my recent projects and roles, I have focused on measurable execution—combining clean engineering practices with strong ownership from design through production. ${growthFocus}`,
    `Your emphasis on ${kwHighlight} resonates closely with how I approach problem-solving and continuous improvement. I would welcome the opportunity to discuss how my skills and results-driven mindset can support ${companyLabel}'s upcoming milestones.`,
  ];
  const signOff = "Sincerely,";
  const fullText = [
    `Subject: ${subject}`,
    salutation,
    ...paragraphs,
    `${signOff}\n${ctx.candidateName}`,
  ].join("\n\n");

  const latexSource = buildCoverLetterLatex({
    candidateName: ctx.candidateName,
    email: ctx.email,
    phone: ctx.phone,
    company: ctx.company,
    subject,
    salutation,
    paragraphs,
    signOff,
  });

  return { subject, salutation, paragraphs, signOff, fullText, latexSource };
}

function normalizeCategory(raw: unknown): InterviewCategory {
  const val = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (val === "behavioral" || val.includes("behav") || val.includes("leader")) return "Behavioral";
  if (val === "system design" || val.includes("system") || val.includes("arch")) return "System Design";
  if (val === "gap probe" || val.includes("gap") || val.includes("weak")) return "Gap Probe";
  return "Technical";
}

function buildFallbackInterviewPrep(ctx: {
  jobTitle: string;
  company: string;
  track: string;
  weaknesses: string[];
  missingKeywords: string[];
}): InterviewQuestionOutput[] {
  const role = ctx.jobTitle || ctx.track || "this position";
  const company = ctx.company || "our team";
  const kw1 = ctx.missingKeywords[0] || "production scalability";
  const kw2 = ctx.missingKeywords[1] || "observability and testing";
  const gap1 = ctx.weaknesses[0] || `Demonstrating hands-on depth in ${kw1}`;
  const gap2 = ctx.weaknesses[1] || "Quantifying end-to-end business and latency impact";

  return [
    {
      question: `Your resume shows strong foundational work, though ${kw1} is central to our ${role} role at ${company}. Walk us through how you would ramp up or apply adjacent experience to deliver with ${kw1} in your first 60 days.`,
      category: "Gap Probe",
      targetingGap: gap1,
      whyAsked: `Evaluates whether you can bridge the ${kw1} gap quickly using transferable fundamentals.`,
      talkingPoints: [
        `Connect a closely related project from your resume to ${kw1} patterns`,
        "Explain the concrete mental model, trade-offs, and failure modes involved",
        "Outline a realistic 30/60-day validation and delivery plan",
      ],
      sampleOpener: `While my recent production stack centered on adjacent tooling rather than ${kw1} directly, the core patterns are ones I have implemented in...`,
    },
    {
      question: `Describe a system or workflow you owned end-to-end where performance, reliability, or ${kw2} became a bottleneck. What architectural changes did you drive and how did you measure success?`,
      category: "System Design",
      targetingGap: gap2,
      whyAsked: "Probes architectural judgment and ability to instrument and quantify outcomes.",
      talkingPoints: [
        "State baseline latency, throughput, or error-rate metrics before your change",
        "Justify your design trade-offs against at least one rejected alternative",
        "Highlight measurable post-launch impact and monitoring safeguards",
      ],
      sampleOpener: `On our core pipeline, p95 latency degraded under peak load, so I profiled the bottleneck and redesigned...`,
    },
    {
      question: `For ${role}, deep execution in ${kw1} and ${kw2} is critical. How would you design, test, and safely roll out a high-risk feature touching core production traffic?`,
      category: "Technical",
      targetingGap: `Missing keyword: ${kw1}`,
      whyAsked: "Checks practical engineering rigor around rollout safety, testing strategy, and debugging.",
      talkingPoints: [
        "Cover contract/integration testing and staged rollout or feature flags",
        "Describe key health metrics, alerting thresholds, and rollback triggers",
        `Tie implementation details back to ${kw1} and ${kw2} best practices`,
      ],
      sampleOpener: `To de-risk a change in a critical path, I separate schema/contract compatibility from rollout using progressive traffic shifting and...`,
    },
    {
      question: `Tell me about a time you disagreed with a teammate or stakeholder on scope, priorities, or technical direction. How did you align on a path forward?`,
      category: "Behavioral",
      targetingGap: "Cross-functional alignment & ownership",
      whyAsked: "Assesses communication maturity, data-driven persuasion, and collaboration under ambiguity.",
      talkingPoints: [
        "Briefly frame the conflicting goals without blaming stakeholders",
        "Show how you brought concrete evidence, prototypes, or customer impact data",
        "Close with the measurable outcome and what you learned for future alignment",
      ],
      sampleOpener: `During a tight release cycle, product and engineering differed on whether to ship a fast workaround or refactor first—so I proposed a benchmark...`,
    },
    {
      question: `Looking at your background relative to ${company}'s ${role} roadmap, which area of the role do you expect to be your steepest learning curve, and how have you successfully closed similar gaps before?`,
      category: "Gap Probe",
      targetingGap: ctx.weaknesses[0] || `Ramping up on ${kw2}`,
      whyAsked: "Tests self-awareness, coachability, and proactive learning habits when confronting resume gaps.",
      talkingPoints: [
        "Name a real, non-trivial skill gap directly without being defensive",
        "Give a concrete past example where you mastered an unfamiliar stack quickly",
        "Connect that learning velocity to the immediate priorities of the job description",
      ],
      sampleOpener: `The biggest growth area for me here is ${kw2} at your scale; in my previous role I faced a similar jump when I took over...`,
    },
  ];
}

function normalizeStringArray(input: unknown, maxItems: number): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 300))
    .slice(0, maxItems);
}

export async function POST(req: NextRequest) {
  try {
    const authGate = await authorizeMeteredRequest(req, { bucket: "career-kit", cost: 1, rateLimit: 30 });
    if (!authGate.ok) return authGate.response;

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "Invalid payload format." }, { status: 400 });
    }

    const body = rawBody as Record<string, unknown>;
    const rawMode = body.mode;
    const mode: CareerKitMode =
      rawMode === undefined ? "both" : (rawMode as CareerKitMode);

    if (mode !== "cover-letter" && mode !== "interview-prep" && mode !== "both") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'cover-letter', 'interview-prep', or 'both'." },
        { status: 400 }
      );
    }

    const resumeText = typeof body.resumeText === "string" ? body.resumeText.trim() : "";
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Missing resumeText or jobDescription" },
        { status: 400 }
      );
    }

    if (resumeText.length > 25000 || jobDescription.length > 15000) {
      return NextResponse.json(
        { error: "Payload exceeds maximum allowed length" },
        { status: 400 }
      );
    }

    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim().slice(0, 200) : "";
    const company = typeof body.company === "string" ? body.company.trim().slice(0, 200) : "";
    const candidateNameInput =
      typeof body.candidateName === "string" ? body.candidateName.trim().slice(0, 150) : "";
    const track = typeof body.track === "string" ? body.track.trim().slice(0, 150) : "";

    const weaknesses = normalizeStringArray(body.weaknesses, 12);
    const missingKeywords = normalizeStringArray(body.missingKeywords, 25);

    const contact = extractContactFromResume(resumeText, candidateNameInput);

    const includeCoverLetter = mode === "cover-letter" || mode === "both";
    const includeInterviewPrep = mode === "interview-prep" || mode === "both";

    const schemaSections: string[] = [];
    if (includeCoverLetter) {
      schemaSections.push(`  "coverLetter": {
    "subject": "<concise application subject line>",
    "salutation": "<e.g. Dear Hiring Team, or Dear <Company> Recruiting Team,>",
    "paragraphs": [
      "<Paragraph 1: strong tailored hook referencing the role, company, and candidate background>",
      "<Paragraph 2: specific quantified achievements from the resume mapped to the JD priorities>",
      "<Paragraph 3: alignment with missing keywords / company mission and polite call to action>"
    ],
    "signOff": "Sincerely,"
  }`);
    }
    if (includeInterviewPrep) {
      schemaSections.push(`  "interviewPrep": [
    {
      "question": "<specific tailored interview question>",
      "category": "Technical | Behavioral | System Design | Gap Probe",
      "targetingGap": "<specific weakness, missing keyword, or JD requirement this probes>",
      "whyAsked": "<1 sentence on what the interviewer is evaluating>",
      "talkingPoints": ["<concrete talking point 1>", "<concrete talking point 2>", "<concrete talking point 3>"],
      "sampleOpener": "<confident 1-2 sentence opening answer grounded in candidate background>"
    }
  ]`);
    }

    const prompt = `
You are an Executive Career Coach, Technical Hiring Manager, and Former FAANG Recruiter.
Generate a highly personalized Career Kit based ONLY on the candidate's real resume and the target Job Description.

CANDIDATE NAME: ${contact.name}
TARGET ROLE: ${jobTitle || "Specified in Job Description"}
TARGET COMPANY: ${company || "Target Organization"}
TARGET TRACK: ${track || "General"}
IDENTIFIED WEAKNESSES / GAPS: ${weaknesses.length > 0 ? weaknesses.join(" | ") : "None explicitly flagged; probe depth against JD."}
MISSING ATS KEYWORDS: ${missingKeywords.length > 0 ? missingKeywords.join(", ") : "Align closely with JD core competencies."}

CANDIDATE RESUME:
"""
${resumeText.slice(0, 12000)}
"""

TARGET JOB DESCRIPTION:
"""
${jobDescription.slice(0, 8000)}
"""

REQUIREMENTS:
${includeCoverLetter ? `- For "coverLetter": Write 3 crisp, authentic, non-generic paragraphs grounded in real details from the resume. Do NOT fabricate employers, degrees, or fake metrics.` : ""}
${includeInterviewPrep ? `- For "interviewPrep": Generate EXACTLY 5 tailored interview questions covering a smart mix of "Gap Probe", "Technical", "System Design", and "Behavioral" categories that directly challenge the candidate's weak areas / missing keywords against the target JD.` : ""}
- Return ONLY valid JSON (no markdown fences) matching this schema:
{
${schemaSections.join(",\n")}
}
`;

    let parsedAI: RawCareerKitAIResponse | null = null;
    let aiCached = false;
    try {
      const aiMeta = await generateAIResponseWithMeta(prompt);
      aiCached = aiMeta.cached;
      const parsed = JSON.parse(aiMeta.text);
      if (parsed && typeof parsed === "object") {
        parsedAI = parsed as RawCareerKitAIResponse;
      }
    } catch (aiErr) {
      console.warn("[career-kit] Falling back to deterministic career kit:", aiErr);
    }

    const responsePayload: {
      coverLetter?: CoverLetterOutput;
      interviewPrep?: InterviewQuestionOutput[];
    } = {};

    if (includeCoverLetter) {
      const fallbackCL = buildFallbackCoverLetter({
        candidateName: contact.name,
        email: contact.email,
        phone: contact.phone,
        jobTitle,
        company,
        track,
        missingKeywords,
        weaknesses,
      });

      const rawCL = parsedAI?.coverLetter;
      const subject =
        typeof rawCL?.subject === "string" && rawCL.subject.trim()
          ? rawCL.subject.trim()
          : fallbackCL.subject;
      const salutation =
        typeof rawCL?.salutation === "string" && rawCL.salutation.trim()
          ? rawCL.salutation.trim()
          : fallbackCL.salutation;
      const rawParagraphs = normalizeStringArray(rawCL?.paragraphs, 5).map((p) =>
        p.slice(0, 1800)
      );
      const paragraphs = rawParagraphs.length >= 2 ? rawParagraphs : fallbackCL.paragraphs;

      let signOff =
        typeof rawCL?.signOff === "string" && rawCL.signOff.trim()
          ? rawCL.signOff.trim()
          : "Sincerely,";
      if (signOff.includes("\n")) {
        signOff = signOff.split("\n")[0].trim() || "Sincerely,";
      }

      const fullText = [
        `Subject: ${subject}`,
        salutation,
        ...paragraphs,
        `${signOff}\n${contact.name}`,
      ].join("\n\n");

      const latexSource = buildCoverLetterLatex({
        candidateName: contact.name,
        email: contact.email,
        phone: contact.phone,
        company,
        subject,
        salutation,
        paragraphs,
        signOff,
      });

      responsePayload.coverLetter = {
        subject,
        salutation,
        paragraphs,
        signOff,
        fullText,
        latexSource,
      };
    }

    if (includeInterviewPrep) {
      const fallbackPrep = buildFallbackInterviewPrep({
        jobTitle,
        company,
        track,
        weaknesses,
        missingKeywords,
      });

      const rawItems = Array.isArray(parsedAI?.interviewPrep) ? parsedAI.interviewPrep : [];
      const sanitized: InterviewQuestionOutput[] = [];

      for (const item of rawItems) {
        if (!item || typeof item !== "object") continue;
        const rec = item as Record<string, unknown>;
        const question = typeof rec.question === "string" ? rec.question.trim() : "";
        if (!question) continue;

        const talkingPoints = normalizeStringArray(rec.talkingPoints, 5);
        sanitized.push({
          question,
          category: normalizeCategory(rec.category),
          targetingGap:
            typeof rec.targetingGap === "string" && rec.targetingGap.trim()
              ? rec.targetingGap.trim()
              : missingKeywords[0] || weaknesses[0] || "Role alignment",
          whyAsked:
            typeof rec.whyAsked === "string" && rec.whyAsked.trim()
              ? rec.whyAsked.trim()
              : "Evaluates technical depth and practical judgment for this requirement.",
          talkingPoints:
            talkingPoints.length > 0
              ? talkingPoints
              : ["Anchor your response with a concrete project example and measurable outcome"],
          sampleOpener:
            typeof rec.sampleOpener === "string" && rec.sampleOpener.trim()
              ? rec.sampleOpener.trim()
              : "In a recent project with similar constraints, I approached this by...",
        });
        if (sanitized.length === 5) break;
      }

      while (sanitized.length < 5) {
        sanitized.push(fallbackPrep[sanitized.length]);
      }

      responsePayload.interviewPrep = sanitized;
    }

    const nextQuota = await authGate.consume(aiCached ? 0 : 1);
    return NextResponse.json(responsePayload, {
      headers: buildQuotaHeaders(nextQuota),
    });
  } catch (error) {
    console.error("[career-kit] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to generate career kit. Please try again." },
      { status: 500 }
    );
  }
}
