import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ResumeWeaknessCard({ weaknesses, strengths }: { weaknesses: string[], strengths: string[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-6 w-full">
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold">Critical Weaknesses</h3>
        </div>
        <ul className="space-y-2">
          {weaknesses.map((w, i) => (
            <li key={i} className="text-sm text-foreground flex gap-2">
              <span className="text-destructive mt-0.5">•</span>
              <span className="leading-relaxed opacity-90">{w}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-green-600 mb-2">
          <CheckCircle2 className="w-5 h-5" />
          <h3 className="font-semibold">Core Strengths</h3>
        </div>
        <ul className="space-y-2">
          {strengths.map((s, i) => (
            <li key={i} className="text-sm text-foreground flex gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              <span className="leading-relaxed opacity-90">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
