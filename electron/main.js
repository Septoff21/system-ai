const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, session } = require('electron');
const path = require('path');
const { checkStatus, chatStream } = require('./services/ollama');
const { ConversationManager } = require('./services/conversation');
const { generateSpeech, startServer: startTtsServer, shutdown: shutdownTts } = require('./services/tts');
const { transcribe, startServer: startSttServer, shutdown: shutdownStt } = require('./services/stt');
const fileops = require('./services/fileops');

let mainWindow = null;
let tray = null;
const isDev = !app.isPackaged;

// Conversation state
const conversation = new ConversationManager();
let currentModel = 'gemma4:e4b';

// Clean AI response text for TTS — strip anything that would sound terrible spoken aloud
function cleanForSpeech(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')           // code blocks
    .replace(/`([^`]+)`/g, '$1')              // inline code
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // bold/italic
    .replace(/#{1,6}\s*/g, '')                // headers
    .replace(/>\s*/g, '')                     // blockquotes
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text only
    .replace(/[-*_]{3,}/g, '')                // horizontal rules
    .replace(/\([^)]*\)/g, '')                // parenthetical asides
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '') // all emoji
    .replace(/[:;]-?[)(DPpOo/\\|><3*]/g, '') // emoticons like :), ;), :D, :P
    .replace(/[/*@#>\[\](){}|\\~^_<>]+/g, '') // stray special chars
    .replace(/\s+/g, ' ')
    .trim();
}

function createWindow() {
  const iconPath = path.join(__dirname, '../build/icon.ico');
  const hasIcon = require('fs').existsSync(iconPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    transparent: true,
    frame: false,
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 },
    ...(hasIcon && { icon: iconPath }),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Grant microphone permission for Web Speech API
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true); // Allow microphone access
    } else {
      callback(false);
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../build/icon.ico');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show System', click: () => mainWindow?.show() },
    { label: 'Hide', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setToolTip('System AI Assistant');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow?.show());
}

// ─── IPC Handlers ──────────────────────────────────────
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.hide());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());

// Hardware detection
ipcMain.handle('system:getHardwareInfo', async () => {
  try {
    const si = require('systeminformation');
    const [cpu, mem, graphics, osInfo] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.graphics(),
      si.osInfo(),
    ]);
    return {
      cpu: {
        brand: cpu.brand,
        manufacturer: cpu.manufacturer,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed,
      },
      memory: { total: mem.total, free: mem.free, used: mem.used },
      gpu: graphics.controllers.map((g) => ({
        model: g.model, vendor: g.vendor, vram: g.vram, driver: g.driverVersion,
      })),
      os: { platform: osInfo.platform, distro: osInfo.distro, arch: osInfo.arch },
    };
  } catch (err) {
    return { error: err.message };
  }
});

// Ollama status check
ipcMain.handle('ollama:status', async () => {
  return checkStatus();
});

// Ollama chat — streaming display + full-text TTS
ipcMain.handle('ollama:chat', async (event, { model, message, voiceEnabled, voice, ttsEngine, voiceRate, voicePitch }) => {
  conversation.addUserMessage(message);

  let fullResponse = '';

  try {
    fullResponse = await chatStream(
      {
        model: model || currentModel,
        messages: conversation.getMessages(),
        system: conversation.systemPrompt,
      },
      (delta) => {
        event.sender.send('ollama:stream', { content: delta, done: false });
      }
    );
  } catch (err) {
    event.sender.send('ollama:stream', {
      content: `\n[Error: ${err.message}]`,
      done: true,
    });
    event.sender.send('tts:chunk', { done: true });
    return { response: err.message };
  }

  conversation.addAssistantMessage(fullResponse);
  event.sender.send('ollama:stream', { content: '', done: true });

  // Generate TTS
  if (voiceEnabled !== false && fullResponse.trim()) {
    try {
      const cleaned = cleanForSpeech(fullResponse.trim());
      if (cleaned) {
        const audio = await generateSpeech(cleaned, voice || 'jarvis');
        mainWindow?.webContents.send('tts:chunk', {
          audio: audio.toString('base64'),
          done: false,
        });
      }
    } catch (err) {
      console.error('[TTS] Error:', err.message);
    }
  }

  mainWindow?.webContents.send('tts:chunk', { done: true });

  return { response: fullResponse };
});

// List available models
ipcMain.handle('ollama:listModels', async () => {
  return checkStatus();
});

// Clear conversation history
ipcMain.handle('ollama:clearHistory', async () => {
  conversation.clear();
  return { success: true };
});

// TTS: Generate speech (standalone, not streaming)
ipcMain.handle('tts:generate', async (_event, { text, voice }) => {
  try {
    const buffer = await generateSpeech(text, voice || 'jarvis');
    return { success: true, audio: buffer.toString('base64') };
  } catch (err) {
    console.error('[TTS]', err.message);
    return { success: false, error: err.message };
  }
});

// STT: Transcribe audio to text
ipcMain.handle('stt:transcribe', async (_event, audioBytes) => {
  try {
    const buffer = Buffer.from(audioBytes);
    const result = await transcribe(buffer);
    return result;
  } catch (err) {
    console.error('[STT]', err.message);
    return { text: '', error: err.message };
  }
});

// File operations
ipcMain.handle('file:read', async (_event, filePath) => fileops.readFile(filePath));
ipcMain.handle('file:write', async (_event, { path: filePath, content }) => fileops.writeFile(filePath, content));
ipcMain.handle('file:list', async (_event, { path: dirPath, maxDepth }) => fileops.listFiles(dirPath, maxDepth));
ipcMain.handle('file:openDialog', async () => fileops.openFileDialog(mainWindow));
ipcMain.handle('file:saveDialog', async (_event, { content, defaultName }) => fileops.saveFileDialog(mainWindow, content, defaultName));

// ─── App Lifecycle ─────────────────────────────────────
app.whenReady().then(async () => {
  // Start Python TTS server
  try {
    const port = await startTtsServer();
    console.log(`[TTS] Server ready on port ${port}`);
  } catch (err) {
    console.error('[TTS] Failed to start server:', err.message);
  }

  // Start Python STT server (background, don't block startup)
  startSttServer().then((port) => {
    console.log(`[STT] Server ready on port ${port}`);
  }).catch((err) => {
    console.error('[STT] Failed to start server:', err.message);
  });

  createWindow();
  createTray();

  globalShortcut.register('Alt+J', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  shutdownTts();
  shutdownStt();
});
