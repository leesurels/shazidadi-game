# 傻子大帝 - Android APK 打包指南

## 📋 已完成的配置

| 文件 | 说明 |
|------|------|
| `next.config.ts` | 开启静态导出模式 (`output: 'export'`) |
| `capacitor.config.ts` | Capacitor 配置，指向 `out/` 输出目录 |
| `package.json` | 添加了 Capacitor 依赖和构建命令 |
| `.github/workflows/build-apk.yml` | GitHub Actions 自动打包 APK |

---

## 🚀 第一次完整配置（本地，仅需一次）

> 本地操作是为了生成 `android/` 目录并提交到 GitHub，之后 Actions 就能自动构建。

### 第一步：安装依赖

```bash
npm install
```

### 第二步：构建 Next.js 静态文件

```bash
npm run build
```

构建成功后会生成 `out/` 文件夹。

### 第三步：初始化 Capacitor Android 项目

```bash
npx cap add android
```

这会在项目根目录生成 `android/` 文件夹（Android 原生项目）。

### 第四步：同步 Web 资源

```bash
npx cap sync android
```

### 第五步：提交所有文件到 GitHub

```bash
git add .
git commit -m "feat: add Capacitor Android support"
git push origin main
```

推送后，GitHub Actions 会**自动开始构建 APK**。

---

## 📦 下载 APK

### 方式一：每次推送自动构建
1. 打开 GitHub 仓库 → 点击 `Actions` 选项卡
2. 找到最新的 `Build Android APK` 运行记录
3. 点进去 → 找到底部的 `Artifacts`
4. 下载 `shazidadi-debug-xxxxxxxx.zip`，解压得到 APK

### 方式二：发布版本（推荐分享给别人）
在本地打一个版本标签并推送：

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 会自动创建 Release，APK 作为附件可直接下载。

---

## 📱 安装 APK 到手机

1. 将 APK 文件传到 Android 手机
2. 打开手机「设置」→「安全」→ 开启「**允许安装未知来源应用**」
3. 找到 APK 文件点击安装
4. 完成！

---

## ⚠️ 注意事项

- **Debug APK** 可以直接安装，但文件较大、性能略低，仅用于测试
- **Release APK**（正式版）需要签名密钥，如有需要可进一步配置
- 游戏数据保存在手机本地（WebView 的 localStorage）
- 如果更新游戏，重新安装 APK 不会丢失存档

---

## 🔧 常见问题

**Q: GitHub Actions 构建失败，报 Gradle 错误**  
A: 检查 `android/` 目录是否已提交，确保 `gradlew` 文件已推送

**Q: 游戏在手机上显示异常（布局错乱）**  
A: 在 `capacitor.config.ts` 中调整 WebView 配置，或修改游戏 CSS 的视口适配

**Q: 想修改应用图标**  
A: 替换 `android/app/src/main/res/mipmap-*/` 目录下的图标文件
