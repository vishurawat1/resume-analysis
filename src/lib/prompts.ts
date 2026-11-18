/**
 * Enhanced Prompts for High-Precision ATS Resume Analysis and JD Matching.
 */

/**
 * Enhanced Prompts for High-Precision ATS Resume Analysis, Commute Intelligence, and Company Verification.
 */

export interface AnalysisMetadata {
  company?: string;
  location?: string;
  jobTitle?: string;
}

export const getResumeAnalysisPrompt = (
  resumeText: string,
  jobDescription: string,
  metadata?: AnalysisMetadata
) => `
You are an elite ATS (Applicant Tracking System) Algorithm Architect, Principal Technical Recruiter, and Senior Career Intelligence Strategist.
Your objective is to perform an exceptionally rigorous, high-precision analysis of the provided RESUME against the target JOB DESCRIPTION (JD).

${metadata?.company ? `Target Company: "${metadata.company}"` : ""}
${metadata?.location ? `Target Job Location: "${metadata.location}"` : ""}
${metadata?.jobTitle ? `Target Job Title: "${metadata.jobTitle}"` : ""}

### COMPREHENSIVE MULTI-DIMENSIONAL EVALUATION:

1. OBJECTIVE ATS SCORING & FIT (0-100):
   - "overallScore": Integer (0-100) based on hard skills match (40%), experience scope (25%), measurable quantification (15%), keyword density (10%), and structure (10%).
   - "roleFitAnalysis": 3-4 sentence authoritative assessment detailing qualifications match, primary gaps, and screening strategy.
   - "sectionScores": Object with exact keys: "Experience", "Skills", "Education", "Projects", "Formatting", "KeywordOptimization" (each 0-100).
   - "weaknesses": 3 to 5 specific, evidence-backed bullet points.
   - "strengths": 3 to 5 distinct, evidence-based bullet points.
   - "keywordAnalysis": { "missing": ["skill1", ...], "density": 0-100 }.
   - "suggestions": 3 to 5 bullet point improvements with exact verbatim "original", Google XYZ formula "improved", "reason", and "impact" ("High", "Critical", "Medium").
   - "improvementImpact": Integer (10-25) estimated score gain if suggestions are accepted.

2. LOCATION & COMMUTE INTELLIGENCE:
   - Extract candidate's location from the resume (e.g. City, Country, or "Not specified").
   - Extract or use the target job location (from target metadata or JD).
   - Detect "workModel": "Remote" | "Hybrid" | "On-Site" | "Flexible" | "Unknown".
   - Evaluate "commuteFeasibility": "Local / Feasible" | "Manageable Commute" | "Relocation Required" | "Intercontinental / Remote Only" | "Out of this World / Unrealistic" | "Fully Remote".
   - "distanceEstimate": E.g. "Local (< 25 km)", "~1,500 km (Domestic Relocation)", "~8,500 km (Intercontinental)", or "Interplanetary / 400,000+ km" if location is space/mars/fictional.
   - "verdict": A candid, direct, and witty/smart assessment for the candidate:
       * IF target location is "space", "Mars", "Moon", a fantasy location, or completely absurd: Humorously call it out! (E.g. "Bro, this job is literally in Outer Space! 🚀 Unless you have a SpaceX Starship on standby, this commute is out of this world! Check if remote work from Earth is permitted.")
       * IF candidate is in a different city or country and the role is on-site: Tell them directly that it's far from their place and requires relocation or remote negotiation (e.g. "Bro, you're based in [Candidate City] and this job is in [Job City] (~[Distance]). That's way too far for a daily commute—unless they offer full visa/relocation sponsorship or remote flexibility, this requires moving.")
       * IF role is remote or in candidate's home city: Confirm it's a great local or remote match.
   - "relocationAdvice": Practical advice on commute feasibility, cost of living impact, or visa notes.

3. COMPANY LEGITIMACY & INTELLIGENCE:
   - Identify the company name from target metadata or the JD text.
   - "legitimacyStatus": "Verified Enterprise" | "Established Tech Startup" | "Boutique / Early-Stage" | "Unverified / Caution" | "High Risk / Suspicious".
   - "legitimacyScore": Integer (0-100) reflecting credibility and job legitimacy.
   - "industry": Industry vertical (e.g., "Enterprise Cloud & AI", "Fintech / Payments", "E-commerce", "Consulting", "Unknown").
   - "estimatedTier": "Fortune 500 / Big Tech" | "Unicorn / High-Growth" | "Early Stage Startup" | "Agency / Consultancy" | "Unknown / Phantom".
   - "overview": 1-2 sentence summary of what the company does and its market standing.
   - "greenFlags": Array of 2 to 4 positive credibility indicators from the JD (e.g. "Transparent salary range provided", "Established technology stack", "Clear reporting hierarchy", "Legitimate corporate email and domain").
   - "redFlags": Array of any suspicious indicators (e.g. "Vague role responsibilities", "Requests upfront money/equipment purchase", "Unrealistic earning claims", "Generic free-mail recruiter contact", or empty array if company is fully legit).
   - "verdict": Plain-English verdict on whether the company is legitimate, safe, and reputable to apply to.

4. SENIORITY & SALARY MARKET INSIGHTS:
   - "candidateLevel": "Junior (0-2 yrs)" | "Mid-Level (3-5 yrs)" | "Senior (5-8 yrs)" | "Staff / Lead (8+ yrs)"
   - "jobLevel": "Entry Level" | "Mid-Level" | "Senior" | "Lead / Staff" | "Director / Executive"
   - "fitVerdict": "Perfect Seniority Match" | "Stretch / Ambitious Role" | "Overqualified"
   - "estimatedSalaryRange": Typical market compensation for this title/location (e.g., "$120,000 - $155,000 / year" or "₹16L - ₹24L / year" or "Competitive / Based on Experience").

Return ONLY a valid JSON object matching this structure with NO markdown fences, no conversational text:
{
  "overallScore": <integer 0-100>,
  "roleFitAnalysis": "<in-depth 3-4 sentence analysis>",
  "sectionScores": {
    "Experience": <integer 0-100>,
    "Skills": <integer 0-100>,
    "Education": <integer 0-100>,
    "Projects": <integer 0-100>,
    "Formatting": <integer 0-100>,
    "KeywordOptimization": <integer 0-100>
  },
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "suggestions": [
    {
      "original": "<exact verbatim substring from resume>",
      "improved": "<XYZ formula rewrite>",
      "reason": "<specific rationale>",
      "impact": "High"
    }
  ],
  "keywordAnalysis": {
    "missing": ["<missing skill 1>", "<missing skill 2>"],
    "density": <integer 0-100>
  },
  "improvementImpact": <integer 10-25>,
  "locationIntelligence": {
    "candidateLocation": "<extracted or detected location>",
    "jobLocation": "<target job location>",
    "workModel": "Remote" | "Hybrid" | "On-Site" | "Flexible" | "Unknown",
    "commuteFeasibility": "Local / Feasible" | "Manageable Commute" | "Relocation Required" | "Intercontinental / Remote Only" | "Out of this World / Unrealistic" | "Fully Remote",
    "distanceEstimate": "<distance estimate>",
    "verdict": "<witty and informative verdict>",
    "relocationAdvice": "<relocation/visa advice>"
  },
  "companyIntelligence": {
    "name": "<company name>",
    "legitimacyStatus": "Verified Enterprise" | "Established Tech Startup" | "Boutique / Early-Stage" | "Unverified / Caution" | "High Risk / Suspicious",
    "legitimacyScore": <integer 0-100>,
    "industry": "<industry>",
    "estimatedTier": "<tier>",
    "overview": "<1-2 sentence overview>",
    "greenFlags": ["<flag 1>", "<flag 2>"],
    "redFlags": ["<flag 1>"],
    "verdict": "<company legitimacy verdict>"
  },
  "seniorityFit": {
    "candidateLevel": "<candidate level>",
    "jobLevel": "<job level>",
    "fitVerdict": "<fit verdict>",
    "estimatedSalaryRange": "<salary range>"
  }
}

--- TARGET JOB DESCRIPTION ---
${jobDescription}

--- CANDIDATE RESUME TEXT ---
${resumeText}
`;

export const getResumeReviewPrompt = (resumeText: string) => `
You are a Principal Executive Resume Strategist and Former Silicon Valley Tech Recruiting Lead.
Evaluate the following resume holistically for maximum ATS pass-through and hiring manager conversion.

### COMPREHENSIVE CRITIQUE RUBRIC:
1. Impact & Quantification (35%): Do bullets follow the Google XYZ formula ("Accomplished [X] as measured by [Y] by doing [Z]")? Are numbers, metrics, percentages, revenue, or scale presented?
2. Action Verb Hierarchy (25%): Are bullets frontloaded with strong, commanding action verbs (e.g., Architected, Spearheaded, Engineered, Scaled, Overhauled) rather than weak passive phrasing (e.g., "Responsible for", "Assisted in", "Worked on")?
3. Technical Depth & Skill Organization (20%): Are core proficiencies structured clearly into logical categories (Languages, Frameworks, Cloud, Databases, Tooling)?
4. Structure & ATS Formatting (20%): Standard section titles, clean chronological flow, optimal bullet length (1-2 lines), and absence of parsing barriers.

### OUTPUT SPECIFICATIONS:
- "score": Integer (0-100), calculated objectively from the rubric above.
- "summary": A compelling 3-4 sentence executive overview detailing the candidate's career level, core value proposition, key strengths, and highest-priority area to fix.
- "strengths": Exactly 3 to 5 specific, evidence-backed bullet points highlighting proven strengths in the candidate's experience.
- "weaknesses": Exactly 3 to 5 actionable critique points identifying missed opportunities, unquantified claims, or structural deficiencies.
- "recommended_addons": Exactly 4 to 6 strategic additions formatted as objects with:
    - "category": One of "Metrics & KPIs", "Leadership & Ownership", "Technical Stack", "ATS Formatting", "Executive Hook", or "Credentials".
    - "suggestion": A specific, highly actionable recommendation for what to add or modify.
- "suggestions": Exactly 3 to 5 bullet point improvements:
    - "original": MUST BE AN EXACT, VERBATIM SUBSTRING copied directly from the RESUME TEXT without changing any word or character.
    - "improved": Rewritten using Google's XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]") with strong action verbs and placeholder metrics (e.g., "by [X]%", "saving [$Y]").
    - "reason": Clear 1-sentence explanation of why the change elevates the resume.
    - "impact": "High" or "Critical".

Return ONLY a valid JSON object matching this structure:
{
  "score": <number 0-100>,
  "summary": "<compelling 3-4 sentence review>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "recommended_addons": [
    {
      "category": "<Category>",
      "suggestion": "<Actionable recommendation>"
    }
  ],
  "suggestions": [
    {
      "original": "<exact verbatim substring from resume>",
      "improved": "<XYZ formula rewrite>",
      "reason": "<explanation>",
      "impact": "High"
    }
  ]
}

RESUME TEXT:
"""
${resumeText}
"""
`;
