import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      port: '',
    }]
  },
  reactCompiler: true,
};

export default nextConfig;
