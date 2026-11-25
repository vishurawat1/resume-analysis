import { ResumeData } from "@/components/pdf/ResumeDocument";

export type LatexTemplateId =
  | "jakes"
  | "executive"
  | "modern-accent"
  | "academic"
  | "minimalist-clean"
  | "compact-density";

export const VALID_LATEX_TEMPLATE_IDS: ReadonlySet<LatexTemplateId> = new Set<LatexTemplateId>([
  "jakes",
  "executive",
  "modern-accent",
  "academic",
  "minimalist-clean",
  "compact-density",
]);

export function isValidLatexTemplateId(value: string | null | undefined): value is LatexTemplateId {
  return Boolean(value && VALID_LATEX_TEMPLATE_IDS.has(value as LatexTemplateId));
}

export interface LatexTemplateInfo {
  id: LatexTemplateId;
  name: string;
  subtitle: string;
  badge: string;
  tagline: string;
  audience: string;
  accentColor: string;
}

export const LATEX_TEMPLATES: LatexTemplateInfo[] = [
  {
    id: "jakes",
    name: "Engineering Classic (Jake's)",
    subtitle: "Industry-standard CS & engineering LaTeX layout",
    badge: "Most Popular",
    tagline: "Single-column Computer Modern layout trusted by Big Tech ATS scanners",
    audience: "SWE, Backend, Systems & New Grads",
    accentColor: "#18181b",
  },
  {
    id: "executive",
    name: "Executive / Product Leadership",
    subtitle: "Experience-first 10pt leadership & product format",
    badge: "Leadership",
    tagline: "Leads with Executive Summary & Experience to highlight scope and P&L impact",
    audience: "Product Managers, Eng Managers & Directors",
    accentColor: "#1f2937",
  },
  {
    id: "modern-accent",
    name: "Modern Tech Slate",
    subtitle: "Clean slate-indigo accent rules & clickable links",
    badge: "Modern",
    tagline: "Crisp left-aligned header with slate-indigo section rules and tinted URLs",
    audience: "Full-Stack, Frontend & Design Engineers",
    accentColor: "#1e3a8a",
  },
  {
    id: "academic",
    name: "Research & Data Science CV",
    subtitle: "Education, publications/research, projects & technical depth",
    badge: "Research CV",
    tagline: "Foregrounds Education, Research/Publications, and technical experimentation",
    audience: "ML/AI Engineers, Data Scientists & PhDs",
    accentColor: "#0f766e",
  },
  {
    id: "minimalist-clean",
    name: "Finance & Consulting (MBB)",
    subtitle: "Crisp MBB / Wall Street minimalist tabular typography",
    badge: "Wall Street",
    tagline: "Refined 0.4pt horizontal rules and classic black-and-white executive polish",
    audience: "Management Consulting, IB, FinTech & Strategy",
    accentColor: "#334155",
  },
  {
    id: "compact-density",
    name: "High-Density Full-Stack 1-Pager",
    subtitle: "Tight 1-page spacing with 2-column header & skills grid",
    badge: "1-Page Max",
    tagline: "Maximizes 1-page capacity with a compact 2-column header and skills matrix",
    audience: "Senior ICs & Multi-Project Builders",
    accentColor: "#059669",
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
  "<": "\\textless{}",
  ">": "\\textgreater{}",
};

/**
 * Escapes special LaTeX characters in a single pass so arbitrary plain text
 * (%, &, $, #, _, ~, ^, \, {, }, <, >) compiles cleanly in pdfTeX / TeX Live.
 */
export function escapeLatex(text?: string): string {
  if (!text) return "";
  return text
    .replace(/[\\{}$&%#_^~<>]/g, (ch) => LATEX_ESCAPE_MAP[ch] || ch)
    .replace(/–/g, "--")
    .replace(/—/g, "---")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes a display URL cleanly for link text and ensures an https/mailto href.
 */
function formatLatexLink(raw: string, fallbackPrefix = "https://"): { href: string; label: string } {
  const clean = raw.trim();
  const label = escapeLatex(clean.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""));
  const safeHrefRaw = clean.replace(/[%#\s]/g, "");
  const href = /^https?:\/\/|^mailto:/i.test(safeHrefRaw) ? safeHrefRaw : `${fallbackPrefix}${safeHrefRaw}`;
  return { href, label };
}

function stripBulletPrefix(text: string): string {
  return text.replace(/^[-•*–—\s]+/, "").trim();
}

function buildContactItems(p: NonNullable<ResumeData["personalInfo"]>): string[] {
  const items: string[] = [];
  if (p.phone) items.push(escapeLatex(p.phone));
  if (p.email) {
    const emailTrim = p.email.trim();
    const emailEsc = escapeLatex(emailTrim);
    items.push(`\\href{mailto:${emailTrim}}{\\underline{${emailEsc}}}`);
  }
  if (p.location) items.push(escapeLatex(p.location));
  if (p.linkedin) {
    const { href, label } = formatLatexLink(p.linkedin);
    items.push(`\\href{${href}}{\\underline{${label}}}`);
  }
  if (p.github) {
    const { href, label } = formatLatexLink(p.github);
    items.push(`\\href{${href}}{\\underline{${label}}}`);
  }
  if (p.portfolio) {
    const { href, label } = formatLatexLink(p.portfolio);
    items.push(`\\href{${href}}{\\underline{${label}}}`);
  }
  return items;
}

interface TemplateConfig {
  fontSize: "10pt" | "11pt";
  accentRgb: string;
  useColorLinks: boolean;
  margins: { oddside: string; textwidth: string; topmargin: string; textheight: string };
  sectionFormat: string;
  itemSep: string;
}

function getTemplateConfig(templateId: LatexTemplateId): TemplateConfig {
  switch (templateId) {
    case "executive":
      return {
        fontSize: "10pt",
        accentRgb: "31, 41, 55",
        useColorLinks: false,
        margins: { oddside: "-0.5in", textwidth: "1in", topmargin: "-0.55in", textheight: "1.1in" },
        sectionFormat:
          "\\titleformat{\\section}{\\vspace{-3pt}\\scshape\\raggedright\\large\\bfseries\\color{accent}}{}{0em}{}[\\color{accent}\\titlerule \\vspace{-4pt}]",
        itemSep: "-2pt",
      };
    case "modern-accent":
      return {
        fontSize: "11pt",
        accentRgb: "30, 58, 138",
        useColorLinks: true,
        margins: { oddside: "-0.5in", textwidth: "1in", topmargin: "-0.55in", textheight: "1.1in" },
        sectionFormat:
          "\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries\\color{accent}}{}{0em}{}[\\color{accent}\\titlerule \\vspace{-5pt}]",
        itemSep: "-2pt",
      };
    case "academic":
      return {
        fontSize: "10pt",
        accentRgb: "15, 118, 110",
        useColorLinks: true,
        margins: { oddside: "-0.5in", textwidth: "1in", topmargin: "-0.55in", textheight: "1.1in" },
        sectionFormat:
          "\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries\\color{accent}}{}{0em}{}[\\color{accent}\\titlerule \\vspace{-5pt}]",
        itemSep: "-2pt",
      };
    case "minimalist-clean":
      return {
        fontSize: "10pt",
        accentRgb: "51, 65, 85",
        useColorLinks: false,
        margins: { oddside: "-0.5in", textwidth: "1in", topmargin: "-0.55in", textheight: "1.1in" },
        sectionFormat:
          "\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\normalsize\\bfseries}{}{0em}{}[{\\color{black}\\titlerule[0.4pt]} \\vspace{-5pt}]",
        itemSep: "-2pt",
      };
    case "compact-density":
      return {
        fontSize: "10pt",
        accentRgb: "5, 150, 105",
        useColorLinks: true,
        margins: { oddside: "-0.6in", textwidth: "1.2in", topmargin: "-0.65in", textheight: "1.3in" },
        sectionFormat:
          "\\titleformat{\\section}{\\vspace{-5pt}\\scshape\\raggedright\\normalsize\\bfseries\\color{accent}}{}{0em}{}[\\color{accent}\\titlerule \\vspace{-6pt}]",
        itemSep: "-3pt",
      };
    case "jakes":
    default:
      return {
        fontSize: "11pt",
        accentRgb: "0, 0, 0",
        useColorLinks: false,
        margins: { oddside: "-0.5in", textwidth: "1in", topmargin: "-0.55in", textheight: "1.1in" },
        sectionFormat:
          "\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]",
        itemSep: "-2pt",
      };
  }
}

/**
 * Generates an authentic, self-contained, Overleaf-compilable .tex resume
 * from structured ResumeData across 6 ATS-verified templates.
 */
export function generateLatexFromResumeData(
  data: ResumeData,
  templateId: LatexTemplateId = "jakes"
): string {
  const p = data.personalInfo || {};
  const name = escapeLatex(p.name || "Your Name");
  const contactItems = buildContactItems(p);
  const cfg = getTemplateConfig(templateId);

  const hyperSetup = cfg.useColorLinks
    ? "\\usepackage[colorlinks=true, urlcolor=accent, linkcolor=accent]{hyperref}"
    : "\\usepackage[hidelinks]{hyperref}";

  const templateName = LATEX_TEMPLATES.find((t) => t.id === templateId)?.name || "Jake's Resume";
  const subheadingVspace = templateId === "compact-density" ? "-8pt" : "-7pt";
  const itemListEndVspace = templateId === "compact-density" ? "-6pt" : "-5pt";

  const lines: string[] = [
    `%-------------------------`,
    `% Overleaf-Ready ATS Resume (TeX Live / pdfLaTeX)`,
    `% Template: ${templateName}`,
    `%-------------------------`,
    ``,
    `\\documentclass[letterpaper,${cfg.fontSize}]{article}`,
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
    `\\addtolength{\\oddsidemargin}{${cfg.margins.oddside}}`,
    `\\addtolength{\\evensidemargin}{${cfg.margins.oddside}}`,
    `\\addtolength{\\textwidth}{${cfg.margins.textwidth}}`,
    `\\addtolength{\\topmargin}{${cfg.margins.topmargin}}`,
    `\\addtolength{\\textheight}{${cfg.margins.textheight}}`,
    ``,
    `\\urlstyle{same}`,
    `\\raggedbottom`,
    `\\raggedright`,
    `\\setlength{\\tabcolsep}{0in}`,
    `\\definecolor{accent}{RGB}{${cfg.accentRgb}}`,
    ``,
    `% Section formatting`,
    cfg.sectionFormat,
    ``,
    `% Ensure PDF text is ATS machine-readable`,
    `\\pdfgentounicode=1`,
    ``,
    `% Custom commands`,
    `\\newcommand{\\resumeItem}[1]{`,
    `  \\item\\small{`,
    `    {#1 \\vspace{${cfg.itemSep}}}`,
    `  }`,
    `}`,
    ``,
    `\\newcommand{\\resumeSubheading}[4]{`,
    `  \\vspace{-2pt}\\item`,
    `    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}`,
    `      \\textbf{#1} & #2 \\\\`,
    `      \\textit{\\small#3} & \\textit{\\small #4} \\\\`,
    `    \\end{tabular*}\\vspace{${subheadingVspace}}`,
    `}`,
    ``,
    `\\newcommand{\\resumeProjectHeading}[2]{`,
    `    \\item`,
    `    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}`,
    `      \\small#1 & #2 \\\\`,
    `    \\end{tabular*}\\vspace{${subheadingVspace}}`,
    `}`,
    ``,
    `\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}`,
    `\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}`,
    `\\newcommand{\\resumeItemListStart}{\\begin{itemize}}`,
    `\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{${itemListEndVspace}}}`,
    ``,
    `%-------------------------------------------`,
    `%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%`,
    `\\begin{document}`,
    ``,
  ];

  // Header layout tailored per template
  if (templateId === "modern-accent") {
    lines.push(
      `%----------HEADING----------`,
      `\\begin{flushleft}`,
      `    \\textbf{\\Huge \\scshape \\color{accent}${name}} \\\\ \\vspace{3pt}`,
      `    \\small ${contactItems.join(" $|$ ") || "email@example.com"}`,
      `\\end{flushleft}`,
      `\\vspace{-6pt}{\\color{accent}\\hrule height 1.2pt}\\vspace{4pt}`,
      ``
    );
  } else if (templateId === "minimalist-clean") {
    const locRight = p.location ? escapeLatex(p.location) : "";
    const minContacts = contactItems.filter((item) => item !== locRight);
    lines.push(
      `%----------HEADING----------`,
      `\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}`,
      `  \\textbf{\\LARGE ${name}} & \\small ${locRight} \\\\`,
      `\\end{tabular*}\\par\\vspace{2pt}`,
      `{\\small ${minContacts.join(" $|$ ") || "email@example.com"}}\\par`,
      `\\vspace{4pt}\\noindent\\rule{\\textwidth}{0.6pt}\\vspace{2pt}`,
      ``
    );
  } else if (templateId === "compact-density") {
    const leftSubParts: string[] = [];
    if (p.location) leftSubParts.push(escapeLatex(p.location));
    if (p.phone) leftSubParts.push(escapeLatex(p.phone));
    const linkParts: string[] = [];
    if (p.email) {
      const emailTrim = p.email.trim();
      linkParts.push(`\\href{mailto:${emailTrim}}{\\underline{${escapeLatex(emailTrim)}}}`);
    }
    if (p.linkedin) {
      const { href, label } = formatLatexLink(p.linkedin);
      linkParts.push(`\\href{${href}}{\\underline{${label}}}`);
    }
    if (p.github) {
      const { href, label } = formatLatexLink(p.github);
      linkParts.push(`\\href{${href}}{\\underline{${label}}}`);
    }
    if (p.portfolio) {
      const { href, label } = formatLatexLink(p.portfolio);
      linkParts.push(`\\href{${href}}{\\underline{${label}}}`);
    }
    const rightTop = linkParts.slice(0, 2).join(" $|$ ") || "email@example.com";
    const rightBottom = linkParts.slice(2).join(" $|$ ");
    lines.push(
      `%----------HEADING (COMPACT 2-COL)----------`,
      `\\begin{tabularx}{\\textwidth}{@{}X r@{}}`,
      `  \\textbf{\\LARGE \\scshape ${name}} & \\small ${rightTop} \\\\`,
      `  \\small ${leftSubParts.join(" $|$ ")} & \\small ${rightBottom} \\\\`,
      `\\end{tabularx}`,
      `\\vspace{-6pt}`,
      ``
    );
  } else {
    const sep = templateId === "executive" ? " $\\cdot$ " : " $|$ ";
    const headingFont = templateId === "executive" ? "\\LARGE \\bfseries \\scshape" : "\\Huge \\scshape";
    lines.push(
      `%----------HEADING----------`,
      `\\begin{center}`,
      `    \\textbf{${headingFont} ${name}} \\\\ \\vspace{2pt}`,
      `    \\small ${contactItems.join(sep) || "email@example.com"}`,
      `\\end{center}`,
      ``
    );
  }

  // Reusable section builders
  const addSummary = (title = "Summary") => {
    if (!data.summary || data.summary.trim().length === 0) return;
    lines.push(
      `%-----------SUMMARY-----------`,
      `\\section{${escapeLatex(title)}}`,
      `\\begin{itemize}[leftmargin=0.15in, label={}]`,
      `  \\small{\\item{${escapeLatex(data.summary)}}}`,
      `\\end{itemize}`,
      ``
    );
  };

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

  const addExperience = (sectionTitle = "Experience") => {
    if (!data.experience || data.experience.length === 0) return;
    lines.push(
      `%-----------EXPERIENCE-----------`,
      `\\section{${sectionTitle}}`,
      `  \\resumeSubHeadingListStart`
    );
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

  const addProjects = (sectionTitle = "Projects") => {
    if (!data.projects || data.projects.length === 0) return;
    lines.push(`%-----------PROJECTS-----------`, `\\section{${sectionTitle}}`, `  \\resumeSubHeadingListStart`);
    for (const proj of data.projects) {
      const projNameEsc = escapeLatex(proj.name || "Project");
      const projTitleNode = proj.link
        ? `\\href{${formatLatexLink(proj.link).href}}{\\textbf{${projNameEsc}}}`
        : `\\textbf{${projNameEsc}}`;
      const titleLeft = proj.description
        ? `${projTitleNode} $|$ \\emph{${escapeLatex(proj.description)}}`
        : projTitleNode;
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
  };

  const addSkills = () => {
    if (!data.skills || data.skills.length === 0) return;

    if (templateId === "compact-density" && data.skills.length >= 2) {
      lines.push(
        `%-----------TECHNICAL SKILLS (2-COL)-----------`,
        `\\section{Technical Skills}`,
        `\\vspace{-2pt}`,
        `\\begin{tabularx}{\\textwidth}{@{}X @{\\hspace{14pt}} X@{}}`
      );
      for (let i = 0; i < data.skills.length; i += 2) {
        const left = data.skills[i];
        const right = data.skills[i + 1];
        const leftCell = `\\small \\textbf{${escapeLatex(left.category || "Skills")}}{: ${escapeLatex((left.items || []).join(", "))}}`;
        const rightCell = right
          ? `\\small \\textbf{${escapeLatex(right.category || "Skills")}}{: ${escapeLatex((right.items || []).join(", "))}}`
          : "";
        lines.push(`  ${leftCell} & ${rightCell} \\\\`);
      }
      lines.push(`\\end{tabularx}`, `\\vspace{-4pt}`, ``);
      return;
    }

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
  };

  const addCertifications = () => {
    if (!data.certifications || data.certifications.length === 0) return;
    lines.push(`%-----------CERTIFICATIONS-----------`, `\\section{Certifications}`, `  \\resumeSubHeadingListStart`);
    for (const cert of data.certifications) {
      lines.push(
        `    \\resumeProjectHeading`,
        `      {\\textbf{${escapeLatex(cert.name || "")}}${cert.issuer ? ` -- \\emph{${escapeLatex(cert.issuer)}}` : ""}}{${escapeLatex(cert.date || "")}}`
      );
    }
    lines.push(`  \\resumeSubHeadingListEnd`, ``);
  };

  const addCustomSections = (sections = data.customSections) => {
    if (!sections || sections.length === 0) return;
    for (const sec of sections) {
      lines.push(
        `%-----------${(sec.title || "ADDITIONAL").toUpperCase()}-----------`,
        `\\section{${escapeLatex(sec.title || "Additional")}}`
      );
      if (sec.bullets && sec.bullets.length > 0) {
        lines.push(`  \\resumeSubHeadingListStart`, `    \\resumeItemListStart`);
        for (const b of sec.bullets) {
          const cleanB = stripBulletPrefix(b);
          if (cleanB) lines.push(`      \\resumeItem{${escapeLatex(cleanB)}}`);
        }
        lines.push(`    \\resumeItemListEnd`, `  \\resumeSubHeadingListEnd`, ``);
      } else if (sec.content) {
        lines.push(
          `  \\begin{itemize}[leftmargin=0.15in, label={}]`,
          `    \\small{\\item{${escapeLatex(sec.content)}}}`,
          `  \\end{itemize}`,
          ``
        );
      }
    }
  };

  // Template-specific section ordering
  if (templateId === "executive") {
    addSummary("Executive Summary");
    addExperience();
    addProjects();
    addSkills();
    addEducation();
    addCertifications();
    addCustomSections();
  } else if (templateId === "modern-accent") {
    addSummary("Summary");
    addExperience();
    addProjects();
    addSkills();
    addEducation();
    addCertifications();
    addCustomSections();
  } else if (templateId === "academic") {
    addSummary("Research Interests");
    addEducation();
    const researchRegex = /research|publication|paper|patent|teaching|award/i;
    const researchSections = (data.customSections || []).filter((s) => researchRegex.test(s.title || ""));
    const otherCustomSections = (data.customSections || []).filter((s) => !researchRegex.test(s.title || ""));
    addCustomSections(researchSections);
    addExperience("Research \\& Experience");
    addProjects("Selected Projects");
    addSkills();
    addCertifications();
    addCustomSections(otherCustomSections);
  } else if (templateId === "minimalist-clean") {
    addSummary("Profile");
    addExperience();
    addEducation();
    addProjects("Leadership \\& Projects");
    addSkills();
    addCertifications();
    addCustomSections();
  } else if (templateId === "compact-density") {
    addSummary("Summary");
    addExperience();
    addProjects();
    addSkills();
    addEducation();
    addCertifications();
    addCustomSections();
  } else {
    // "jakes"
    addSummary("Summary");
    addEducation();
    addExperience();
    addProjects();
    addSkills();
    addCertifications();
    addCustomSections();
  }

  lines.push(`\\end{document}`, ``);
  return lines.join("\n");
}

export interface CoverLetterTexInput {
  candidateName: string;
  email?: string;
  phone?: string;
  location?: string;
  company?: string;
  jobTitle?: string;
  salutation?: string;
  paragraphs: string[];
  signOff?: string;
}

/**
 * Generates an Overleaf-compilable, ATS-clean LaTeX Cover Letter using
 * standard TeX Live packages (pdflatex safe).
 */
export function generateCoverLetterLatex(input: CoverLetterTexInput): string {
  const nameEsc = escapeLatex(input.candidateName || "Your Name");
  const contactParts: string[] = [];
  if (input.phone) contactParts.push(escapeLatex(input.phone));
  if (input.email) {
    const emailTrim = input.email.trim();
    contactParts.push(`\\href{mailto:${emailTrim}}{\\underline{${escapeLatex(emailTrim)}}}`);
  }
  if (input.location) contactParts.push(escapeLatex(input.location));

  const companyEsc = escapeLatex(input.company || "Hiring Team");
  const roleEsc = escapeLatex(input.jobTitle || "");
  const salutationEsc = escapeLatex(input.salutation || "Dear Hiring Manager,");
  const signOffEsc = escapeLatex(input.signOff || "Sincerely,");
  const paragraphs = (input.paragraphs || []).filter((p) => p && p.trim().length > 0);

  const lines: string[] = [
    `%-------------------------`,
    `% Overleaf-Ready Cover Letter (TeX Live / pdfLaTeX)`,
    `%-------------------------`,
    ``,
    `\\documentclass[letterpaper,11pt]{article}`,
    ``,
    `\\usepackage{latexsym}`,
    `\\usepackage[empty]{fullpage}`,
    `\\usepackage{titlesec}`,
    `\\usepackage[usenames,dvipsnames]{color}`,
    `\\usepackage{xcolor}`,
    `\\usepackage{enumitem}`,
    `\\usepackage[hidelinks]{hyperref}`,
    `\\usepackage{fancyhdr}`,
    `\\usepackage[english]{babel}`,
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
    `\\raggedbottom`,
    `\\raggedright`,
    `\\setlength{\\parindent}{0pt}`,
    `\\pdfgentounicode=1`,
    `\\definecolor{accent}{RGB}{30, 58, 138}`,
    ``,
    `\\begin{document}`,
    ``,
    `%----------SENDER HEADER----------`,
    `\\begin{flushleft}`,
    `  \\textbf{\\LARGE \\scshape ${nameEsc}} \\\\ \\vspace{4pt}`,
    `  \\small ${contactParts.join(" $|$ ") || "email@example.com"}`,
    `\\end{flushleft}`,
    `\\vspace{2pt}{\\color{accent}\\hrule height 1pt}\\vspace{16pt}`,
    ``,
    `%----------DATE & RECIPIENT----------`,
    `\\today \\par\\vspace{12pt}`,
    `\\textbf{Hiring Team} \\\\`,
    `${companyEsc}${roleEsc ? ` \\\\\n\\textit{Re: Application for ${roleEsc}}` : ""}\\par`,
    `\\vspace{14pt}`,
    ``,
    `%----------SALUTATION----------`,
    `${salutationEsc}\\par`,
    `\\vspace{10pt}`,
    ``,
    `%----------BODY PARAGRAPHS----------`,
  ];

  if (paragraphs.length === 0) {
    lines.push(
      `I am writing to express my strong interest in${roleEsc ? ` the ${roleEsc} role` : " joining"}${input.company ? ` at ${companyEsc}` : ""}.`,
      ``
    );
  } else {
    for (const para of paragraphs) {
      lines.push(`${escapeLatex(para)}`, ``, `\\vspace{8pt}`, ``);
    }
  }

  lines.push(
    `%----------SIGN-OFF----------`,
    `\\vspace{8pt}`,
    `${signOffEsc} \\\\ \\vspace{16pt}`,
    `\\textbf{${nameEsc}}`,
    ``,
    `\\end{document}`,
    ``
  );

  return lines.join("\n");
}

export interface GithubRepoTexInput {
  name: string;
  htmlUrl?: string;
  description?: string;
  topics?: string[];
  xyzBullets?: string[];
  language?: string;
  stars?: number;
  updatedAt?: string;
}

/**
 * Formats a synced GitHub repository into a clean, pdflatex-safe
 * \resumeProjectHeading block with escaped Google XYZ bullets.
 */
export function formatGithubRepoToTex(input: GithubRepoTexInput): string {
  const safeName = escapeLatex(input.name || "GitHub Project");
  const titleNode = input.htmlUrl
    ? `\\href{${formatLatexLink(input.htmlUrl).href}}{\\textbf{${safeName}}}`
    : `\\textbf{${safeName}}`;

  const stackTags: string[] = [];
  if (input.language) stackTags.push(input.language);
  if (Array.isArray(input.topics)) {
    for (const t of input.topics) {
      if (t && !stackTags.some((existing) => existing.toLowerCase() === t.toLowerCase())) {
        stackTags.push(t);
      }
      if (stackTags.length >= 4) break;
    }
  }
  const techText =
    stackTags.length > 0
      ? escapeLatex(stackTags.join(", "))
      : escapeLatex((input.description || "Open Source").slice(0, 60));

  let rightMeta = "GitHub";
  if (input.updatedAt) {
    const yearMatch = /^(\d{4})/.exec(input.updatedAt);
    if (yearMatch) rightMeta = yearMatch[1];
  }

  const bullets =
    Array.isArray(input.xyzBullets) && input.xyzBullets.length > 0
      ? input.xyzBullets
      : input.description
        ? [input.description]
        : ["Built and maintained open-source project on GitHub."];

  const lines = [
    `    \\resumeProjectHeading`,
    `      {${titleNode} $|$ \\emph{${techText}}}{${escapeLatex(rightMeta)}}`,
    `      \\resumeItemListStart`,
  ];

  for (const b of bullets) {
    const clean = stripBulletPrefix(b);
    if (clean) {
      lines.push(`        \\resumeItem{${escapeLatex(clean)}}`);
    }
  }
  lines.push(`      \\resumeItemListEnd`);

  return lines.join("\n");
}

export interface TexEscapeWarning {
  line: number;
  char: "&" | "%" | "$";
  snippet: string;
}

export interface TexInsights {
  wordCount: number;
  bulletCount: number;
  sectionCount: number;
  estimatedPages: number;
  missingEscapeWarnings: TexEscapeWarning[];
}

/**
 * Strips first brace argument of \href{...}{...} and \url{...} so URL characters
 * (like & or _ inside query params) do not trigger false escape warnings.
 */
function stripHrefUrlArgs(line: string): string {
  return line
    .replace(/\\href\{[^}]*\}/g, "\\href{}")
    .replace(/\\url\{[^}]*\}/g, "\\url{}");
}

/**
 * Computes live document metrics (words, bullets, sections, estimated pages)
 * and flags likely unescaped &, %, or $ characters in document prose.
 */
export function extractTexInsights(tex: string): TexInsights {
  if (!tex || !tex.trim()) {
    return {
      wordCount: 0,
      bulletCount: 0,
      sectionCount: 0,
      estimatedPages: 1,
      missingEscapeWarnings: [],
    };
  }

  const allLines = tex.split(/\r?\n/);
  const beginDocLineIdx = allLines.findIndex((l) => /\\begin\{document\}/.test(l));
  const bodyStartIdx = beginDocLineIdx !== -1 ? beginDocLineIdx + 1 : 0;

  let sectionCount = 0;
  let bulletCount = 0;
  let tabularDepth = 0;
  const proseChunks: string[] = [];
  const missingEscapeWarnings: TexEscapeWarning[] = [];

  for (let i = bodyStartIdx; i < allLines.length; i++) {
    const rawLine = allLines[i];
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("%")) continue;
    if (/\\end\{document\}/.test(trimmed)) break;

    // Track tabular environments where & is a valid column separator
    const tabularOpens = (rawLine.match(/\\begin\{tabular[*x]?\}/g) || []).length;
    const tabularCloses = (rawLine.match(/\\end\{tabular[*x]?\}/g) || []).length;
    const inTabular = tabularDepth > 0 || tabularOpens > 0;
    tabularDepth = Math.max(0, tabularDepth + tabularOpens - tabularCloses);

    // Count sections and bullets
    const secMatches = rawLine.match(/\\section\*?\{/g);
    if (secMatches) sectionCount += secMatches.length;

    const resumeItemMatches = rawLine.match(/\\resumeItem\{/g);
    if (resumeItemMatches) bulletCount += resumeItemMatches.length;

    // Check unescaped %, &, $ in non-comment prose
    const lineForChecks = stripHrefUrlArgs(rawLine)
      .replace(/\\\\/g, "  ")
      .replace(/\\[%&$#_]/g, "  ")
      .replace(/\$\|\$/g, "   ")
      .replace(/\$\\cdot\$/g, "      ");

    // Check unescaped % (not at start of line, since full-line comments were skipped)
    const pctIdx = lineForChecks.indexOf("%");
    if (pctIdx !== -1) {
      missingEscapeWarnings.push({
        line: i + 1,
        char: "%",
        snippet: trimmed.slice(0, 60),
      });
    }

    // Check unescaped & outside tabular environments
    const beforePct = pctIdx !== -1 ? lineForChecks.slice(0, pctIdx) : lineForChecks;
    if (!inTabular && beforePct.includes("&")) {
      missingEscapeWarnings.push({
        line: i + 1,
        char: "&",
        snippet: trimmed.slice(0, 60),
      });
    }

    // Check unpaired unescaped $ (e.g. "$35,000" instead of "\$35,000")
    const dollarCount = (beforePct.match(/\$/g) || []).length;
    if (dollarCount % 2 === 1) {
      missingEscapeWarnings.push({
        line: i + 1,
        char: "$",
        snippet: trimmed.slice(0, 60),
      });
    }

    // Extract plain prose words for word count
    const cleanProse = rawLine
      .replace(/(^|[^\\])%.*$/, "")
      .replace(/\\href\{[^}]*\}/g, " ")
      .replace(/\\[a-zA-Z]+\*?/g, " ")
      .replace(/[{}$|\\[\]]/g, " ");
    if (cleanProse.trim()) proseChunks.push(cleanProse);
  }

  const words = proseChunks
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && /[a-zA-Z0-9]/.test(w));

  const wordCount = words.length;
  const rawPages = (wordCount + bulletCount * 9) / 560;
  const estimatedPages = Math.max(1, Number(rawPages.toFixed(1)));

  return {
    wordCount,
    bulletCount,
    sectionCount,
    estimatedPages,
    missingEscapeWarnings,
  };
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
 * improved XYZ bullet. Falls back to inserting under Experience if no match.
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

  // Fallback 1: insert right after the first \resumeItemListStart under Experience
  const expIdx = texSource.search(/\\section\{[^}]*Experience[^}]*\}/i);
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

  // Fallback 2: insert at first \resumeItemListStart anywhere in document
  const anyListMatch = /\\resumeItemListStart/.exec(texSource);
  if (anyListMatch) {
    const insertPos = anyListMatch.index + anyListMatch[0].length;
    return {
      updated:
        texSource.slice(0, insertPos) +
        `\n        \\resumeItem{${escapedImproved}}` +
        texSource.slice(insertPos),
      mode: "inserted",
    };
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
