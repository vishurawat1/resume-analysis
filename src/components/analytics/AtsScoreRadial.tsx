"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function AtsScoreRadial({ score = 85 }: { score?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 1500;
      const startTime = performance.now();

      const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing function: easeOutExpo
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        setDisplayScore(Math.floor(easeProgress * score));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, score]);

  const colorClass = score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500";
  const circleRadius = 90;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div ref={ref} className="h-64 w-full relative flex items-center justify-center">
      <svg className="w-48 h-48 transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="96"
          cy="96"
          r={circleRadius}
          stroke="currentColor"
          strokeWidth="16"
          fill="transparent"
          className="text-muted/20"
        />
        {/* Animated Progress Circle */}
        <motion.circle
          cx="96"
          cy="96"
          r={circleRadius}
          stroke="currentColor"
          strokeWidth="16"
          fill="transparent"
          strokeLinecap="round"
          className={cn("transition-colors duration-500", colorClass)}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset } : { strokeDashoffset: circumference }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tracking-tighter tabular-nums">{displayScore}</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">ATS Score</span>
      </div>
    </div>
  );
}
