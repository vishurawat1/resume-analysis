"use client";

import { useState } from "react";
import { Check, X, ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Suggestion {
  original: string;
  improved: string;
  reason: string;
  impact: string;
}

export function ImprovementSuggestionCard({
  suggestion,
  onAccept,
  onReject,
}: {
  suggestion: Suggestion;
  onAccept: (original: string, improved: string) => void;
  onReject: () => void;
}) {
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">("pending");

  const handleAccept = () => {
    setStatus("accepted");
    onAccept(suggestion.original, suggestion.improved);
  };

  const handleReject = () => {
    setStatus("rejected");
    onReject();
  };

  if (status !== "pending") return null; // Hide after decision

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-medium text-sm bg-primary/10 px-3 py-1 rounded-full w-fit">
          <TrendingUp className="w-4 h-4" />
          Impact: {suggestion.impact}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
            title="Reject Suggestion"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleAccept}
            className="p-2 text-muted-foreground hover:bg-green-500/10 hover:text-green-600 rounded-lg transition-colors"
            title="Accept Suggestion"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original</h4>
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-foreground/80 line-through decoration-destructive/50">
            {suggestion.original}
          </div>
        </div>
        
        <div className="hidden md:flex items-center justify-center -mx-2 z-10">
          <ArrowRight className="text-muted-foreground w-5 h-5" />
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider">Improved</h4>
          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg text-sm text-foreground">
            {suggestion.improved}
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg">
        <span className="font-semibold text-foreground">Why: </span>
        {suggestion.reason}
      </div>
    </div>
  );
}
