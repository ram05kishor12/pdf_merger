import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increase from default 1mb to 50mb
    },
  },
};

export default nextConfig;
