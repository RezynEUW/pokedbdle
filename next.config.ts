// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'raw.githubusercontent.com',
      'assets.pokemon.com',
      'upload.wikimedia.org'
    ]
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL
  },
  eslint: {
    // Warning instead of error allows deploy to continue
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;