"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

const SUBJECT_DISPLAY_MAP: Record<string, string> = {
  KeywordOptimization: "Keywords",
  keywordOptimization: "Keywords",
  Optimization: "Keywords",
  optimization: "Keywords",
  Formatting: "Formatting",
  formatting: "Formatting",
  Experience: "Experience",
  experience: "Experience",
  Skills: "Skills",
  skills: "Skills",
  Education: "Education",
  education: "Education",
  Projects: "Projects",
  projects: "Projects",
};

const FULL_NAME_MAP: Record<string, string> = {
  KeywordOptimization: "Keyword Optimization",
  keywordOptimization: "Keyword Optimization",
  Optimization: "Keyword Optimization",
  Formatting: "Formatting & Structure",
  formatting: "Formatting & Structure",
  Experience: "Work Experience",
  Skills: "Technical Skills",
  Education: "Education & Academics",
  Projects: "Projects & Portfolio",
};

export function ResumeRadarChart({ sectionScores }: { sectionScores: Record<string, number> }) {
  const data = Object.entries(sectionScores || {}).map(([key, value]) => {
    const cleanKey = key.trim();
    const shortLabel = SUBJECT_DISPLAY_MAP[cleanKey] || (cleanKey.length > 10 ? `${cleanKey.slice(0, 8)}…` : cleanKey);
    const fullLabel = FULL_NAME_MAP[cleanKey] || cleanKey;
    return {
      subject: shortLabel,
      fullSubject: fullLabel,
      score: typeof value === "number" ? Math.max(0, Math.min(100, Math.round(value))) : 0,
      fullMark: 100,
    };
  });

  return (
    <div className="h-[310px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="60%"
          data={data}
          margin={{ top: 15, right: 32, bottom: 15, left: 32 }}
        >
          <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: "hsl(var(--foreground))",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Tooltip 
            formatter={(val: any, _name: any, item: any) => [
              `${val} / 100`,
              item?.payload?.fullSubject || "Score"
            ]}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 600 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
