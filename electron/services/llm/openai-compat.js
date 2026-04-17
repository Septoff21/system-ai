const { LLMProvider } = require('./provider');

/**
 * OpenAI-compatible streaming provider.
 * Used directly for OpenAI, and extended by Groq / OpenRouter / Together / etc.
 */
class OpenAICompatProvider extends LLMProvider {
  constructor({ apiKey, baseUrl = 'https://api.openai.com/v1', defaultModel = 'gpt-4o-mini', extraHeaders = {} } = {}) {
    super({ apiKey, baseUrl, defaultModel, extraHeaders });
  }

  async chatStream({ messages, system, model }, onChunk) {
    const { apiKey, baseUrl, defaultModel, extraHeaders } = this.config;
    if (!apiKey) throw new Error('API key not set');

    const body = {
      model: model || defaultModel,
      stream: true,
      messages: system
        ? [{ role: 'system', content: system }, ...messages]
        : messages,
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`${res.status}: ${err}`);
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
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullResponse += delta;
            onChunk(delta);
          }
        } catch {
          // skip malformed
        }
      }
    }

    return fullResponse;
  }

  async listModels() {
    const { apiKey, baseUrl } = this.config;
    if (!apiKey) return [];
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).map((m) => m.id).sort();
    } catch {
      return [];
    }
  }

  async test() {
    const { apiKey, baseUrl, defaultModel } = this.config;
    if (!apiKey) return { ok: false, error: 'No API key' };
    try {
      let full = '';
      await this.chatStream(
        { messages: [{ role: 'user', content: 'Reply with just: ok' }], model: defaultModel },
        (d) => { full += d; }
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
}

module.exports = { OpenAICompatProvider };
