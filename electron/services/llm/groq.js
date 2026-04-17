const { OpenAICompatProvider } = require('./openai-compat');

class GroqProvider extends OpenAICompatProvider {
  constructor({ apiKey } = {}) {
    super({
      apiKey,
      baseUrl: 'https://api.groq.com/openai/v1',
      defaultModel: 'llama-3.3-70b-versatile',
    });
  }

  async listModels() {
    // Curated free models — fast and reliable
    return [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'gemma2-9b-it',
      'mixtral-8x7b-32768',
      'llama3-70b-8192',
    ];
  }
}

module.exports = { GroqProvider };
