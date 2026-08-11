import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["typeorm", "pg"],
  agentRules: false,
};

export default nextConfig;
