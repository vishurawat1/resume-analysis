"use client";

import { useState } from "react";
import { Download, Loader2, FileWarning } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { ResumeDocument, ResumeData } from "./ResumeDocument";

export function DownloadResumeButton({ resumeText, fileName = "Optimized_Resume.pdf" }: { resumeText: string, fileName?: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = async () => {
    setIsGenerating(true);
    setError("");

    try {
      // 1. Convert flat text to structured JSON
      const res = await fetch("/api/build-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      const data: ResumeData = await res.json();
      if (!res.ok) {
        throw new Error((data as any).error || "Failed to generate structure");
      }

      // 2. Generate PDF Blob with structured template
      const doc = <ResumeDocument data={data} />;
      const blob = await pdf(doc).toBlob();

      // 3. Trigger Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      if (!fileName.endsWith('.pdf')) {
        fileName += '.pdf';
      }
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "PDF Generation Failed");
    } finally {
      setIsGenerating(false);
    }
  };

  if (error) {
    return (
      <button 
        onClick={handleDownload} 
        className="flex items-center justify-center px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/80 transition-colors gap-2 shadow-sm"
      >
        <FileWarning className="w-4 h-4" /> Build Failed (Retry)
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Structuring PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" /> Download Optimized PDF
        </>
      )}
    </button>
  );
}
