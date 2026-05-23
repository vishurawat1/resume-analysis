"use client";

import { AlertCircle, PlusCircle } from "lucide-react";

export function MissingKeywords({ keywords }: { keywords: string[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <h3 className="font-semibold text-lg text-foreground">Missing Keywords</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        These keywords appear frequently in the job description but are missing from your resume.
      </p>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive rounded-full text-sm font-medium border border-destructive/20">
            <PlusCircle className="h-3.5 w-3.5" />
            {kw}
          </div>
        ))}
      </div>
    </div>
  );
}
