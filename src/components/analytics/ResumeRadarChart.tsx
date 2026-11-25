"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

const emptySubscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

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
  const { resolvedTheme } = useTheme();
  const isClient = useIsClient();

  const isDark = isClient ? resolvedTheme === "dark" : false;

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

  // Dark & Light Mode Color Tokens (Eliminates invalid hsl(#hex) bug)
  const gridStroke = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)";
  const labelColor = isDark ? "#f4f4f5" : "#18181b";
  const radarStroke = isDark ? "#38bdf8" : "#059669"; // Vibrant Cyan in dark mode, Emerald in light
  const radarFill = isDark ? "#0284c7" : "#10b981";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
  const tooltipText = isDark ? "#fafafa" : "#09090b";

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
          <PolarGrid stroke={gridStroke} strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: labelColor,
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="score"
            stroke={radarStroke}
            fill={radarFill}
            fillOpacity={isDark ? 0.45 : 0.35}
            strokeWidth={2.5}
          />
          <Tooltip
            formatter={(val: unknown, _name: unknown, item: { payload?: { fullSubject?: string } }) => [
              `${val} / 100`,
              item?.payload?.fullSubject || "Score",
            ]}
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: "8px",
              color: tooltipText,
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            }}
            itemStyle={{ color: radarStroke, fontWeight: 600 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
