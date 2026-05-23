"use client";

import { motion } from "framer-motion";

export function SectionAnalysisCard({ sectionScores }: { sectionScores: Record<string, number> }) {
  const entries = Object.entries(sectionScores);

  return (
    <div className="space-y-4 w-full">
      {entries.map(([section, score], index) => {
        let colorClass = "bg-green-500";
        if (score < 60) colorClass = "bg-red-500";
        else if (score < 80) colorClass = "bg-yellow-500";

        return (
          <div key={section} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-foreground">{section}</span>
              <span className="text-muted-foreground">{score}/100</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: score + "%" }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                className={"h-full rounded-full " + colorClass}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
