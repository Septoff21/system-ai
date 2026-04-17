class LLMProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Stream a chat completion.
   * @param {object} opts
   * @param {Array<{role,content}>} opts.messages
   * @param {string} opts.system
   * @param {string} opts.model
   * @param {function} onChunk - called with each text delta
   * @returns {Promise<string>} full assembled response
   */
  async chatStream({ messages, system, model }, onChunk) {
    throw new Error(`${this.constructor.name}.chatStream() not implemented`);
  }

  /** @returns {Promise<string[]>} list of available model IDs */
  async listModels() {
    return [];
  }

  /** @returns {Promise<{ok: boolean, error?: string}>} */
  async test() {
    return { ok: false, error: 'not implemented' };
  }
}

module.exports = { LLMProvider };
