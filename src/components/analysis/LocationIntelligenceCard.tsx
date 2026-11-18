"use client";

import Link from "next/link";
import { MapPin, Globe, Compass, Rocket, AlertTriangle, CheckCircle2, Navigation, Settings2 } from "lucide-react";

export interface LocationIntelligence {
  candidateLocation: string;
  jobLocation: string;
  workModel: string;
  commuteFeasibility: string;
  distanceEstimate: string;
  verdict: string;
  relocationAdvice: string;
}

export function LocationIntelligenceCard({ data }: { data?: LocationIntelligence }) {
  if (!data) return null;

  const isSpaceOrFantasy =
    data.commuteFeasibility?.toLowerCase().includes("world") ||
    data.distanceEstimate?.toLowerCase().includes("interplanetary") ||
    data.jobLocation?.toLowerCase().includes("space") ||
    data.jobLocation?.toLowerCase().includes("mars") ||
    data.verdict?.toLowerCase().includes("space") ||
    data.verdict?.toLowerCase().includes("starship");

  const isRemote =
    data.workModel?.toLowerCase().includes("remote") ||
    data.commuteFeasibility?.toLowerCase().includes("remote");

  const isRelocation =
    !isSpaceOrFantasy &&
    !isRemote &&
    (data.commuteFeasibility?.toLowerCase().includes("relocation") ||
     data.commuteFeasibility?.toLowerCase().includes("intercontinental") ||
     data.commuteFeasibility?.toLowerCase().includes("difficult"));

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isSpaceOrFantasy ? "bg-purple-500/10 text-purple-500" : isRemote ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"}`}>
              {isSpaceOrFantasy ? <Rocket className="w-5 h-5 animate-bounce" /> : isRemote ? <Globe className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Commute & Location Radar</h3>
              <p className="text-xs text-muted-foreground">Proximity feasibility & work arrangement</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              isSpaceOrFantasy
                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                : isRemote
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : isRelocation
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
            }`}>
              {data.workModel || "Hybrid / Flexible"}
            </span>

            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 ${
              isSpaceOrFantasy
                ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/40"
                : isRelocation
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
            }`}>
              {isSpaceOrFantasy ? (
                <>🚀 Out of this World</>
              ) : isRelocation ? (
                <><AlertTriangle className="w-3 h-3" /> Relocation Required</>
              ) : (
                <><CheckCircle2 className="w-3 h-3" /> {data.commuteFeasibility || "Feasible"}</>
              )}
            </span>
          </div>
        </div>

        {/* Origin to Destination Route */}
        <div className="bg-muted/30 rounded-xl p-3.5 border border-border/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {/* Your Location */}
          <div className="flex items-start gap-2.5 min-w-0 p-3 rounded-lg bg-card/70 border border-border/60">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Your Location</span>
                <Link
                  href="/dashboard/settings"
                  className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                  title="Configure your home location in Personal Settings"
                >
                  <Settings2 className="w-2.5 h-2.5" />
                  Edit
                </Link>
              </div>
              <p className="font-semibold text-foreground text-sm leading-snug break-words">
                {data.candidateLocation || "Not specified on resume"}
              </p>
            </div>
          </div>

          {/* Job Location */}
          <div className="flex items-start gap-2.5 min-w-0 p-3 rounded-lg bg-card/70 border border-border/60">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${isSpaceOrFantasy ? "bg-purple-500 animate-ping" : "bg-emerald-500"}`} />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-0.5">Job Location</span>
              <p className="font-semibold text-foreground text-sm leading-snug break-words">
                {data.jobLocation || "Specified in JD"}
              </p>
            </div>
          </div>

          {/* Est. Distance */}
          <div className="flex items-start gap-2.5 min-w-0 p-3 rounded-lg bg-card/70 border border-border/60 sm:col-span-2 lg:col-span-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-1" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-0.5">Est. Distance</span>
              <p className="font-mono text-xs font-bold text-foreground leading-snug break-words">
                {data.distanceEstimate || "Local / Remote"}
              </p>
            </div>
          </div>
        </div>

        {/* Witty AI Verdict Banner */}
        <div className={`mt-4 p-4 rounded-xl border text-sm leading-relaxed ${
          isSpaceOrFantasy
            ? "bg-purple-500/10 border-purple-500/30 text-purple-950 dark:text-purple-200"
            : isRelocation
            ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
            : "bg-primary/5 border-primary/20 text-foreground"
        }`}>
          <div className="flex items-start gap-2.5">
            <Compass className={`w-5 h-5 shrink-0 mt-0.5 ${isSpaceOrFantasy ? "text-purple-500" : isRelocation ? "text-amber-500" : "text-primary"}`} />
            <div className="space-y-1">
              <p className="font-medium text-xs uppercase tracking-wider opacity-75">AI Commute Assessment</p>
              <p className="font-medium text-sm leading-relaxed">{data.verdict}</p>
            </div>
          </div>
        </div>
      </div>

      {data.relocationAdvice && (
        <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1.5 border-t border-border/60">
          <span className="font-semibold text-foreground">Relocation Tip:</span>
          <span>{data.relocationAdvice}</span>
        </div>
      )}
    </div>
  );
}
