import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: the Docker runner stage copies .next/standalone and
  // listens on :3000 as a non-root user. See UI-PLAYBOOK.md.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
