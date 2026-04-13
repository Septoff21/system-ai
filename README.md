# System AI

A Jarvis/Friday-style local AI desktop assistant powered by Ollama.

Transparent HUD interface. Voice conversation. Fully local. No cloud required.

[中文文档 / Chinese README](README_CN.md)

## Screenshot

### Main HUD / Main Interface

![Main HUD](local-agent.png)

### Boot Sequence / Startup Animation

![Boot Sequence](local-agent2.png)

### Settings Panel / Configuration

![Settings Panel](local-agent3.png)

## Features

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

## Prerequisites

| Dependency | Size | Download |
|------------|------|----------|
| [Node.js](https://nodejs.org/) v18+ | ~70MB | [nodejs.org](https://nodejs.org/) |
| [Python](https://www.python.org/) 3.10+ | ~25MB | [python.org](https://www.python.org/) |
| [Ollama](https://ollama.ai/) | ~200MB | [ollama.ai](https://ollama.ai/) |

**Estimated total download: ~6-9 GB** (including Gemma model)

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/Septoff21/system-ai.git
cd system-ai

# 2. Install Node.js dependencies
npm install                              # ~300MB, 3-5 min

# 3. Install Python dependencies
pip install edge-tts faster-whisper      # ~100MB, 2-3 min

# 4. Make sure Ollama is running
ollama serve

# 5. Start the app
npm run electron:dev
```

> The **first-run setup wizard** will guide you through checking dependencies,
> selecting an AI model based on your hardware, and configuring your persona.

The Whisper `tiny` model (~75MB) downloads automatically on first voice input.

## Configuration

### First-Run Wizard

On first launch, the app opens a setup wizard that:

1. **Dependency check** — Verifies Ollama, Python, and required packages are installed
2. **Port configuration** — Auto-detects Ollama endpoint (default: `localhost:11434`)
3. **Hardware scan** — Detects CPU, RAM, GPU to recommend the best model
4. **Model selection** — Recommends and pulls a model based on your hardware
5. **Persona setup** — Choose J.A.R.V.I.S. or F.R.I.D.A.Y.
6. **user.md creation** — Set your name and preferences

### user.md

Edit `user.md` to personalize the AI's knowledge about you:

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

### Settings Panel

Click the gear icon in the bottom bar to configure:

- **Model Provider** — Ollama (local) or OpenAI API
- **Active Model** — Select from installed Ollama models or type custom model name
- **TTS Engine** — Edge TTS (online) or Fish Speech (local, voice cloning)
- **Persona** — J.A.R.V.I.S. (British) or F.R.I.D.A.Y. (American)
- **Voice Rate/Pitch** — Fine-tune the voice
- **Always Listening** — Continuous mic mode
- **Silence Timeout** — Auto-stop after N seconds of silence (default 1.5s)

### Python Path

Python is auto-detected in this order:

1. Environment variable `PYTHON_PATH` or `PYTHON`
2. `python` / `python3` on your system PATH
3. Common install locations per platform

To override, set the env var before launching:

```bash
# Windows (PowerShell)
$env:PYTHON_PATH = "C:\Path\To\python.exe"
npm run electron:dev

# macOS / Linux
PYTHON_PATH=/usr/bin/python3 npm run electron:dev
```

## Architecture

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

### TTS/STT Dual-Server Pattern

Both TTS and STT use the same architecture:

1. Python server starts on random port, prints `PORT:NNNNN` to stdout
2. Node.js reads port, stores it for HTTP requests
3. On request: Node sends HTTP POST to `localhost:port`
4. Python processes and returns result
5. If Python crashes, Node auto-restarts it

This avoids spawning a new Python process per request (~1s overhead saved).

## Commands

| Command | Description |
|---------|-------------|
| `npm run electron:dev` | Start development (Vite + Electron) |
| `npm run dev` | Vite only (no Electron) |
| `npm run electron:build` | Build production installer |

## Models

Works with any Ollama model. Recommended:

| Model | Size | RAM Needed | Quality |
|-------|------|-----------|---------|
| `gemma3:1b` | ~800MB | 4GB+ | Lightweight |
| `llama3.2:3b` | ~2GB | 4GB+ | Fast |
| `gemma3:4b` | ~2.5GB | 6GB+ | Good |
| `gemma4:e4b` | ~5GB | 8GB+ | Better |
| `gemma4:12b` | ~8GB | 16GB+ | Great |
| `gemma4:26b` | ~16GB | 32GB+ | Best |

The setup wizard recommends a model based on your available RAM and GPU.

### Custom Models

You can use any Ollama model — even ones not listed above. In Settings, type the model name directly in the model input field.

For OpenAI-compatible APIs (e.g., local LLM servers like vLLM, LM Studio), select "OpenAI API" provider and enter the endpoint + model name.

## Adding Fish Speech (Voice Cloning)

For Jarvis-quality voice cloning:

```bash
# Install Fish Speech
pip install fish-speech

# Place reference audio clips:
# electron/services/voices/jarvis.wav   — 10-30s of Jarvis dialogue
# electron/services/voices/friday.wav   — 10-30s of Friday dialogue

# Then select "Fish Speech" in Settings → TTS Engine
```

## Extending

System AI is designed to be extensible:

- **Custom models** — Any Ollama model or OpenAI-compatible API
- **File operations** — AI can read/write/edit local files via IPC
- **user.md** — Personalize the AI's context about you
- **Personas** — Add new personas in `conversation.js`
- **TTS engines** — Edge TTS (online) or Fish Speech (local)
- **STT** — Local Whisper, auto-downloads on first use

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+J` | Show/hide window |

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| Windows 10/11 | Supported | Primary target |
| macOS (Intel) | Untested | Should work |
| macOS (Apple Silicon M4) | Planned | 16GB unified memory |
| Linux | Untested | Electron + Python should work |

## Roadmap

- [x] Electron transparent HUD
- [x] Ollama streaming chat
- [x] Edge TTS voice output
- [x] Whisper STT voice input
- [x] Settings panel with model selector
- [x] Voice interrupt (speaking stops AI)
- [x] File operations plugin
- [x] First-run setup wizard
- [x] Auto-detect Python path
- [ ] Fish Speech voice cloning TTS
- [ ] Jarvis/Friday theme toggle (cyan vs orange)
- [ ] Wake word detection ("Hey Jarvis")
- [ ] Conversation history persistence
- [ ] Plugin system for extensions
- [ ] macOS installer

## Contributing

Feel free to fork, submit PRs, or open issues!

## License

MIT
