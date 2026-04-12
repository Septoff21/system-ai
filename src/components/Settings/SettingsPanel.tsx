import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../stores/chatStore';
import './SettingsPanel.css';

export default function SettingsPanel() {
  const { settingsOpen, toggleSettings, settings, updateSettings, availableModels, currentModel, setModel, ollamaRunning } = useChatStore();

  if (!settingsOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="settings-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={toggleSettings}
      >
        <motion.div
          className="settings-panel"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="settings-header">
            <span className="settings-title">SYSTEM CONFIGURATION</span>
            <button className="settings-close" onClick={toggleSettings}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="settings-body">
            {/* Model Selection */}
            <div className="settings-section">
              <div className="settings-section-title">MODEL</div>
              <div className="settings-row">
                <label>Provider</label>
                <div className="settings-toggle-group">
                  <button
                    className={`settings-toggle-btn ${settings.apiProvider === 'ollama' ? 'active' : ''}`}
                    onClick={() => updateSettings({ apiProvider: 'ollama' })}
                  >
                    Ollama (Local)
                  </button>
                  <button
                    className={`settings-toggle-btn ${settings.apiProvider === 'openai' ? 'active' : ''}`}
                    onClick={() => updateSettings({ apiProvider: 'openai' })}
                  >
                    OpenAI API
                  </button>
                </div>
              </div>

              {settings.apiProvider === 'ollama' ? (
                <>
                  <div className="settings-row">
                    <label>Ollama Endpoint</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.ollamaEndpoint}
                      onChange={(e) => updateSettings({ ollamaEndpoint: e.target.value })}
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div className="settings-row">
                    <label>Active Model</label>
                    <select
                      className="settings-select"
                      value={currentModel}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={!ollamaRunning}
                    >
                      {!ollamaRunning && <option>Ollama not running</option>}
                      {availableModels.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name} ({(m.size / 1e9).toFixed(1)}GB)
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="settings-row">
                    <label>API Key</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={settings.apiKey}
                      onChange={(e) => updateSettings({ apiKey: e.target.value })}
                      placeholder="sk-..."
                    />
                  </div>
                  <div className="settings-row">
                    <label>Model</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.apiModel}
                      onChange={(e) => updateSettings({ apiModel: e.target.value })}
                      placeholder="gpt-4o-mini"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Voice Settings */}
            <div className="settings-section">
              <div className="settings-section-title">VOICE</div>
              <div className="settings-row">
                <label>TTS Engine</label>
                <div className="settings-toggle-group">
                  <button
                    className={`settings-toggle-btn ${settings.ttsEngine === 'edge' ? 'active' : ''}`}
                    onClick={() => updateSettings({ ttsEngine: 'edge' })}
                  >
                    Edge TTS
                  </button>
                  <button
                    className={`settings-toggle-btn ${settings.ttsEngine === 'fish' ? 'active' : ''}`}
                    onClick={() => updateSettings({ ttsEngine: 'fish' })}
                  >
                    Fish Speech
                  </button>
                </div>
              </div>
              <div className="settings-row">
                <label>Persona</label>
                <div className="settings-toggle-group">
                  <button
                    className={`settings-toggle-btn ${settings.voice === 'jarvis' ? 'active' : ''}`}
                    onClick={() => updateSettings({ voice: 'jarvis' })}
                  >
                    J.A.R.V.I.S.
                  </button>
                  <button
                    className={`settings-toggle-btn ${settings.voice === 'friday' ? 'active' : ''}`}
                    onClick={() => updateSettings({ voice: 'friday' })}
                  >
                    F.R.I.D.A.Y.
                  </button>
                </div>
              </div>
              <div className="settings-row">
                <label>Rate ({settings.voiceRate > 0 ? '+' : ''}{settings.voiceRate}%)</label>
                <input
                  type="range"
                  className="settings-range"
                  min="-50"
                  max="50"
                  value={settings.voiceRate}
                  onChange={(e) => updateSettings({ voiceRate: parseInt(e.target.value) })}
                />
              </div>
              <div className="settings-row">
                <label>Pitch ({settings.voicePitch > 0 ? '+' : ''}{settings.voicePitch})</label>
                <input
                  type="range"
                  className="settings-range"
                  min="-50"
                  max="50"
                  value={settings.voicePitch}
                  onChange={(e) => updateSettings({ voicePitch: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Microphone */}
            <div className="settings-section">
              <div className="settings-section-title">MICROPHONE</div>
              <div className="settings-row">
                <label>Always Listening</label>
                <button
                  className={`settings-switch ${settings.micAlwaysOn ? 'active' : ''}`}
                  onClick={() => updateSettings({ micAlwaysOn: !settings.micAlwaysOn })}
                >
                  <span className="settings-switch-knob" />
                </button>
              </div>
              <div className="settings-row">
                <label>Silence Timeout ({(settings.silenceMs / 1000).toFixed(1)}s)</label>
                <input
                  type="range"
                  className="settings-range"
                  min="500"
                  max="3000"
                  step="100"
                  value={settings.silenceMs}
                  onChange={(e) => updateSettings({ silenceMs: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="settings-footer">
            <span className="settings-version">System AI v0.2.0</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
