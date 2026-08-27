// next.config.js  (o .ts)
import type { NextConfig } from 'next';

// --- configuración propia (sin PWA) ---
const nextConfig: NextConfig = {
  compress: true,

  // Headers opcionales
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;
