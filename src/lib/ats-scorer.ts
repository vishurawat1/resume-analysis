export interface ATSResult {
  overallScore: number;
  missingKeywords: string[];
  skillsMatch: { name: string; match: number }[];
  suggestions: { section: string; current: string; suggested: string }[];
  strengthData: { date: string; score: number }[];
}

const commonSkills = [
  "React", "TypeScript", "Node.js", "Python", "AWS", 
  "Docker", "Kubernetes", "GraphQL", "Next.js", "Java",
  "C++", "SQL", "NoSQL", "Machine Learning", "AI",
  "Agile", "Scrum", "CI/CD", "Git", "CSS", "HTML",
  "Tailwind", "Figma", "UI/UX", "Product Management",
  "Data Analysis", "Marketing", "Sales", "Communication",
  "Leadership", "Project Management", "Problem Solving"
];

export function extractSkills(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const foundSkills = commonSkills.filter(skill => 
    normalizedText.includes(skill.toLowerCase())
  );
  return foundSkills;
}

export function keywordMatch(resumeText: string, jobDescription: string) {
  const requiredSkills = extractSkills(jobDescription);
  const userSkills = extractSkills(resumeText);
  
  const matchedSkills: { name: string; match: number }[] = [];
  const missingKeywords: string[] = [];

  requiredSkills.forEach(skill => {
    if (userSkills.includes(skill)) {
      matchedSkills.push({ name: skill, match: 100 });
    } else {
      missingKeywords.push(skill);
      matchedSkills.push({ name: skill, match: 0 });
    }
  });

  // Add some skills the user has that might not be in JD just for visualization
  userSkills.forEach(skill => {
    if (!requiredSkills.includes(skill)) {
      matchedSkills.push({ name: skill, match: 100 }); // Bonus skills
    }
  });

  return { matchedSkills, missingKeywords, requiredSkills };
}

export function checkSections(resumeText: string) {
  const normalizedText = resumeText.toLowerCase();
  const sections = {
    education: normalizedText.includes('education') || normalizedText.includes('university'),
    experience: normalizedText.includes('experience') || normalizedText.includes('work history'),
    skills: normalizedText.includes('skills') || normalizedText.includes('technologies'),
  };
  return sections;
}

export function calculateATSScore(resumeText: string, jobDescription: string): ATSResult {
  const { matchedSkills, missingKeywords, requiredSkills } = keywordMatch(resumeText, jobDescription);
  const sections = checkSections(resumeText);
  
  let score = 0; // Base score

  // Skill matching score (up to 70 points)
  if (requiredSkills.length > 0) {
    const skillsMatchRatio = (requiredSkills.length - missingKeywords.length) / requiredSkills.length;
    score += Math.round(skillsMatchRatio * 70);
  } else {
    score += 35; // default if JD has no recognizable skills
  }

  // Section completeness (up to 20 points)
  if (sections.experience) score += 10;
  if (sections.education) score += 5;
  if (sections.skills) score += 5;

  // Length check (up to 10 points)
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount > 300 && wordCount < 1000) {
    score += 10;
  } else if (wordCount >= 1000) {
    score += 5;
  }

  // Ensure score is within 0-100 bounds
  score = Math.max(0, Math.min(100, score));

  // Generate some dynamic suggestions based on missing sections
  const suggestions = [];
  if (!sections.experience) {
    suggestions.push({
      section: "Structure - Experience",
      current: "Missing clear experience section.",
      suggested: "Add an 'Experience' or 'Work History' section detailing your previous roles."
    });
  }
  if (!sections.education) {
    suggestions.push({
      section: "Structure - Education",
      current: "Missing clear education section.",
      suggested: "Include your degrees or relevant coursework under an 'Education' header."
    });
  }
  if (missingKeywords.length > 0) {
    suggestions.push({
      section: "Keywords - " + missingKeywords[0],
      current: "Missing important JD keyword.",
      suggested: `Try incorporating '${missingKeywords[0]}' naturally into your experience bullet points.`
    });
  }

  // Generate mock strength progression data culminating in current score
  const today = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const strengthData = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setMonth(today.getMonth() - i);
    strengthData.push({
      date: months[d.getMonth()],
      score: i === 0 ? score : Math.max(20, score - (i * 10) + Math.floor(Math.random() * 10))
    });
  }

  return {
    overallScore: score,
    missingKeywords,
    skillsMatch: matchedSkills.slice(0, 8), // Keep visualization clean
    suggestions,
    strengthData
  };
}
