import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co', // Add other domains if needed
        port: '',
        pathname: '/**',
      },
      // Example for another domain:
      // {
      //   protocol: 'https',
      //   hostname: 'covers.example.com',
      //   port: '',
      //   pathname: '/images/**',
      // },
    ],
  },
};

export default nextConfig;
