# System AI — Implementation Plan

> A Jarvis/Friday-style local AI desktop assistant powered by Gemma 4 + Ollama + Electron

---

## Architecture Overview

```
Electron Main Process
  ├── services/ollama.js        — Ollama HTTP API (streaming chat)
  ├── services/conversation.js  — Chat history + Jarvis/Friday prompts + user.md
  ├── services/tts.js           — Edge TTS Node.js wrapper
  ├── services/tts_server.py    — Python persistent TTS server (edge-tts)
  ├── services/stt.js           — Whisper STT Node.js wrapper
  └── services/stt_server.py    — Python persistent STT server (faster-whisper)

React Renderer (Vite)
  ├── stores/chatStore.ts       — Zustand state + TTS queue + MediaRecorder STT
  ├── components/HUD/           — HUDLayout, ArcReactor, LeftPanel, RightPanel
  ├── components/Chat/          — ChatPanel, MessageBubble, InputBar
  └── components/BootSequence/  — Boot animation
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Desktop shell | Electron 33+ | Transparent frameless window, cross-platform |
| Frontend | React 19 + TypeScript | Component model, type safety |
| Animations | Framer Motion + Canvas API | Smooth HUD transitions, particle effects |
| 3D core | Three.js (ArcReactor) | Central energy core visual |
| Build | Vite 6 + electron-builder | Fast dev + packaging |
| LLM | Ollama (Gemma 4) | Local inference, no cloud dependency |
| TTS | Python edge-tts (en-GB-RyanNeural) | Free, high quality British voice |
| STT | Python faster-whisper (tiny) | Local offline speech recognition |
| State | Zustand 5 | Lightweight, no boilerplate |
| Hardware | systeminformation | CPU/GPU/RAM detection |

---

## Phase Status

### Phase 1: Electron Scaffold — DONE

- Transparent frameless window (`transparent: true, frame: false`)
- System tray with Show/Hide/Quit menu
- Global shortcut Alt+J to toggle window
- IPC contextBridge for secure renderer communication
- Hardware detection via systeminformation

### Phase 2: HUD Interface — DONE

- Boot sequence (7.2s sci-fi animation with synthesized beeps)
- ArcReactor — Canvas 2D energy core animation with "J.A.R.V.I.S." label
- Left panel — Time/date, storage bar, power ring, CPU/RAM, weather, radar scan
- Right panel — AI STATUS, SYSTEM, COMMS
- Bottom bar — Pure SVG icon buttons (mic, speaker, type, settings)
- Chat panel with streaming text, typewriter effect, message bubbles
- Framer Motion stagger animations on load

### Phase 3: Ollama Integration — DONE

- Streaming chat via POST /api/chat
- `keep_alive: '10m'` — model stays in memory between requests
- Conversation history management with context window (20 messages max)
- Jarvis/Friday system prompts with strict output format rules
- user.md loaded at startup, injected into system prompt

### Phase 4: TTS Voice Output — DONE

- Python `edge-tts` persistent HTTP server (avoids per-request process spawn)
- Voice: `en-GB-RyanNeural` (British male, closest to Jarvis)
- Full-text generation (no sentence splitting — no pauses between sentences)
- Audio queue for sequential playback
- Standalone `speakText()` for boot greeting
- `cleanForSpeech()` regex pipeline strips all markdown/emoji before TTS

### Phase 5: STT Voice Input — DONE

- Replaced broken `webkitSpeechRecognition` with MediaRecorder + faster-whisper
- Python Whisper persistent HTTP server (mirrors TTS architecture)
- Auto-stop on 1.5s silence (AudioContext volume monitoring)
- Push-to-talk: click mic to start, auto-stops on silence or click again
- Whisper `tiny` model (~75MB, auto-downloads on first use)

### Phase 6: Jarvis/Friday Theme Toggle — PLANNED

- Cyan (Jarvis) vs Orange (Friday) color scheme
- Switch CSS variables, TTS voice, and system prompt simultaneously
- Toggle button in settings

### Phase 7: Customization — PLANNED

- Customizable brand name in HUD
- IP geolocation on radar
- Configurable TTS voice settings (rate, pitch)
- Model hot-swap (switch between Ollama models)

### Phase 8: Wake Word — PLANNED

- "Hey Jarvis" / "Hey Friday" wake word detection
- Always-on low-power audio monitoring
- Integration with Porcupine or similar

---

## File Structure (Current)

```
system-ai/
├── electron/
│   ├── main.js                 — Main process entry, IPC handlers, lifecycle
│   ├── preload.js              — contextBridge IPC bridge
│   └── services/
│       ├── ollama.js           — Ollama HTTP API (status, streaming chat)
│       ├── conversation.js     — Chat history, system prompts, user.md loader
│       ├── tts.js              — Edge TTS Node.js wrapper (spawns Python server)
│       ├── tts_server.py       — Edge TTS Python HTTP server (persistent)
│       ├── stt.js              — Whisper STT Node.js wrapper (spawns Python server)
│       └── stt_server.py       — Whisper STT Python HTTP server (persistent)
├── src/
│   ├── App.tsx                 — Root component (Boot → HUD)
│   ├── main.tsx                — React entry point
│   ├── stores/
│   │   └── chatStore.ts        — Zustand state, TTS queue, MediaRecorder STT
│   ├── components/
│   │   ├── BootSequence/       — Boot animation + beeps + welcome greeting
│   │   ├── HUD/                — HUDLayout, ArcReactor, LeftPanel, RightPanel
│   │   ├── Chat/               — ChatPanel, streaming text, input bar
│   │   └── TitleBar/           — Custom title bar (hidden, for drag region)
│   ├── styles/
│   │   ├── theme.css           — CSS variables, colors, fonts
│   │   └── animations.css      — Shared keyframes
│   └── types/
│       ├── electron.d.ts       — Window.electronAPI type definitions
│       └── chat.ts             — Message interface
├── user.md                     — User context (loaded into system prompt)
├── index.html                  — Vite entry HTML
├── package.json                — Dependencies and scripts
├── vite.config.ts              — Vite + React plugin config
├── tsconfig.json               — TypeScript config
└── README.md                   — Project documentation
```

---

## Download Size & Time Estimates

| Component | Size | Time |
|-----------|------|------|
| Node.js 18+ | ~70MB | 1-2 min |
| `npm install` | ~300MB | 3-5 min |
| Python 3.12 | ~25MB | 1 min |
| `pip install edge-tts faster-whisper` | ~100MB | 2-3 min |
| Whisper `tiny` model | ~75MB | 1-2 min (auto on first STT use) |
| Ollama | ~200MB | 3-5 min |
| `ollama pull gemma4:e4b` | ~5-8GB | 10-30 min |
| **Total** | **~6-9GB** | **~20-45 min** |

---

## How the TTS/STT Dual-Server Pattern Works

Both TTS and STT use the same architecture:

```
React (renderer)          Electron (main)           Python (child process)
     │                         │                           │
     │── IPC invoke ──────────>│                           │
     │                         │── HTTP POST ─────────────>│
     │                         │                           │── Process audio
     │                         │<── JSON/binary response ──│
     │<── IPC response ────────│                           │
```

1. Python server starts on random port, prints `PORT:NNNNN` to stdout
2. Node.js reads port, stores it for HTTP requests
3. On request: Node sends HTTP POST to localhost:port
4. Python processes and returns result
5. If Python crashes, Node auto-restarts it

This avoids spawning a new Python process per request (~1s overhead saved).

---

## Key Design Decisions

### Why Python for TTS/STT instead of native Node.js?

- **TTS**: Edge TTS's Node.js `ws` library was blocked by Microsoft's TLS fingerprint detection. Python's `aiohttp` matches Chrome's fingerprint, so it works.
- **STT**: `webkitSpeechRecognition` relies on Google cloud services which are unavailable in Electron. `faster-whisper` runs entirely offline with better accuracy.

### Why full-text TTS instead of sentence-by-sentence?

The user reported "why do those 3 sentences pause, can't they just flow?" — sending the entire response as one TTS request eliminates unnatural pauses between sentences.

### Why push-to-talk instead of always-on listening?

More reliable and predictable. The user clicks the mic button, speaks, and the system auto-stops after 1.5s of silence. This avoids false triggers and wasted transcription calls.

---

## Configuration Reference

| Setting | Location | Default |
|---------|----------|---------|
| Python path | `electron/services/tts.js`, `stt.js` | `C:\Users\PC\AppData\Local\Programs\Python\Python312\python.exe` |
| TTS voice | `electron/services/tts_server.py` | `en-GB-RyanNeural` |
| STT model | `electron/services/stt_server.py` | `tiny` (75MB) |
| Ollama endpoint | `electron/services/ollama.js` | `http://localhost:11434` |
| Default LLM model | `electron/main.js` | `gemma4:e4b` |
| Keep alive | `electron/services/ollama.js` | `10m` |
| Silence threshold | `src/stores/chatStore.ts` | `0.01` RMS, `1500ms` |
| Max conversation history | `electron/services/conversation.js` | 20 messages |
