# 乐趣岛

一个在浏览器里就能打开的音乐小应用，英文名 LeQuDao。包含乐理、吉他、钢琴，还有几个轻量小游戏。界面是简体中文，深色主题，手机上也能用。声音由 Web Audio API 实时合成，没有登录，也没有后端。闯关进度、连续天数和徽章保存在本机浏览器里。

## 功能

### 乐理

- 四节短课：音符与五线谱、音程、大调与自然小调、基础和弦
- 可以点按谱表、选择两个音，或播放一条音阶和一个和弦
- 小测验：看音符或先听一声，判断音程和和弦
- 课程完成标记和测验成绩写入 `localStorage`

### 吉他

- 可点按的十二品指板，格子上标着音名
- 常用和弦图：C、G、D、Am、Em、F、Dm、E、A、G7。点按即可拨响，并在指板上标出按法
- 六弦参考音，旁边写着音名和频率
- 这一页只有可演奏的界面，没有讲解文字

### 钢琴

- 从 C3 到 C5 的键盘，白键标着音名
- 选择音阶或和弦后，对应的琴键会高亮，根音描边更深
- 可以单键演奏，也可以播放整条音阶或整个和弦

### 玩

- 听辨：听一个单音、音程或和弦，再从选项里挑出来。连对会计分、累加连击，并点亮最多三颗星
- 跟灯：琴键依次亮起，按同样的顺序弹回去，序列会变长
- 抢音：在倒计时里点中亮起的品位或和弦
- 答对会有光点和上行音，答错会有短促的提示音
- 连续打开的天数，以及听辨、跟灯、抢音相关的徽章，写入 `localStorage`

## 本地开发

需要 Node.js 22 或更高版本。

```bash
npm install
npm test
npm run dev
```

浏览器打开 http://localhost:5173 。章节也可以用地址 `#theory`、`#guitar`、`#piano`、`#play` 进入。小游戏分别是 `#play`、`#play-simon`、`#play-guitar` 和 `#play-badges`。

## 测试

乐理相关的纯函数有单元测试，覆盖音程、音阶拼写、和弦构成，以及吉他和弦图是否和这些和弦一致。小游戏的出题、计分、连击星星、跟灯判定和连续天数也有测试。

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

## 构建 Mac 与 Windows

桌面版用 Electron 包同一份网页。本仓库的持续集成打出的 Mac 包不签名，Windows 也不签名。

- 未签名的 Mac 包第一次打开可能被 Gatekeeper 拦截，需要在「系统设置 → 隐私与安全性」里允许。
- Windows 可能出现 SmartScreen 提示，需要选择仍要运行。

未签名（和 CI 相同）：

```bash
npm run build
CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac --universal --publish never
npx electron-builder --win --x64 --publish never
```

签名并公证的 Mac 包不在本仓库的 CI 里构建。Apple 证书和 API 密钥只放在 [sleep2agi/agent-network-app](https://github.com/sleep2agi/agent-network-app) 的 `macos-signing` 环境。那边的 workflow 检出本仓库的某个 tag 或 commit，然后执行：

```bash
npm ci
npm run desktop:mac:signed
```

`desktop:mac:signed` 在变量缺失、`APPLE_API_KEY` 不是 `.p8` 文件路径、或当前是 pull request（`GITHUB_BASE_REF` 有值）时会直接退出，不会打出未签名包。它不打印这些变量的值。调用方需要设置：

| 环境变量 | 含义 | agent-network-app 的 secret |
| --- | --- | --- |
| `CSC_LINK` | Developer ID `.p12` 的路径，或该文件的 base64。secret 本身已是 base64，可以直接传入 | `APPLE_CERTIFICATE` |
| `CSC_KEY_PASSWORD` | `.p12` 密码 | `APPLE_CERTIFICATE_PASSWORD` |
| `APPLE_API_KEY` | 解码后的 `AuthKey_*.p8` **文件路径**。把 `APPLE_API_KEY_BASE64` 解码到临时文件，再把路径赋给这个变量。这不是 key id | `APPLE_API_KEY_BASE64`（解码后的路径） |
| `APPLE_API_KEY_ID` | App Store Connect API key id | `APPLE_API_KEY` |
| `APPLE_API_ISSUER` | issuer id | `APPLE_API_ISSUER` |
| `APPLE_TEAM_ID` | Team ID。API key 公证使用前三项；Team ID 供 Apple ID 密码流程使用，脚本仍要求它存在 | `APPLE_TEAM_ID` |

不要设置 `CSC_IDENTITY_AUTO_DISCOVERY=false`，也不要设置带 `Developer ID Application:` 前缀的 `CSC_NAME`。脚本会打开证书自动发现，用 `CSC_LINK` 里的 Developer ID 签名，并在公证后检查 Authority 是否为 `Developer ID Application: wenxing hu (446BLT75JZ)`，再对 `.app` 执行 `xcrun stapler validate`。`APPLE_API_KEY`、`APPLE_API_KEY_ID`、`APPLE_API_ISSUER` 都为空时，electron-builder 跳过公证；未签名 CI 不设置它们。

产物：

- `release/lequdao-mac.dmg`
- `release/lequdao-windows.exe`

## 检查更新

应用里的「检查更新」读取 ModelScope 数据集 [SmartFlowAI/music-learning-app](https://modelscope.cn/datasets/SmartFlowAI/music-learning-app) 的 `latest/VERSION`，和本机版本比较。有新版本时，按平台下载：

- Android：`latest/lequdao-debug.apk`
- 网页：`latest/lequdao-web.zip`
- Mac：`latest/lequdao-mac.dmg`
- Windows：`latest/lequdao-windows.exe`

下载前会对照 `latest/SHA256SUMS`。地址形如 `https://modelscope.cn/datasets/SmartFlowAI/music-learning-app/resolve/master/latest/VERSION`。

## 持续集成

`.github/workflows/ci.yml` 会在拉取请求和 `main` 上：

1. 运行 lint 和单元测试
2. 构建网页包和 debug APK
3. 在 macOS 上构建通用 `lequdao-mac.dmg`（Intel 与 Apple Silicon）。这一步设置 `CSC_IDENTITY_AUTO_DISCOVERY=false`，且不提供 Apple 环境变量，因此不签名、也不公证
4. 在 Windows 上构建未签名的 `lequdao-windows.exe`
5. 上传产物：`lequdao-web`、`lequdao-debug-apk`、`lequdao-mac`、`lequdao-windows`

推送 `v*` 标签时，同一次构建会把 `lequdao-web.zip`、`lequdao-debug.apk`、`lequdao-mac.dmg` 和 `lequdao-windows.exe` 附加到 GitHub Release。这个 Mac 包仍是未签名的。要换成 Developer ID 签名并公证的 `lequdao-mac.dmg`，在 agent-network-app 里对同一个 tag 运行 `npm run desktop:mac:signed`（见上一节的环境变量）。Android 应用 id 是 `top.sleep2agi.lequdao`。

## 技术栈

Vite、React、TypeScript、Vitest、Capacitor（Android）、Electron（Mac 与 Windows）。桌面浏览器直接使用网页版。

高音谱号使用 [Noto Music](https://github.com/notofonts/notomusic)，许可见 `LICENSES/NotoMusic-OFL.txt`（SIL Open Font License 1.1）。
