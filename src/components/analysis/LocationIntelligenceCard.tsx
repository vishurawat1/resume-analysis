"use client";

import { MapPin, Globe, Compass, Rocket, AlertTriangle, CheckCircle2, Navigation, ArrowRight } from "lucide-react";

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
        <div className="bg-muted/40 rounded-lg p-3.5 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">Your Location</span>
              <span className="font-semibold text-foreground truncate block">{data.candidateLocation || "On Resume"}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground px-2">
            <div className="h-[1px] w-8 bg-border" />
            <ArrowRight className="w-3.5 h-3.5" />
            <div className="h-[1px] w-8 bg-border" />
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSpaceOrFantasy ? "bg-purple-500 animate-ping" : "bg-emerald-500"}`} />
            <div className="min-w-0">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">Job Location</span>
              <span className="font-semibold text-foreground truncate block">{data.jobLocation || "Specified in JD"}</span>
            </div>
          </div>

          <div className="sm:border-l sm:border-border sm:pl-3 flex flex-col justify-center">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Est. Distance</span>
            <span className="font-mono text-xs font-bold text-foreground">{data.distanceEstimate || "Local / Remote"}</span>
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
