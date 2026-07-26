import type { NextConfig } from 'next';

const supabaseHostname = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Supabase Storage public URLs (and any custom project domain from Connect).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
    // Next 15 defaults dynamic staleTime to 0, which makes every Link click
    // wait on a fresh RSC fetch. Cache short-lived page segments for snappier admin nav.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
