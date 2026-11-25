"use client";

import { useState } from "react";
import { Download, Loader2, FileWarning, Sparkles, CheckCircle2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { ResumeDocument, ResumeData } from "./ResumeDocument";
import { authFetch } from "@/lib/apiClient";

export function DownloadResumeButton({
  resumeText,
  fileName = "Optimized_Resume.pdf",
}: {
  resumeText: string;
  fileName?: string;
}) {
  const [stage, setStage] = useState<"idle" | "structuring" | "compiling" | "done">("idle");
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setStage("structuring");
    setError("");

    try {
      // 1. Convert flat text to structured JSON
      const res = await authFetch("/api/build-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      const data: ResumeData = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Failed to structure resume content");
      }

      setStage("compiling");

      // 2. Generate PDF Blob with structured template
      const doc = <ResumeDocument data={data} />;
      const blob = await pdf(doc).toBlob();

      // 3. Trigger Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      let finalName = fileName;
      if (!finalName.endsWith(".pdf")) {
        finalName += ".pdf";
      }
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStage("done");
      setTimeout(() => setStage("idle"), 2500);
    } catch (err: unknown) {
      console.error("PDF generation error:", err);
      setError(err instanceof Error ? err.message : "PDF Generation Failed");
      setStage("idle");
    }
  };

  if (error) {
    return (
      <button
        onClick={handleDownload}
        className="flex items-center justify-center px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors gap-2 shadow-sm"
      >
        <FileWarning className="w-4 h-4" /> Build Failed (Retry)
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={stage !== "idle"}
      className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all gap-2 shadow-sm disabled:opacity-75 disabled:cursor-wait"
    >
      {stage === "structuring" && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Structuring with AI...</span>
        </>
      )}
      {stage === "compiling" && (
        <>
          <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
          <span>Rendering Vector PDF...</span>
        </>
      )}
      {stage === "done" && (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>PDF Downloaded!</span>
        </>
      )}
      {stage === "idle" && (
        <>
          <Download className="w-4 h-4" />
          <span>Download Executive PDF</span>
        </>
      )}
    </button>
  );
}
