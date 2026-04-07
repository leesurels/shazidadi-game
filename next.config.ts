import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",        // 静态导出，Capacitor 打包所需
  distDir: "out",          // 输出目录
  images: {
    unoptimized: true,     // 静态导出不支持 Next.js 图片优化
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
