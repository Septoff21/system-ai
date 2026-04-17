const { LLMProvider } = require('./provider');

class GeminiProvider extends LLMProvider {
  constructor({ apiKey, defaultModel = 'gemini-2.0-flash' } = {}) {
    super({ apiKey, defaultModel });
  }

  async chatStream({ messages, system, model }, onChunk) {
    const { apiKey, defaultModel } = this.config;
    if (!apiKey) throw new Error('Gemini API key not set');

    const modelId = model || defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}`;

    // Convert OpenAI-style messages to Gemini format
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = {
      contents,
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      generationConfig: { maxOutputTokens: 1024 },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`Gemini ${res.status}: ${err}`);
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
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        try {
          const json = JSON.parse(trimmed.slice(5).trim());
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            fullResponse += text;
            onChunk(text);
          }
        } catch {
          // skip
        }
      }
    }

    return fullResponse;
  }

  async listModels() {
    return [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ];
  }

  async test() {
    if (!this.config.apiKey) return { ok: false, error: 'No API key' };
    try {
      let full = '';
      await this.chatStream(
        { messages: [{ role: 'user', content: 'Reply with just: ok' }] },
        (d) => { full += d; }
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
}

module.exports = { GeminiProvider };
