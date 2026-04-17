const { OpenAICompatProvider } = require('./openai-compat');

class OpenRouterProvider extends OpenAICompatProvider {
  constructor({ apiKey } = {}) {
    super({
      apiKey,
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
      extraHeaders: {
        'HTTP-Referer': 'https://github.com/Septoff21/system-ai',
        'X-Title': 'System AI',
      },
    });
  }

  async listModels() {
    // Curated free models on OpenRouter
    return [
      'meta-llama/llama-3.3-70b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemma-3-27b-it:free',
      'mistralai/mistral-7b-instruct:free',
      'deepseek/deepseek-r1:free',
    ];
  }
}

module.exports = { OpenRouterProvider };
