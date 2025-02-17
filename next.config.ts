// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'raw.githubusercontent.com',
      'assets.pokemon.com',
      'upload.wikimedia.org'
    ]
  }
};

module.exports = nextConfig;