# 乐习

一个在浏览器里就能打开的音乐学习小应用，包含乐理、吉他和钢琴三个部分。界面是简体中文，深色主题，手机上也能用。声音由 Web Audio API 实时合成，没有登录，也没有后端。学习进度保存在本机浏览器里。

## 功能

### 乐理

- 四节短课：音符与五线谱、音程、大调与自然小调、基础和弦
- 可以点按谱表、选择两个音，或播放一条音阶和一个和弦
- 小测验：看音符或先听一声，判断音程和和弦
- 课程完成标记和测验成绩写入 `localStorage`

### 吉他

- 可点按的十二品指板，格子上标着音名
- 常用和弦图：C、G、D、Am、Em、F、Dm、E、A、G7。点按即可拨响，并在指板上标出按法
- 标准调弦参考音：E A D G B E，旁边写着音名和频率

### 钢琴

- 从 C3 到 C5 的键盘，白键标着音名
- 选择音阶或和弦后，对应的琴键会高亮，根音描边更深
- 可以单键演奏，也可以播放整条音阶或整个和弦

## 本地开发

需要 Node.js 22 或更高版本。

```bash
npm install
npm test
npm run dev
```

浏览器打开 http://localhost:5173 。三个章节也可以用地址 `#theory`、`#guitar`、`#piano` 直接进入。

## 测试

乐理相关的纯函数有单元测试，覆盖音程、音阶拼写、和弦构成，以及吉他和弦图是否和这些和弦一致。

```bash
npm test
```

## 构建网页

```bash
npm run build
npm run preview
```

静态文件在 `dist/`。资源使用相对路径，方便放进 Android WebView。

## 构建 Android APK

需要 JDK 21 和 Android SDK（compileSdk 36）。调试包使用 Android 自带的 debug 签名。

```bash
npm run android:debug
```

APK 路径：

`android/app/build/outputs/apk/debug/app-debug.apk`

也可以用 Android Studio 打开 `android/` 目录运行。

## 持续集成

`.github/workflows/ci.yml` 会在拉取请求和 `main` 上：

1. 运行 lint 和单元测试
2. 构建网页包
3. 构建 debug APK
4. 上传两个产物：`yuexi-web`（网页 zip）和 `yuexi-debug-apk`

推送 `v*` 标签时，同一次构建还会把 `yuexi-web.zip` 和 `yuexi-debug.apk` 附加到 GitHub Release。

## iOS 模拟器构建

同一个网页包可以放进 Capacitor 的 iOS 工程。`.github/workflows/ios.yml` 在 macOS 上打两个不签名的产物，只上传到 Actions，不会发布到 App Store 或 TestFlight：

- `yuexi-ios-simulator`：iOS 模拟器 `.app` 的 zip
- `yuexi-ios-unsigned-xcarchive` 和 `yuexi-ios-unsigned-ipa`：未签名的设备归档

第一次点按会在用户手势里创建并恢复 Web Audio 上下文，iOS Safari 和 WKWebView 都需要这一步才能发声。

以后要做签名或 TestFlight，需要 Apple Developer 会员、开发团队 ID、Distribution 证书和描述文件，把 Xcode 签名改回 Automatic，用 `xcodebuild -exportArchive` 导出 App Store 包，再用 App Store Connect API 上传。本仓库没有这些密钥。

## 技术栈

Vite、React、TypeScript、Vitest、Capacitor（Android）。桌面浏览器直接使用网页版。

高音谱号使用 [Noto Music](https://github.com/notofonts/notomusic)，许可见 `LICENSES/NotoMusic-OFL.txt`（SIL Open Font License 1.1）。
