import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vr-resume-analysis.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/login", "/privacy", "/terms"],
        disallow: ["/dashboard/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
