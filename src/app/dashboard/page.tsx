"use client";

import { motion } from "framer-motion";
import { FileText, Clock, Upload, Sparkles, ArrowRight, BarChart3, Wand2 } from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface ResumeData {
  fileName?: string;
  updatedAt?: string;
  text?: string;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardData = async () => {
      try {
        const docRef = doc(db, "users", user.uid, "data", "resume");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setResumeData(docSnap.data());
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Hero Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-8 text-primary-foreground shadow-lg"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.displayName || "User"} 👋
          </h1>
          <p className="mt-2 text-primary-foreground/80 max-w-lg">
            Your AI-powered resume command center. Upload, analyze, and optimize your resume to land your dream job.
          </p>
          <Link
            href="/dashboard/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold hover:bg-white/30 transition-colors border border-white/20"
          >
            <Upload className="w-4 h-4" /> Upload Resume <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div variants={itemVariants}>
          <Link href="/dashboard/analysis" className="group block bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">ATS Analysis</p>
                <p className="text-xs text-muted-foreground mt-0.5">Score & optimize</p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link href="/dashboard/review" className="group block bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Review</p>
                <p className="text-xs text-muted-foreground mt-0.5">Deep critique</p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link href="/dashboard/enhancer" className="group block bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Bullet Enhancer</p>
                <p className="text-xs text-muted-foreground mt-0.5">Rewrite bullets</p>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Active Resume Card */}
      <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Active Resume</h2>
            <p className="text-sm text-muted-foreground mt-1">The resume currently tied to your profile.</p>
          </div>
          <Link
            href="/dashboard/upload"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Upload New
          </Link>
        </div>
        
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-12 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your data...</p>
            </div>
          ) : resumeData ? (
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary mt-1 sm:mt-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{resumeData.fileName || "Resume"}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3"/> 
                      Last updated: {resumeData.updatedAt ? new Date(resumeData.updatedAt).toLocaleDateString() : "Recently"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/dashboard/analysis"
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                >
                  View Analysis
                </Link>
                <Link
                  href="/dashboard/review"
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  View Review
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No Resume Found</h3>
              <p className="text-muted-foreground max-w-sm">You haven&apos;t uploaded a resume yet. Head over to the Upload section to get started.</p>
              <Link
                href="/dashboard/upload"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" /> Upload Your Resume
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

