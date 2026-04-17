const { LLMProvider } = require('./provider');

class OllamaProvider extends LLMProvider {
  constructor({ endpoint = 'http://localhost:11434', defaultModel = 'gemma3:4b' } = {}) {
    super({ endpoint, defaultModel });
  }

  async chatStream({ messages, system, model }, onChunk) {
    const { endpoint, defaultModel } = this.config;

    const res = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || defaultModel,
        messages,
        system: system || undefined,
        stream: true,
        keep_alive: '10m',
      }),
    });

    if (!res.ok) throw new Error(`Ollama ${res.status}: ${res.statusText}`);

    let fullResponse = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const delta = json.message?.content;
          if (delta) {
            fullResponse += delta;
            onChunk(delta);
          }
        } catch {
          // skip
        }
      }
    }

    return fullResponse;
  }

  async listModels() {
    const { endpoint } = this.config;
    try {
      const res = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      return (data.models || []).map((m) => ({ id: m.name, size: m.size }));
    } catch {
      return [];
    }
  }

  async test() {
    const { endpoint } = this.config;
    try {
      const res = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return { ok: false, error: 'Ollama not reachable' };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async checkStatus() {
    const { endpoint } = this.config;
    try {
      const res = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      return {
        running: true,
        models: (data.models || []).map((m) => ({ name: m.name, size: m.size })),
      };
    } catch {
      return { running: false, models: [] };
    }
  }
}

module.exports = { OllamaProvider };
