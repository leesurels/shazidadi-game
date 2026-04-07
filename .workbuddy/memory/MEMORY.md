# MEMORY.md - 项目长期记忆

## 项目：傻子大帝（f:\下载\傻子大帝-源代码）

**项目性质：** Next.js + TypeScript 城建策略游戏，纯前端逻辑，存档用 localStorage，无服务端依赖（Prisma/next-auth 是模板残留，未使用）

**技术栈：** Next.js、TypeScript、Tailwind CSS、Zustand、shadcn/ui、Capacitor（新增）

**Android 打包方案（已配置完成，2026-04-07）：**
- `output: 'export'` 静态导出 → Capacitor 包装 → GitHub Actions 自动打包 APK
- appId: `com.shazidadi.game`
- 参见 `ANDROID_BUILD.md` 操作指南
