import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vr-resume-analysis.vercel.app";
  const lastModified = new Date();
  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.4 },
  ];
}
