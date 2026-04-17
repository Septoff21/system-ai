const { LLMProvider } = require('./provider');

class AnthropicProvider extends LLMProvider {
  constructor({ apiKey, defaultModel = 'claude-sonnet-4-6' } = {}) {
    super({ apiKey, defaultModel });
  }

  async chatStream({ messages, system, model }, onChunk) {
    const { apiKey, defaultModel } = this.config;
    if (!apiKey) throw new Error('Anthropic API key not set');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || defaultModel,
        max_tokens: 1024,
        stream: true,
        system: system || undefined,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      throw new Error(`Anthropic ${res.status}: ${err}`);
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
        if (!trimmed || trimmed.startsWith('event:')) continue;
        if (!trimmed.startsWith('data:')) continue;

        try {
          const json = JSON.parse(trimmed.slice(5).trim());
          if (json.type === 'content_block_delta' && json.delta?.text) {
            fullResponse += json.delta.text;
            onChunk(json.delta.text);
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
      'claude-sonnet-4-6',
      'claude-opus-4-7',
      'claude-haiku-4-5-20251001',
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

module.exports = { AnthropicProvider };
