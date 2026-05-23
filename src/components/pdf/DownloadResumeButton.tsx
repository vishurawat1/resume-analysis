"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ResumeDocument } from "./ResumeDocument";

export function DownloadResumeButton({ resumeText, fileName = "Optimized_Resume.pdf" }: { resumeText: string, fileName?: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <button disabled className="flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium opacity-50 cursor-not-allowed gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Preparing PDF...
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<ResumeDocument text={resumeText} />}
      fileName={fileName}
      className="flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors gap-2 shadow-sm"
    >
      {({ loading }) =>
        loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Rendering...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" /> Download Optimized PDF
          </>
        )
      }
    </PDFDownloadLink>
  );
}
