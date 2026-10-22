const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { dev }) {
    // Avoid missing webpack pack files on Windows during development.
    if (dev) config.cache = { type: 'memory' };
    return config;
  },
  images: {
    unoptimized: true,
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = (phase) => ({
  ...nextConfig,
  // Production builds must not overwrite files used by the dev server.
  distDir: phase === PHASE_DEVELOPMENT_SERVER
    ? `.next-dev-${process.env.KAVVU_DEV_PORT || process.env.PORT || '3000'}`
    : '.next',
});
