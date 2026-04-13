export {};

interface HardwareInfo {
  cpuBrand: string;
  cores: number;
  ramTotalGB: number;
  ramFreeGB: number;
  gpuModel: string;
  gpuVram: number;
}

interface DepCheckResult {
  ollama: { installed: boolean; running: boolean; endpoint: string };
  python: { installed: boolean; path: string };
  edgeTts: { installed: boolean };
  fasterWhisper: { installed: boolean };
  hardware: HardwareInfo | null;
  models: Array<{ name: string; size: number }>;
}

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
      chat: (opts: {
        model?: string;
        message: string;
        voiceEnabled?: boolean;
        voice?: 'jarvis' | 'friday';
        ttsEngine?: 'edge' | 'fish';
        voiceRate?: number;
        voicePitch?: number;
      }) => Promise<{ response: string }>;
      listModels: () => Promise<{ running: boolean; models: Array<{ name: string; size: number }> }>;
      clearHistory: () => Promise<void>;
      onStreamChunk: (callback: (data: { content: string; done: boolean }) => void) => () => void;

      // TTS
      generateSpeech: (opts: { text: string; voice?: 'jarvis' | 'friday' }) => Promise<{ success: boolean; audio?: string; error?: string }>;
      onTtsChunk: (callback: (data: { audio?: string; done: boolean }) => void) => () => void;

      // STT
      sttTranscribe: (audioBytes: number[]) => Promise<{ text: string; error?: string }>;

      // Setup wizard
      checkDependencies: () => Promise<DepCheckResult>;
      pullModel: (modelName: string) => Promise<{ success: boolean; error?: string }>;
      onPullProgress: (callback: (data: { model: string; percent: number; status: string }) => void) => () => void;
      writeUserMd: (content: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
