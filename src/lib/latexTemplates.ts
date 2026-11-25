import { ResumeData } from "@/components/pdf/ResumeDocument";

export type LatexTemplateId = "jakes" | "executive" | "modern-accent";

export interface LatexTemplateInfo {
  id: LatexTemplateId;
  name: string;
  subtitle: string;
  badge: string;
}

export const LATEX_TEMPLATES: LatexTemplateInfo[] = [
  {
    id: "jakes",
    name: "Jake's Resume (Overleaf)",
    subtitle: "Industry-standard CS & engineering LaTeX layout",
    badge: "Most Popular",
  },
  {
    id: "modern-accent",
    name: "Modern Indigo TeX",
    subtitle: "Clean navy accents with crisp Computer Modern typography",
    badge: "Modern",
  },
  {
    id: "executive",
    name: "Executive Compact Serif",
    subtitle: "Dense 10pt Harvard/Wall-Street style layout",
    badge: "1-Page Dense",
  },
];

const LATEX_ESCAPE_MAP: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "{": "\\{",
  "}": "\\}",
  "$": "\\$",
  "&": "\\&",
  "%": "\\%",
  "#": "\\#",
  "_": "\\_",
  "^": "\\textasciicircum{}",
  "~": "\\textasciitilde{}",
};

/**
 * Escapes special LaTeX characters in a single pass so arbitrary plain text
 * (%, &, $, #, _, ~, ^, \, {, }) compiles cleanly in pdfTeX / TeX Live.
 */
export function escapeLatex(text?: string): string {
  if (!text) return "";
  return text
    .replace(/[\\{}$&%#_^~]/g, (ch) => LATEX_ESCAPE_MAP[ch] || ch)
    .replace(/–/g, "--")
    .replace(/—/g, "---")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes a display URL cleanly for link text and ensures an https/mailto href.
 */
function formatLatexLink(raw: string, fallbackPrefix = "https://"): { href: string; label: string } {
  const clean = raw.trim();
  const label = escapeLatex(clean.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""));
  const href = /^https?:\/\/|^mailto:/i.test(clean) ? clean : `${fallbackPrefix}${clean}`;
  return { href, label };
}

function stripBulletPrefix(text: string): string {
  return text.replace(/^[-•*–—\s]+/, "").trim();
}

/**
 * Generates an authentic, self-contained, Overleaf-compilable .tex resume
 * from structured ResumeData.
 */
export function generateLatexFromResumeData(
  data: ResumeData,
  templateId: LatexTemplateId = "jakes"
): string {
  const p = data.personalInfo || {};
  const name = escapeLatex(p.name || "Your Name");

  // Build header contact bar items separated by $|$
  const contactItems: string[] = [];
  if (p.phone) contactItems.push(escapeLatex(p.phone));
  if (p.email) {
    const emailEsc = escapeLatex(p.email);
    contactItems.push(`\\href{mailto:${p.email.trim()}}{\\underline{${emailEsc}}}`);
  }
  if (p.location) contactItems.push(escapeLatex(p.location));
  if (p.linkedin) {
    const { href, label } = formatLatexLink(p.linkedin);
    contactItems.push(`\\href{${href}}{\\underline{${label}}}`);
  }
  if (p.github) {
    const { href, label } = formatLatexLink(p.github);
    contactItems.push(`\\href{${href}}{\\underline{${label}}}`);
  }
  if (p.portfolio) {
    const { href, label } = formatLatexLink(p.portfolio);
    contactItems.push(`\\href{${href}}{\\underline{${label}}}`);
  }

  const fontSize = templateId === "executive" ? "10pt" : "11pt";
  const accentDef =
    templateId === "modern-accent"
      ? "\\definecolor{accent}{RGB}{30, 58, 138}"
      : "\\definecolor{accent}{RGB}{0, 0, 0}";
  const sectionFormat =
    templateId === "modern-accent"
      ? "\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries\\color{accent}}{}{0em}{}[\\color{accent}\\titlerule \\vspace{-5pt}]"
      : "\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]";
  const hyperSetup =
    templateId === "modern-accent"
      ? "\\usepackage[colorlinks=true, urlcolor=accent, linkcolor=accent]{hyperref}"
      : "\\usepackage[hidelinks]{hyperref}";

  const lines: string[] = [
    `%-------------------------`,
    `% Overleaf-Ready ATS Resume (TeX Live / pdfLaTeX)`,
    `% Template: ${LATEX_TEMPLATES.find((t) => t.id === templateId)?.name || "Jake's Resume"}`,
    `%-------------------------`,
    ``,
    `\\documentclass[letterpaper,${fontSize}]{article}`,
    ``,
    `\\usepackage{latexsym}`,
    `\\usepackage[empty]{fullpage}`,
    `\\usepackage{titlesec}`,
    `\\usepackage{marvosym}`,
    `\\usepackage[usenames,dvipsnames]{color}`,
    `\\usepackage{xcolor}`,
    `\\usepackage{verbatim}`,
    `\\usepackage{enumitem}`,
    hyperSetup,
    `\\usepackage{fancyhdr}`,
    `\\usepackage[english]{babel}`,
    `\\usepackage{tabularx}`,
    `\\input{glyphtounicode}`,
    ``,
    `\\pagestyle{fancy}`,
    `\\fancyhf{}`,
    `\\fancyfoot{}`,
    `\\renewcommand{\\headrulewidth}{0pt}`,
    `\\renewcommand{\\footrulewidth}{0pt}`,
    ``,
    `% Adjust margins`,
    `\\addtolength{\\oddsidemargin}{-0.5in}`,
    `\\addtolength{\\evensidemargin}{-0.5in}`,
    `\\addtolength{\\textwidth}{1in}`,
    `\\addtolength{\\topmargin}{-0.55in}`,
    `\\addtolength{\\textheight}{1.1in}`,
    ``,
    `\\urlstyle{same}`,
    `\\raggedbottom`,
    `\\raggedright`,
    `\\setlength{\\tabcolsep}{0in}`,
    accentDef,
    ``,
    `% Section formatting`,
    sectionFormat,
    ``,
    `% Ensure PDF text is ATS machine-readable`,
    `\\pdfgentounicode=1`,
    ``,
    `% Custom commands`,
    `\\newcommand{\\resumeItem}[1]{`,
    `  \\item\\small{`,
    `    {#1 \\vspace{-2pt}}`,
    `  }`,
    `}`,
    ``,
    `\\newcommand{\\resumeSubheading}[4]{`,
    `  \\vspace{-2pt}\\item`,
    `    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}`,
    `      \\textbf{#1} & #2 \\\\`,
    `      \\textit{\\small#3} & \\textit{\\small #4} \\\\`,
    `    \\end{tabular*}\\vspace{-7pt}`,
    `}`,
    ``,
    `\\newcommand{\\resumeProjectHeading}[2]{`,
    `    \\item`,
    `    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}`,
    `      \\small#1 & #2 \\\\`,
    `    \\end{tabular*}\\vspace{-7pt}`,
    `}`,
    ``,
    `\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}`,
    `\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}`,
    `\\newcommand{\\resumeItemListStart}{\\begin{itemize}}`,
    `\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}`,
    ``,
    `%-------------------------------------------`,
    `%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%`,
    `\\begin{document}`,
    ``,
    `%----------HEADING----------`,
    `\\begin{center}`,
    `    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{2pt}`,
    `    \\small ${contactItems.join(" $|$ ") || "email@example.com"}`,
    `\\end{center}`,
    ``,
  ];

  // Summary (optional or included if executive template)
  if (data.summary && data.summary.trim().length > 0) {
    lines.push(
      `%-----------SUMMARY-----------`,
      `\\section{Summary}`,
      `\\begin{itemize}[leftmargin=0.15in, label={}]`,
      `  \\small{\\item{${escapeLatex(data.summary)}}}`,
      `\\end{itemize}`,
      ``
    );
  }

  // Experience first for executive/experienced, Education first for jakes (standard Jake's puts Education first or Experience if senior)
  const addEducation = () => {
    if (!data.education || data.education.length === 0) return;
    lines.push(`%-----------EDUCATION-----------`, `\\section{Education}`, `  \\resumeSubHeadingListStart`);
    for (const edu of data.education) {
      const degreeStr = edu.gpa
        ? `${edu.degree || ""}${edu.degree?.toLowerCase().includes("gpa") ? "" : `; GPA: ${edu.gpa}`}`
        : edu.degree || "";
      lines.push(
        `    \\resumeSubheading`,
        `      {${escapeLatex(edu.institution || "University Name")}}{${escapeLatex(edu.location || "")}}`,
        `      {${escapeLatex(degreeStr)}}{${escapeLatex(edu.date || "")}}`
      );
      if (edu.bullets && edu.bullets.length > 0) {
        lines.push(`      \\resumeItemListStart`);
        for (const b of edu.bullets) {
          const cleanB = stripBulletPrefix(b);
          if (cleanB) lines.push(`        \\resumeItem{${escapeLatex(cleanB)}}`);
        }
        lines.push(`      \\resumeItemListEnd`);
      }
    }
    lines.push(`  \\resumeSubHeadingListEnd`, ``);
  };

  const addExperience = () => {
    if (!data.experience || data.experience.length === 0) return;
    lines.push(`%-----------EXPERIENCE-----------`, `\\section{Experience}`, `  \\resumeSubHeadingListStart`);
    for (const exp of data.experience) {
      lines.push(
        `    \\resumeSubheading`,
        `      {${escapeLatex(exp.role || exp.company || "Software Engineer")}}{${escapeLatex(exp.date || "")}}`,
        `      {${escapeLatex(exp.company || "")}}{${escapeLatex(exp.location || "")}}`
      );
      if (exp.bullets && exp.bullets.length > 0) {
        lines.push(`      \\resumeItemListStart`);
        for (const b of exp.bullets) {
          const cleanB = stripBulletPrefix(b);
          if (cleanB) lines.push(`        \\resumeItem{${escapeLatex(cleanB)}}`);
        }
        lines.push(`      \\resumeItemListEnd`);
      }
    }
    lines.push(`  \\resumeSubHeadingListEnd`, ``);
  };

  if (templateId === "executive") {
    addExperience();
    addEducation();
  } else {
    addEducation();
    addExperience();
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    lines.push(`%-----------PROJECTS-----------`, `\\section{Projects}`, `  \\resumeSubHeadingListStart`);
    for (const proj of data.projects) {
      const titleLeft = proj.description
        ? `\\textbf{${escapeLatex(proj.name || "Project")}} $|$ \\emph{${escapeLatex(proj.description)}}`
        : `\\textbf{${escapeLatex(proj.name || "Project")}}`;
      lines.push(
        `    \\resumeProjectHeading`,
        `      {${titleLeft}}{${escapeLatex(proj.date || "")}}`
      );
      if (proj.bullets && proj.bullets.length > 0) {
        lines.push(`      \\resumeItemListStart`);
        for (const b of proj.bullets) {
          const cleanB = stripBulletPrefix(b);
          if (cleanB) lines.push(`        \\resumeItem{${escapeLatex(cleanB)}}`);
        }
        lines.push(`      \\resumeItemListEnd`);
      }
    }
    lines.push(`  \\resumeSubHeadingListEnd`, ``);
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    lines.push(
      `%-----------TECHNICAL SKILLS-----------`,
      `\\section{Technical Skills}`,
      ` \\begin{itemize}[leftmargin=0.15in, label={}]`,
      `    \\small{\\item{`
    );
    data.skills.forEach((cat, idx) => {
      const isLast = idx === data.skills!.length - 1;
      const itemsStr = escapeLatex((cat.items || []).join(", "));
      const catStr = escapeLatex(cat.category || "Skills");
      lines.push(`     \\textbf{${catStr}}{: ${itemsStr}}${isLast ? "" : " \\\\"}`);
    });
    lines.push(`    }}`, ` \\end{itemize}`, ``);
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    lines.push(`%-----------CERTIFICATIONS-----------`, `\\section{Certifications}`, `  \\resumeSubHeadingListStart`);
    for (const cert of data.certifications) {
      lines.push(
        `    \\resumeProjectHeading`,
        `      {\\textbf{${escapeLatex(cert.name || "")}}${cert.issuer ? ` -- \\emph{${escapeLatex(cert.issuer)}}` : ""}}{${escapeLatex(cert.date || "")}}`
      );
    }
    lines.push(`  \\resumeSubHeadingListEnd`, ``);
  }

  // Custom sections
  if (data.customSections && data.customSections.length > 0) {
    for (const sec of data.customSections) {
      lines.push(`%-----------${(sec.title || "ADDITIONAL").toUpperCase()}-----------`, `\\section{${escapeLatex(sec.title || "Additional")}}`);
      if (sec.bullets && sec.bullets.length > 0) {
        lines.push(`  \\resumeSubHeadingListStart`, `    \\resumeItemListStart`);
        for (const b of sec.bullets) {
          const cleanB = stripBulletPrefix(b);
          if (cleanB) lines.push(`      \\resumeItem{${escapeLatex(cleanB)}}`);
        }
        lines.push(`    \\resumeItemListEnd`, `  \\resumeSubHeadingListEnd`, ``);
      } else if (sec.content) {
        lines.push(`  \\small{${escapeLatex(sec.content)}}`, ``);
      }
    }
  }

  lines.push(`\\end{document}`, ``);
  return lines.join("\n");
}

/**
 * Formats a plain-text AI bullet as an escaped LaTeX \resumeItem{...}.
 */
export function formatAsResumeItem(plainText: string): string {
  const clean = stripBulletPrefix(plainText);
  return `\\resumeItem{${escapeLatex(clean)}}`;
}

/**
 * Attempts to replace a plain-text original bullet inside a .tex document
 * (matching either raw plain text or its LaTeX-escaped representation) with the
 * improved XYZ bullet. Falls back to inserting under \section{Experience} if no match.
 */
export function applyBulletUpgradeToTex(
  texSource: string,
  originalPlain: string,
  improvedPlain: string
): { updated: string; mode: "replaced" | "inserted" } {
  const cleanOriginal = stripBulletPrefix(originalPlain);
  const escapedOriginal = escapeLatex(cleanOriginal);
  const escapedImproved = escapeLatex(stripBulletPrefix(improvedPlain));

  // Direct substring match (plain or escaped)
  if (escapedOriginal && texSource.includes(escapedOriginal)) {
    return {
      updated: texSource.replace(escapedOriginal, escapedImproved),
      mode: "replaced",
    };
  }
  if (cleanOriginal && texSource.includes(cleanOriginal)) {
    return {
      updated: texSource.replace(cleanOriginal, escapedImproved),
      mode: "replaced",
    };
  }

  // Fuzzy prefix match inside \resumeItem{...}
  const prefix = escapedOriginal.slice(0, Math.min(35, escapedOriginal.length)).toLowerCase();
  if (prefix.length >= 12) {
    const resumeItemRegex = /\\resumeItem\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
    let match: RegExpExecArray | null;
    while ((match = resumeItemRegex.exec(texSource)) !== null) {
      const inner = match[1];
      if (inner.toLowerCase().includes(prefix)) {
        const replaced =
          texSource.slice(0, match.index) +
          `\\resumeItem{${escapedImproved}}` +
          texSource.slice(match.index + match[0].length);
        return { updated: replaced, mode: "replaced" };
      }
    }
  }

  // Fallback: insert right after the first \resumeItemListStart under Experience
  const expIdx = texSource.search(/\\section\{Experience\}/i);
  if (expIdx !== -1) {
    const afterExp = texSource.slice(expIdx);
    const listMatch = /\\resumeItemListStart/.exec(afterExp);
    if (listMatch) {
      const insertPos = expIdx + listMatch.index + listMatch[0].length;
      return {
        updated:
          texSource.slice(0, insertPos) +
          `\n        \\resumeItem{${escapedImproved}}` +
          texSource.slice(insertPos),
        mode: "inserted",
      };
    }
  }

  // Final fallback: append before \end{document}
  const endDocIdx = texSource.lastIndexOf("\\end{document}");
  if (endDocIdx !== -1) {
    return {
      updated:
        texSource.slice(0, endDocIdx) +
        `\n% Added AI Bullet\n% \\resumeItem{${escapedImproved}}\n` +
        texSource.slice(endDocIdx),
      mode: "inserted",
    };
  }

  return { updated: texSource + `\n\\resumeItem{${escapedImproved}}\n`, mode: "inserted" };
}

/**
 * Adds a missing keyword into the \section{Technical Skills} block cleanly.
 */
export function addKeywordToTexSkills(
  texSource: string,
  keyword: string
): { updated: string; added: boolean } {
  const escKw = escapeLatex(keyword.trim());
  if (!escKw) return { updated: texSource, added: false };

  // Avoid duplicates
  if (texSource.toLowerCase().includes(escKw.toLowerCase())) {
    return { updated: texSource, added: false };
  }

  // Look for first \textbf{...}{: items} in skills
  const skillMatch = /(\\textbf\{[^}]+\}\{:[^}]*)(\})/.exec(texSource);
  if (skillMatch) {
    const beforeClose = skillMatch[1];
    const insertIdx = skillMatch.index + beforeClose.length;
    const sep = beforeClose.trim().endsWith(":") ? " " : ", ";
    return {
      updated: texSource.slice(0, insertIdx) + `${sep}${escKw}` + texSource.slice(insertIdx),
      added: true,
    };
  }

  return { updated: texSource, added: false };
}
