import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading the dev server from this machine's LAN IP
  // (e.g. http://192.168.1.108:3000). Without this, Next.js 16 blocks
  // non-localhost dev origins and client components never hydrate, so
  // the /api/leads + /api/admins fetches never fire and pages look empty.
  // Add any other IP/hostname you browse the dev server from here.
  allowedDevOrigins: ["192.168.1.108"],
};

export default nextConfig;
