"use client";

import React from "react";
import { AutoScrollMarquee } from "./AutoScrollMarquee";
import { Star, CheckCircle, Award } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Elena Rostova",
    role: "Senior Frontend Engineer",
    company: "Landed at Stripe",
    avatar: "ER",
    scoreBefore: 51,
    scoreAfter: 94,
    quote: "I sent 40 applications with 0 responses. After running my resume through this tool and fixing the missing keywords, I received 4 interview invites in the first week!",
  },
  {
    name: "Marcus Vance",
    role: "Lead DevOps Architect",
    company: "Landed at Snowflake",
    avatar: "MV",
    scoreBefore: 45,
    scoreAfter: 96,
    quote: "Seeing the exact ATS parsing simulator blew my mind. My old 2-column resume was completely scrambling my experience section on Workday.",
  },
  {
    name: "Sophia Chen",
    role: "Product Designer",
    company: "Landed at Shopify",
    avatar: "SC",
    scoreBefore: 58,
    scoreAfter: 91,
    quote: "The bullet point quantifier transformed my generic project descriptions into high-converting metrics. Got a 35% salary increase with my new role.",
  },
  {
    name: "David Kim",
    role: "Staff Backend Engineer",
    company: "Landed at Datadog",
    avatar: "DK",
    scoreBefore: 42,
    scoreAfter: 98,
    quote: "Takes under 10 seconds to scan against a job description. It pinpointed 5 distributed systems keywords I forgot to mention. Absolutely essential.",
  },
  {
    name: "Amina Yusuf",
    role: "Data Platform Engineer",
    company: "Landed at Coinbase",
    avatar: "AY",
    scoreBefore: 49,
    scoreAfter: 93,
    quote: "This is hands-down the best ATS tool I've tested. The UI is gorgeous, the real-time scoring is insanely accurate, and the fixes are actionable.",
  },
];

export function TestimonialsMarquee() {
  return (
    <section className="py-24 relative overflow-hidden bg-muted/20 border-t border-border">
      <div className="container mx-auto px-4 text-center max-w-3xl mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-3">
          <Award className="w-3.5 h-3.5" />
          Proven Results
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
          Thousands of engineers hired at top-tier companies
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          Don&apos;t leave your dream role to chance. See how job seekers jumped from automated rejection to competitive offers.
        </p>
      </div>

      <AutoScrollMarquee speed="normal" direction="left" className="py-3">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={idx}
            className="w-[360px] md:w-[420px] rounded-2xl bg-card border border-border/80 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between shrink-0 select-none cursor-default group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center border border-primary/30">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{t.name}</h4>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>

              <p className="text-xs md:text-sm text-foreground/85 leading-relaxed italic mb-4">
                &quot;{t.quote}&quot;
              </p>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                {t.company}
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted font-mono font-bold text-[11px]">
                <span className="text-red-500 line-through">{t.scoreBefore}</span>
                <span>➔</span>
                <span className="text-emerald-500">{t.scoreAfter} ATS Score</span>
              </div>
            </div>
          </div>
        ))}
      </AutoScrollMarquee>
    </section>
  );
}
