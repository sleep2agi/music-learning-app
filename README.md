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

## 持续集成

`.github/workflows/ci.yml` 会在拉取请求和 `main` 上：

1. 运行 lint 和单元测试
2. 构建网页包
3. 构建 debug APK
4. 上传两个产物：`lequdao-web`（网页 zip）和 `lequdao-debug-apk`

推送 `v*` 标签时，同一次构建还会把 `lequdao-web.zip` 和 `lequdao-debug.apk` 附加到 GitHub Release。Android 应用 id 是 `top.sleep2agi.lequdao`。

## 技术栈

Vite、React、TypeScript、Vitest、Capacitor（Android）。桌面浏览器直接使用网页版。

高音谱号使用 [Noto Music](https://github.com/notofonts/notomusic)，许可见 `LICENSES/NotoMusic-OFL.txt`（SIL Open Font License 1.1）。
