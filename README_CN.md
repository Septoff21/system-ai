# System AI

Jarvis/Friday 风格本地 AI 桌面助手，基于 Ollama。

透明 HUD 界面，语音对话，完全本地运行，无需云端。

[English README](README.md)

## 截图

### 主界面 / HUD

![主界面](local-agent.png)

### 启动动画 / Boot Sequence

![启动动画](local-agent2.png)

### 设置面板 / Settings

![设置面板](local-agent3.png)

## 功能

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

## 前置依赖

| 依赖 | 大小 | 下载 |
|------------|------|----------|
| [Node.js](https://nodejs.org/) v18+ | ~70MB | [nodejs.org](https://nodejs.org/) |
| [Python](https://www.python.org/) 3.10+ | ~25MB | [python.org](https://www.python.org/) |
| [Ollama](https://ollama.ai/) | ~200MB | [ollama.ai](https://ollama.ai/) |

**预计总下载量: ~6-9 GB**（含 Gemma 模型）

## 安装

```bash
# 1. 克隆仓库
git clone https://github.com/Septoff21/system-ai.git
cd system-ai

# 2. 安装 Node.js 依赖
npm install                              # ~300MB, 3-5 分钟

# 3. 安装 Python 依赖
pip install edge-tts faster-whisper      # ~100MB, 2-3 分钟

# 4. 确保 Ollama 正在运行
ollama serve

# 5. 启动应用
npm run electron:dev
```

> **首次启动时会自动弹出安装向导**，引导你检测依赖、根据硬件选择 AI 模型、配置角色。

Whisper `tiny` 模型 (~75MB) 会在首次语音输入时自动下载。

## 配置

### 首次安装向导

首次启动时会弹出安装向导：

1. **依赖检测** — 验证 Ollama、Python 及所需包是否已安装
2. **端口配置** — 自动检测 Ollama 端点（默认：`localhost:11434`）
3. **硬件扫描** — 检测 CPU、内存、GPU，推荐最佳模型
4. **模型选择** — 根据硬件推荐并拉取模型
5. **角色设置** — 选择 J.A.R.V.I.S. 或 F.R.I.D.A.Y.
6. **user.md 创建** — 设置你的名字和偏好

### user.md

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

### 设置面板

点击底部栏的齿轮图标进行配置：

- **模型提供者** — Ollama（本地）或 OpenAI API
- **活跃模型** — 选择已安装的模型或输入自定义模型名
- **TTS 引擎** — Edge TTS（在线）或 Fish Speech（本地语音克隆）
- **角色** — J.A.R.V.I.S.（英式）或 F.R.I.D.A.Y.（美式）
- **语音速率/音调** — 微调语音
- **持续监听** — 连续麦克风模式
- **静音超时** — N 秒后自动停止（默认 1.5 秒）

### Python 路径

Python 按以下顺序自动检测：

1. 环境变量 `PYTHON_PATH` 或 `PYTHON`
2. 系统 PATH 中的 `python` / `python3`
3. 各平台常见安装路径

覆盖方式，启动前设置环境变量：

```bash
# Windows (PowerShell)
$env:PYTHON_PATH = "C:\Path\To\python.exe"
npm run electron:dev

# macOS / Linux
PYTHON_PATH=/usr/bin/python3 npm run electron:dev
```

## 架构

```
Electron 主进程
  ├── main.js                    — 入口、IPC 处理、生命周期
  ├── preload.js                 — contextBridge IPC 桥接
  └── services/
      ├── python.js              — 自动检测 Python 路径
      ├── ollama.js              — Ollama HTTP API
      ├── conversation.js        — 聊天历史 + 系统提示
      ├── tts.js                 — Edge TTS 封装
      ├── tts_server.py          — Edge TTS Python 服务
      ├── tts_fish_server.py     — Fish Speech TTS 服务（可选）
      ├── stt.js                 — Whisper STT 封装
      ├── stt_server.py          — Whisper STT Python 服务
      └── fileops.js             — 文件读写列表操作

React 渲染器 (Vite)
  ├── stores/chatStore.ts        — Zustand 状态管理
  ├── components/
  │   ├── BootSequence/          — 启动动画 + 蜂鸣声
  │   ├── SetupWizard/           — 首次安装向导
  │   ├── HUD/                   — HUDLayout, ArcReactor, 面板
  │   ├── Chat/                  — 聊天面板，流式文本
  │   └── Settings/              — 设置面板
  └── styles/                    — 主题、动画
```

### TTS/STT 双服务模式

TTS 和 STT 使用相同的架构：

1. Python 服务启动在随机端口，输出 `PORT:NNNNN` 到 stdout
2. Node.js 读取端口，存储用于 HTTP 请求
3. 请求时 Node 发送 HTTP POST 到 `localhost:port`
4. Python 处理并返回结果
5. Python 崩溃时 Node 自动重启

这避免了每次请求都启动新的 Python 进程（节省约 1 秒开销）。

## 命令

| 命令 | 说明 |
|---------|-------------|
| `npm run electron:dev` | 启动开发模式（Vite + Electron） |
| `npm run dev` | 仅 Vite（无 Electron） |
| `npm run electron:build` | 构建生产安装包 |

## 模型

支持所有 Ollama 模型，推荐：

| 模型 | 大小 | 内存需求 | 质量 |
|-------|------|-----------|---------|
| `gemma3:1b` | ~800MB | 4GB+ | 轻量 |
| `llama3.2:3b` | ~2GB | 4GB+ | 快速 |
| `gemma3:4b` | ~2.5GB | 6GB+ | 良好 |
| `gemma4:e4b` | ~5GB | 8GB+ | 更好 |
| `gemma4:12b` | ~8GB | 16GB+ | 优秀 |
| `gemma4:26b` | ~16GB | 32GB+ | 最佳 |

安装向导会根据你的可用内存和 GPU 推荐模型。

### 自定义模型

你可以使用任何 Ollama 模型——即使上面没列出的。在设置中直接在模型输入框输入模型名。

对于 OpenAI 兼容 API（如 vLLM、LM Studio 等本地 LLM 服务器），选择 "OpenAI API" 提供者并输入端点 + 模型名。

## 添加 Fish Speech（语音克隆）

实现 Jarvis 级别的语音克隆：

```bash
# 安装 Fish Speech
pip install fish-speech

# 放置参考音频：
# electron/services/voices/jarvis.wav   — 10-30 秒 Jarvis 对话
# electron/services/voices/friday.wav   — 10-30 秒 Friday 对话

# 然后在 设置 → TTS 引擎 中选择 "Fish Speech"
```

## 扩展

System AI 设计为可扩展：

- **自定义模型** — 任意 Ollama 模型或 OpenAI 兼容 API
- **文件操作** — AI 可通过 IPC 读写编辑本地文件
- **user.md** — 个性化 AI 对你的了解
- **角色** — 在 `conversation.js` 中添加新角色
- **TTS 引擎** — Edge TTS（在线）或 Fish Speech（本地）
- **STT** — 本地 Whisper，首次使用自动下载

## 快捷键

| 快捷键 | 操作 |
|----------|--------|
| `Alt+J` | 显示/隐藏窗口 |

## 平台支持

| 平台 | 状态 | 备注 |
|----------|--------|-------|
| Windows 10/11 | 已支持 | 主要目标 |
| macOS (Intel) | 未测试 | 应该可用 |
| macOS (Apple Silicon M4) | 计划中 | 16GB 统一内存 |
| Linux | 未测试 | Electron + Python 应该可用 |

## 路线图

- [x] 透明 HUD
- [x] 流式聊天
- [x] 语音输出
- [x] 语音输入
- [x] 设置面板 + 模型选择
- [x] 语音中断
- [x] 文件操作插件
- [x] 首次安装向导
- [x] Python 路径自动检测
- [ ] 语音克隆 TTS
- [ ] 主题切换（青色 vs 橙色）
- [ ] 唤醒词检测（"Hey Jarvis"）
- [ ] 对话历史持久化
- [ ] 插件系统
- [ ] macOS 安装包

## 贡献

欢迎 Fork、提交 PR 或开 Issue！

## 许可证

MIT
