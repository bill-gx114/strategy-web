import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd()
  },
  outputFileTracingIncludes: {
    "/*": ["./content/**/*", "./src/data/content-manifest.json"]
  },
  serverExternalPackages: ["archiver"]
};

export default nextConfig;
