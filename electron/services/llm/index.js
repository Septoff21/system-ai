const { OllamaProvider } = require('./ollama');
const { OpenAICompatProvider } = require('./openai-compat');
const { GroqProvider } = require('./groq');
const { AnthropicProvider } = require('./anthropic');
const { GeminiProvider } = require('./gemini');
const { OpenRouterProvider } = require('./openrouter');

// Provider metadata for the UI
const PROVIDER_META = {
  ollama:     { label: 'Ollama (Local)',    free: true,  needsKey: false, defaultModel: 'gemma3:4b' },
  groq:       { label: 'Groq (Free)',       free: true,  needsKey: true,  defaultModel: 'llama-3.3-70b-versatile' },
  openrouter: { label: 'OpenRouter (Free)', free: true,  needsKey: true,  defaultModel: 'meta-llama/llama-3.3-70b-instruct:free' },
  gemini:     { label: 'Google Gemini',     free: false, needsKey: true,  defaultModel: 'gemini-2.0-flash' },
  openai:     { label: 'OpenAI',            free: false, needsKey: true,  defaultModel: 'gpt-4o-mini' },
  anthropic:  { label: 'Claude (Anthropic)',free: false, needsKey: true,  defaultModel: 'claude-sonnet-4-6' },
};

// Runtime state
let activeProviderId = 'ollama';
let activeModel = null;
let apiKeys = {};
let ollamaEndpoint = 'http://localhost:11434';

function buildProvider(id) {
  const key = apiKeys[id] || '';
  switch (id) {
    case 'ollama':     return new OllamaProvider({ endpoint: ollamaEndpoint });
    case 'groq':       return new GroqProvider({ apiKey: key });
    case 'openrouter': return new OpenRouterProvider({ apiKey: key });
    case 'gemini':     return new GeminiProvider({ apiKey: key });
    case 'openai':     return new OpenAICompatProvider({ apiKey: key });
    case 'anthropic':  return new AnthropicProvider({ apiKey: key });
    default:           return new OllamaProvider({ endpoint: ollamaEndpoint });
  }
}

function setProvider(id, model) {
  if (!PROVIDER_META[id]) throw new Error(`Unknown provider: ${id}`);
  activeProviderId = id;
  if (model) activeModel = model;
}

function setKey(providerId, key) {
  apiKeys[providerId] = key;
}

function setOllamaEndpoint(endpoint) {
  ollamaEndpoint = endpoint;
}

function getActiveProvider() {
  return {
    id: activeProviderId,
    model: activeModel || PROVIDER_META[activeProviderId]?.defaultModel,
    ...PROVIDER_META[activeProviderId],
  };
}

function getProviderList() {
  return Object.entries(PROVIDER_META).map(([id, meta]) => ({
    id,
    ...meta,
    hasKey: !!apiKeys[id],
  }));
}

async function chatStream({ messages, system, model }, onChunk) {
  const provider = buildProvider(activeProviderId);
  const resolvedModel = model || activeModel || PROVIDER_META[activeProviderId]?.defaultModel;

  try {
    return await provider.chatStream({ messages, system, model: resolvedModel }, onChunk);
  } catch (err) {
    // Auto-fallback to Ollama if API fails
    if (activeProviderId !== 'ollama') {
      console.warn(`[LLM] ${activeProviderId} failed, falling back to Ollama:`, err.message);
      const fallback = new OllamaProvider({ endpoint: ollamaEndpoint });
      try {
        return await fallback.chatStream({ messages, system }, onChunk);
      } catch (fallbackErr) {
        throw new Error(`Primary (${err.message}) and Ollama fallback (${fallbackErr.message}) both failed`);
      }
    }
    throw err;
  }
}

async function testProvider(id) {
  const provider = buildProvider(id);
  return provider.test();
}

async function listModels(id) {
  const provider = buildProvider(id || activeProviderId);
  return provider.listModels();
}

async function checkOllamaStatus() {
  const p = new OllamaProvider({ endpoint: ollamaEndpoint });
  return p.checkStatus();
}

module.exports = {
  setProvider,
  setKey,
  setOllamaEndpoint,
  getActiveProvider,
  getProviderList,
  chatStream,
  testProvider,
  listModels,
  checkOllamaStatus,
  PROVIDER_META,
};
