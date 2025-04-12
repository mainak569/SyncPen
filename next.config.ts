import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // domains: ["files.edgestore.dev"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.edgestore.dev",
      },
    ],
  },
};

export default nextConfig;
