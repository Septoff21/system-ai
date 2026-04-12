const { spawn } = require('child_process');

const OLLAMA_BASE = 'http://localhost:11434';

const DEFAULT_SYSTEM = `You are System, a highly sophisticated AI assistant inspired by J.A.R.V.I.S. You speak with calm confidence and precision. Be concise, helpful, and proactive. Address the user professionally.`;

/**
 * Check if Ollama API is reachable.
 */
async function checkStatus() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return {
      running: true,
      models: (data.models || []).map((m) => ({
        name: m.name,
        size: m.size,
      })),
    };
  } catch {
    return { running: false, models: [] };
  }
}

/**
 * Try to start the Ollama serve process if it's installed but not running.
 */
async function ensureRunning() {
  const status = await checkStatus();
  if (status.running) return status;

  return new Promise((resolve) => {
    const child = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore',
    });

    child.on('error', () => {
      resolve({ running: false, models: [], error: 'Ollama not installed' });
    });

    // Wait a bit for the server to start, then check again
    setTimeout(async () => {
      const newStatus = await checkStatus();
      resolve(newStatus);
    }, 3000);
  });
}

/**
 * Stream a chat completion from Ollama.
 * @param {object} opts
 * @param {string} opts.model - Model name (e.g. "gemma3:4b")
 * @param {Array<{role: string, content: string}>} opts.messages - Conversation history
 * @param {string} [opts.system] - System prompt
 * @param {function} onChunk - Called with each content delta: (text: string) => void
 * @returns {Promise<string>} Full assembled response
 */
async function chatStream({ model, messages, system }, onChunk) {
  const body = {
    model: model || 'gemma4:e4b',
    messages,
    system: system || DEFAULT_SYSTEM,
    stream: true,
    keep_alive: '10m',
  };

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
  }

  let fullResponse = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (json.message && json.message.content) {
          const delta = json.message.content;
          fullResponse += delta;
          onChunk(delta);
        }
        if (json.done) {
          return fullResponse;
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }

  return fullResponse;
}

module.exports = { checkStatus, ensureRunning, chatStream, DEFAULT_SYSTEM };
