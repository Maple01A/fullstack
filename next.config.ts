import { NextConfig } from 'next';

/**
 * Next.jsの設定
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
const nextConfig: NextConfig = {
  // ビルド時のESLintチェックを無効化
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // ビルド時の型チェックを無効化
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 実験的機能の有効化
  experimental: {
    serverActions: true,
  },
  
  // 画像最適化設定
  images: {
    domains: ['lh3.googleusercontent.com', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // 外部URL設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // 環境変数を公開用に設定
  env: {
    APP_URL: process.env.APP_URL,
  },
};

export default nextConfig;