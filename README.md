# System AI

A Jarvis/Friday-style local AI desktop assistant powered by Ollama.

Transparent HUD interface. Voice conversation. Fully local. No cloud required.

---

> **Jarvis/Friday 风格本地 AI 桌面助手，基于 Ollama。**
> 透明 HUD 界面，语音对话，完全本地运行，无需云端。

## Features / 功能

- **Sci-fi HUD interface** — Transparent frameless window, ArcReactor animation, boot sequence
- **First-run setup wizard** — Auto-detects dependencies, recommends model based on hardware
- **Streaming chat** — Ollama with real-time text display, any model
- **Voice output (TTS)** — Edge TTS with British Jarvis voice, or Fish Speech for voice cloning
- **Voice input (STT)** — Local Whisper speech recognition, auto-stops on silence
- **Smart interrupt** — Speaking stops AI audio output instantly
- **Always-on mic** — Optional continuous listening mode
- **Settings panel** — Model selector, TTS engine, voice config, silence timeout
- **File operations** — Open, read, save, edit local files via AI
- **System monitor** — CPU, RAM, GPU, weather, uptime, radar display
- **user.md context** — Persistent user profile injected into system prompt
- **Extensible** — Plugin-ready architecture for future expansions

---

- **科幻 HUD 界面** — 透明无边框窗口，ArcReactor 动画，启动序列
- **首次安装向导** — 自动检测依赖，根据硬件推荐模型
- **流式聊天** — Ollama 实时文字显示，支持任意模型
- **语音输出 (TTS)** — Edge TTS 英式 Jarvis 声音，或 Fish Speech 语音克隆
- **语音输入 (STT)** — 本地 Whisper 语音识别，静音自动停止
- **智能中断** — 用户说话时立刻停止 AI 语音输出
- **持续监听** — 可选的连续麦克风模式
- **设置面板** — 模型选择、TTS 引擎、语音配置、静音超时
- **文件操作** — 通过 AI 打开、读取、保存、编辑本地文件
- **系统监控** — CPU、内存、GPU、天气、运行时间、雷达显示
- **user.md 上下文** — 持久化用户档案注入系统提示
- **可扩展** — 插件架构，支持后续扩展

## Screenshot / 截图

![Screenshot](local-agent.png)

## Prerequisites / 前置依赖

| Dependency | Size / 大小 | Download / 下载 |
|------------|------|----------|
| [Node.js](https://nodejs.org/) v18+ | ~70MB | [nodejs.org](https://nodejs.org/) |
| [Python](https://www.python.org/) 3.10+ | ~25MB | [python.org](https://www.python.org/) |
| [Ollama](https://ollama.ai/) | ~200MB | [ollama.ai](https://ollama.ai/) |

**Estimated total download / 预计总下载量: ~6-9 GB** (including Gemma model / 含 Gemma 模型)

## Installation / 安装

```bash
# 1. Clone the repo / 克隆仓库
git clone https://github.com/Septoff21/system-ai.git
cd system-ai

# 2. Install Node.js dependencies / 安装 Node.js 依赖
npm install                              # ~300MB, 3-5 min

# 3. Install Python dependencies / 安装 Python 依赖
pip install edge-tts faster-whisper      # ~100MB, 2-3 min

# 4. Make sure Ollama is running / 确保 Ollama 正在运行
ollama serve

# 5. Start the app / 启动应用
npm run electron:dev
```

> The **first-run setup wizard** will guide you through checking dependencies,
> selecting an AI model based on your hardware, and configuring your persona.
>
> **首次启动时会自动弹出安装向导**，引导你检测依赖、根据硬件选择 AI 模型、配置角色。

The Whisper `tiny` model (~75MB) downloads automatically on first voice input.
Whisper `tiny` 模型 (~75MB) 会在首次语音输入时自动下载。

## Configuration / 配置

### First-Run Wizard / 首次安装向导

On first launch, the app opens a setup wizard that:

1. **Dependency check** — Verifies Ollama, Python, and required packages are installed
2. **Port configuration** — Auto-detects Ollama endpoint (default: `localhost:11434`)
3. **Hardware scan** — Detects CPU, RAM, GPU to recommend the best model
4. **Model selection** — Recommends and pulls a model based on your hardware
5. **Persona setup** — Choose J.A.R.V.I.S. or F.R.I.D.A.Y.
6. **user.md creation** — Set your name and preferences

首次启动时会弹出安装向导：

1. **依赖检测** — 验证 Ollama、Python 及所需包是否已安装
2. **端口配置** — 自动检测 Ollama 端点（默认：`localhost:11434`）
3. **硬件扫描** — 检测 CPU、内存、GPU，推荐最佳模型
4. **模型选择** — 根据硬件推荐并拉取模型
5. **角色设置** — 选择 J.A.R.V.I.S. 或 F.R.I.D.A.Y.
6. **user.md 创建** — 设置你的名字和偏好

### user.md

Edit `user.md` to personalize the AI's knowledge about you:
编辑 `user.md` 来个性化 AI 对你的了解：

```markdown
# User Profile
- Name: sir
- Location: Kuala Lumpur, Malaysia
- Language: English (conversational)
- Timezone: Asia/Kuala_Lumpur

## Preferences
- Prefers concise, direct answers
- Likes the Jarvis persona
```

### Settings Panel / 设置面板

Click the gear icon in the bottom bar to configure:
点击底部栏的齿轮图标进行配置：

- **Model Provider** — Ollama (local) or OpenAI API / 模型提供者 — Ollama（本地）或 OpenAI API
- **Active Model** — Select from installed Ollama models or type custom model name / 选择已安装的模型或输入自定义模型名
- **TTS Engine** — Edge TTS (online) or Fish Speech (local, voice cloning) / TTS 引擎 — Edge TTS（在线）或 Fish Speech（本地语音克隆）
- **Persona** — J.A.R.V.I.S. (British) or F.R.I.D.A.Y. (American) / 角色 — J.A.R.V.I.S.（英式）或 F.R.I.D.A.Y.（美式）
- **Voice Rate/Pitch** — Fine-tune the voice / 语音速率/音调微调
- **Always Listening** — Continuous mic mode / 持续监听模式
- **Silence Timeout** — Auto-stop after N seconds of silence (default 1.5s) / 静音超时 — N秒后自动停止（默认1.5秒）

### Python Path / Python 路径

Python is auto-detected in this order / Python 按以下顺序自动检测：

1. Environment variable `PYTHON_PATH` or `PYTHON` / 环境变量 `PYTHON_PATH` 或 `PYTHON`
2. `python` / `python3` on your system PATH / 系统 PATH 中的 `python` / `python3`
3. Common install locations per platform / 各平台常见安装路径

To override, set the env var before launching / 覆盖方式，启动前设置环境变量：

```bash
# Windows (PowerShell)
$env:PYTHON_PATH = "C:\Path\To\python.exe"
npm run electron:dev

# macOS / Linux
PYTHON_PATH=/usr/bin/python3 npm run electron:dev
```

## Architecture / 架构

```
Electron Main Process
  ├── main.js                    — Entry, IPC handlers, lifecycle
  ├── preload.js                 — contextBridge IPC bridge
  └── services/
      ├── python.js              — Auto-detect Python executable path
      ├── ollama.js              — Ollama HTTP API
      ├── conversation.js        — Chat history + system prompts
      ├── tts.js                 — Edge TTS wrapper
      ├── tts_server.py          — Edge TTS Python server
      ├── tts_fish_server.py     — Fish Speech TTS server (optional)
      ├── stt.js                 — Whisper STT wrapper
      ├── stt_server.py          — Whisper STT Python server
      └── fileops.js             — File read/write/list operations

React Renderer (Vite)
  ├── stores/chatStore.ts        — Zustand state management
  ├── components/
  │   ├── BootSequence/          — Boot animation + beeps
  │   ├── SetupWizard/           — First-run setup wizard
  │   ├── HUD/                   — HUDLayout, ArcReactor, panels
  │   ├── Chat/                  — Chat panel, streaming text
  │   └── Settings/              — Settings panel
  └── styles/                    — Theme, animations
```

### TTS/STT Dual-Server Pattern / TTS/STT 双服务模式

Both TTS and STT use the same architecture / TTS 和 STT 使用相同的架构：

1. Python server starts on random port, prints `PORT:NNNNN` to stdout / Python 服务启动在随机端口，输出 `PORT:NNNNN`
2. Node.js reads port, stores it for HTTP requests / Node.js 读取端口，存储用于 HTTP 请求
3. On request: Node sends HTTP POST to `localhost:port` / 请求时 Node 发送 HTTP POST
4. Python processes and returns result / Python 处理并返回结果
5. If Python crashes, Node auto-restarts it / Python 崩溃时 Node 自动重启

This avoids spawning a new Python process per request (~1s overhead saved).
这避免了每次请求都启动新的 Python 进程（节省约 1 秒开销）。

## Commands / 命令

| Command / 命令 | Description / 说明 |
|---------|-------------|
| `npm run electron:dev` | Start development (Vite + Electron) / 启动开发模式 |
| `npm run dev` | Vite only (no Electron) / 仅 Vite（无 Electron） |
| `npm run electron:build` | Build production installer / 构建生产安装包 |

## Models / 模型

Works with any Ollama model. Recommended / 支持所有 Ollama 模型，推荐：

| Model / 模型 | Size / 大小 | RAM Needed / 内存 | Quality / 质量 |
|-------|------|-----------|---------|
| `gemma3:1b` | ~800MB | 4GB+ | Lightweight / 轻量 |
| `llama3.2:3b` | ~2GB | 4GB+ | Fast / 快速 |
| `gemma3:4b` | ~2.5GB | 6GB+ | Good / 良好 |
| `gemma4:e4b` | ~5GB | 8GB+ | Better / 更好 |
| `gemma4:12b` | ~8GB | 16GB+ | Great / 优秀 |
| `gemma4:26b` | ~16GB | 32GB+ | Best / 最佳 |

The setup wizard recommends a model based on your available RAM and GPU.
安装向导会根据你的可用内存和 GPU 推荐模型。

### Custom Models / 自定义模型

You can use any Ollama model — even ones not listed above. In Settings, type the model name directly in the model input field.
你可以使用任何 Ollama 模型——即使上面没列出的。在设置中直接在模型输入框输入模型名。

For OpenAI-compatible APIs (e.g., local LLM servers like vLLM, LM Studio), select "OpenAI API" provider and enter the endpoint + model name.
对于 OpenAI 兼容 API（如 vLLM、LM Studio 等本地 LLM 服务器），选择 "OpenAI API" 提供者并输入端点 + 模型名。

## Adding Fish Speech (Voice Cloning) / 添加 Fish Speech（语音克隆）

For Jarvis-quality voice cloning / 实现 Jarvis 级别的语音克隆：

```bash
# Install Fish Speech / 安装 Fish Speech
pip install fish-speech

# Place reference audio clips / 放置参考音频：
# electron/services/voices/jarvis.wav   — 10-30s of Jarvis dialogue
# electron/services/voices/friday.wav   — 10-30s of Friday dialogue

# Then select "Fish Speech" in Settings → TTS Engine
# 然后在 设置 → TTS 引擎 中选择 "Fish Speech"
```

## Extending / 扩展

System AI is designed to be extensible / System AI 设计为可扩展：

- **Custom models** — Any Ollama model or OpenAI-compatible API / 任意 Ollama 模型或 OpenAI 兼容 API
- **File operations** — AI can read/write/edit local files via IPC / AI 可通过 IPC 读写编辑本地文件
- **user.md** — Personalize the AI's context about you / 个性化 AI 对你的了解
- **Personas** — Add new personas in `conversation.js` / 在 `conversation.js` 中添加新角色
- **TTS engines** — Edge TTS (online) or Fish Speech (local) / Edge TTS（在线）或 Fish Speech（本地）
- **STT** — Local Whisper, auto-downloads on first use / 本地 Whisper，首次使用自动下载

## Keyboard Shortcuts / 快捷键

| Shortcut / 快捷键 | Action / 操作 |
|----------|--------|
| `Alt+J` | Show/hide window / 显示/隐藏窗口 |

## Platform Support / 平台支持

| Platform / 平台 | Status / 状态 | Notes / 备注 |
|----------|--------|-------|
| Windows 10/11 | Supported / 已支持 | Primary target / 主要目标 |
| macOS (Intel) | Untested / 未测试 | Should work / 应该可用 |
| macOS (Apple Silicon M4) | Planned / 计划中 | 16GB unified memory |
| Linux | Untested / 未测试 | Electron + Python should work |

## Roadmap / 路线图

- [x] Electron transparent HUD / 透明 HUD
- [x] Ollama streaming chat / 流式聊天
- [x] Edge TTS voice output / 语音输出
- [x] Whisper STT voice input / 语音输入
- [x] Settings panel with model selector / 设置面板 + 模型选择
- [x] Voice interrupt (speaking stops AI) / 语音中断
- [x] File operations plugin / 文件操作插件
- [x] First-run setup wizard / 首次安装向导
- [x] Auto-detect Python path / Python 路径自动检测
- [ ] Fish Speech voice cloning TTS / 语音克隆 TTS
- [ ] Jarvis/Friday theme toggle (cyan vs orange) / 主题切换
- [ ] Wake word detection ("Hey Jarvis") / 唤醒词检测
- [ ] Conversation history persistence / 对话历史持久化
- [ ] Plugin system for extensions / 插件系统
- [ ] macOS installer / macOS 安装包

## Contributing / 贡献

Feel free to fork, submit PRs, or open issues!
欢迎 Fork、提交 PR 或开 Issue！

## License / 许可证

MIT
