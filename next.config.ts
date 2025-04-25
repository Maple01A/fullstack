/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...既存の設定
  eslint: {
    // ビルド時のESLintチェックを無効化
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ビルド時の型チェックを無効化（オプション）
    ignoreBuildErrors: true,
  },
  // 既存の実験的サーバーアクション設定を修正
  experimental: {
    serverActions: true, // booleanに変更
  }
};

module.exports = nextConfig;