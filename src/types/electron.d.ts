export {};

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      getHardwareInfo: () => Promise<any>;
      getOllamaStatus: () => Promise<any>;
      send: (channel: string, data: any) => void;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;

      // Ollama chat
      chat: (opts: { model?: string; message: string; voiceEnabled?: boolean }) => Promise<{ response: string }>;
      listModels: () => Promise<{ running: boolean; models: Array<{ name: string; size: number }> }>;
      clearHistory: () => Promise<void>;
      onStreamChunk: (callback: (data: { content: string; done: boolean }) => void) => () => void;

      // TTS (Edge TTS via Python server)
      generateSpeech: (opts: { text: string; voice?: 'jarvis' | 'friday' }) => Promise<{ success: boolean; audio?: string; error?: string }>;
      onTtsChunk: (callback: (data: { audio?: string; done: boolean }) => void) => () => void;

      // STT (Whisper via Python server)
      sttTranscribe: (audioBytes: number[]) => Promise<{ text: string; error?: string }>;
    };
  }
}
