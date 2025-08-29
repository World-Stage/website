import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Disable linting during build for MVP
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checking during build for MVP
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimize for production builds
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@heroicons/react', '@headlessui/react'],
  },
};

export default nextConfig;
