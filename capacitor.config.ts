import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // 应用唯一标识符，格式：反向域名。上架时不可更改
  appId: 'com.shazidadi.game',
  // 显示给用户的应用名称
  appName: '傻子大帝',
  // Next.js 静态导出目录
  webDir: 'out',
  server: {
    // 生产环境使用本地文件，不走网络
    androidScheme: 'https',
  },
  android: {
    // 允许混合内容（HTTP 资源），开发调试用
    allowMixedContent: false,
    // 允许在 WebView 中使用 localStorage
    webContentsDebuggingEnabled: false,
  },
};

export default config;
