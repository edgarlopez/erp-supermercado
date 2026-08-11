import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["typeorm"],
  agentRules: false,
};

export default nextConfig;
