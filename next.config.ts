import type { NextConfig } from "next";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["handlebars"],
    esmExternals: "loose",
  },
  webpack: (config) => {
    // Prevent "require.extensions" issue with handlebars/dotprompt
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    return config;
  },
};

export default nextConfig;
