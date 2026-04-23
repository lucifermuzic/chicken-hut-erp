import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // تقليل استهلاك الذاكرة وتسريع الترجمة
  productionBrowserSourceMaps: false,
  
  // السماح بعرض الصور من المصادر الخارجية
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },

  // تحسين استيراد الحزم الكبيرة (يقلل وقت البناء)
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
