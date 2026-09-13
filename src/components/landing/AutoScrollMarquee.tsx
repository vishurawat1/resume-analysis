"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AutoScrollMarqueeProps {
  children: React.ReactNode;
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
  fadeEdges?: boolean;
}

export function AutoScrollMarquee({
  children,
  direction = "left",
  speed = "normal",
  pauseOnHover = true,
  className = "",
  fadeEdges = true,
}: AutoScrollMarqueeProps) {
  const durationMap = {
    fast: "18s",
    normal: "32s",
    slow: "50s",
  };

  const duration = durationMap[speed] || durationMap.normal;
  const animationClass = direction === "left" ? "animate-marquee" : "animate-marquee-reverse";

  return (
    <div
      className={cn(
        "relative overflow-hidden w-full flex items-center py-2",
        fadeEdges && "mask-gradient-x",
        className
      )}
      style={{ "--marquee-duration": duration } as React.CSSProperties}
    >
      <div
        className={cn(
          animationClass,
          !pauseOnHover && "[&]:hover:animate-[marquee_var(--marquee-duration)_linear_infinite]"
        )}
      >
        <div className="flex items-center gap-6 shrink-0 pr-6">{children}</div>
        <div className="flex items-center gap-6 shrink-0 pr-6" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
