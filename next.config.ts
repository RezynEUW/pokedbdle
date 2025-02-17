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
  }
};

export default nextConfig;