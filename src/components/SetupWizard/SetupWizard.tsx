import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProviderId } from '../../stores/chatStore';
import './SetupWizard.css';

// ── Types ──────────────────────────────────────────────
type WizardStep = 'welcome' | 'mode' | 'local-setup' | 'api-setup' | 'model' | 'persona' | 'profile' | 'pulling' | 'done';
type SetupMode = 'local' | 'api';

interface HardwareInfo {
  cpuBrand: string;
  cores: number;
  ramTotalGB: number;
  ramFreeGB: number;
  gpuModel: string;
  gpuVram: number; // MB
}

interface DepStatus {
  ollama: { installed: boolean; running: boolean; endpoint: string };
  python: { installed: boolean; path: string };
  edgeTts: { installed: boolean };
  fasterWhisper: { installed: boolean };
  hardware: HardwareInfo | null;
  models: Array<{ name: string; size: number }>;
}

interface SetupWizardProps {
  onComplete: () => void;
}

// ── Model recommendations ──────────────────────────────
const MODELS = [
  { name: 'gemma3:1b',   size: 0.8, minRam: 4,  label: 'Lite',   desc: 'Very fast, basic' },
  { name: 'llama3.2:3b', size: 2,   minRam: 4,  label: 'Fast',   desc: 'Good balance' },
  { name: 'gemma3:4b',   size: 2.5, minRam: 6,  label: 'Smart',  desc: 'Recommended' },
  { name: 'gemma4:e4b',  size: 5,   minRam: 8,  label: 'Better', desc: 'Higher quality' },
  { name: 'gemma4:12b',  size: 8,   minRam: 16, label: 'Great',  desc: 'Needs 16GB+' },
  { name: 'gemma4:26b',  size: 16,  minRam: 32, label: 'Best',   desc: 'Needs 32GB+' },
];

const API_PROVIDERS = [
  { id: 'groq'      as ProviderId, label: 'Groq',             free: true,  placeholder: 'gsk_...',    hint: 'console.groq.com — Free',          defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'openrouter'as ProviderId, label: 'OpenRouter',       free: true,  placeholder: 'sk-or-...',  hint: 'openrouter.ai — Free models',       defaultModel: 'meta-llama/llama-3.3-70b-instruct:free' },
  { id: 'gemini'    as ProviderId, label: 'Google Gemini',    free: false, placeholder: 'AIza...',    hint: 'aistudio.google.com — Free tier',   defaultModel: 'gemini-2.0-flash' },
  { id: 'anthropic' as ProviderId, label: 'Claude',           free: false, placeholder: 'sk-ant-...', hint: 'console.anthropic.com',             defaultModel: 'claude-sonnet-4-6' },
  { id: 'openai'    as ProviderId, label: 'OpenAI',           free: false, placeholder: 'sk-...',     hint: 'platform.openai.com',               defaultModel: 'gpt-4o-mini' },
];

// ── Helpers ────────────────────────────────────────────
function formatVram(mb: number, gpuModel: string): string {
  const rounded = Math.round(mb);
  const gb = (rounded / 1024).toFixed(1);
  const isIntegrated = /UHD|Iris|Vega|Radeon Graphics|Intel/i.test(gpuModel);
  const label = isIntegrated ? ' (Shared)' : '';
  return rounded >= 1024 ? `${gb} GB${label}` : `${rounded} MB${label}`;
}

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
};

// ── Component ──────────────────────────────────────────
export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const api = (window as any).electronAPI;

  const [step, setStep]           = useState<WizardStep>('welcome');
  const [mode, setMode]           = useState<SetupMode>('api');
  const [deps, setDeps]           = useState<DepStatus | null>(null);
  const [persona, setPersona]     = useState<'jarvis' | 'friday'>('jarvis');
  const [userName, setUserName]   = useState('');
  const [userLocation, setUserLocation] = useState('');

  // Local mode state
  const [selectedModel, setSelectedModel] = useState('');
  const [customModel, setCustomModel]     = useState('');
  const [pullPercent, setPullPercent]     = useState(0);
  const [pullStatus, setPullStatus]       = useState('');
  const [pullError, setPullError]         = useState('');

  // Install state
  const [installing, setInstalling]       = useState(false);
  const [installDone, setInstallDone]     = useState(false);
  const [installLog, setInstallLog]       = useState('');
  const [localDepsOk, setLocalDepsOk]     = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // API mode state
  const [apiKeys, setApiKeys]             = useState<Partial<Record<ProviderId, string>>>({});
  const [keyStatus, setKeyStatus]         = useState<Partial<Record<ProviderId, 'idle'|'testing'|'ok'|'error'>>>({});
  const [savedKeys, setSavedKeys]         = useState<Partial<Record<ProviderId, boolean>>>({});

  // Load deps on mount
  useEffect(() => {
    api?.checkDependencies().then((result: DepStatus) => {
      setDeps(result);
      setLocalDepsOk(result.ollama.running && result.edgeTts.installed && result.fasterWhisper.installed);
      if (result.hardware) {
        const ram = result.hardware.ramTotalGB;
        const rec = [...MODELS].reverse().find((m) => ram >= m.minRam);
        if (rec) setSelectedModel(rec.name);
      }
    });
    api?.keystoreGetAll().then((has: Record<string, boolean>) => setSavedKeys(has));
  }, []);

  // Pull progress listener
  useEffect(() => {
    return api?.onPullProgress((data: { percent: number; status: string }) => {
      setPullPercent(data.percent);
      setPullStatus(data.status);
    });
  }, []);

  // Install output listener
  useEffect(() => {
    return api?.onInstallOutput((text: string) => {
      setInstallLog((prev) => prev + text);
      setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 10);
    });
  }, []);

  // ── Actions ──────────────────────────────────────────
  const handleInstallDeps = useCallback(async () => {
    setInstalling(true);
    setInstallLog('');
    setInstallDone(false);
    const result = await api?.installDeps();
    setInstalling(false);
    setInstallDone(true);
    if (result?.success) {
      const recheck = await api?.recheckDeps();
      setLocalDepsOk(recheck?.edgeTts && recheck?.fasterWhisper);
      setDeps((prev) => prev ? {
        ...prev,
        edgeTts: { installed: recheck?.edgeTts },
        fasterWhisper: { installed: recheck?.fasterWhisper },
        ollama: { ...prev.ollama, running: recheck?.ollama ?? prev.ollama.running },
      } : prev);
    }
  }, [api]);

  const handleSaveKey = useCallback(async (providerId: ProviderId) => {
    const key = apiKeys[providerId] || '';
    if (!key) return;
    await api?.keystoreSet({ provider: providerId, key });
    setSavedKeys((prev) => ({ ...prev, [providerId]: true }));
    setApiKeys((prev) => ({ ...prev, [providerId]: '' }));
    api?.llmSetProvider({ provider: providerId });
  }, [apiKeys]);

  const handleTestKey = useCallback(async (providerId: ProviderId) => {
    setKeyStatus((prev) => ({ ...prev, [providerId]: 'testing' }));
    const result = await api?.llmTestProvider(providerId);
    setKeyStatus((prev) => ({ ...prev, [providerId]: result?.ok ? 'ok' : 'error' }));
    setTimeout(() => setKeyStatus((prev) => ({ ...prev, [providerId]: 'idle' })), 3000);
  }, []);

  const handlePull = useCallback(async () => {
    const model = customModel.trim() || selectedModel;
    if (!model) return;
    setStep('pulling');
    setPullPercent(0);
    setPullError('');
    const result = await api?.pullModel(model);
    if (!result?.success) setPullError(result?.error || 'Failed');
  }, [customModel, selectedModel]);

  const handleFinish = useCallback(async () => {
    const savedCount = Object.values(savedKeys).filter(Boolean).length;
    // Set first saved API provider as active
    if (mode === 'api' && savedCount > 0) {
      const firstProvider = API_PROVIDERS.find((p) => savedKeys[p.id]);
      if (firstProvider) api?.llmSetProvider({ provider: firstProvider.id, model: firstProvider.defaultModel });
    }

    if (userName || userLocation) {
      const md = `# User Profile\n- Name: ${userName || 'sir'}\n${userLocation ? `- Location: ${userLocation}\n` : ''}- Language: English (conversational)\n\n## Preferences\n- Prefers concise, direct answers\n- Likes the ${persona === 'jarvis' ? 'Jarvis' : 'Friday'} persona\n`;
      await api?.writeUserMd(md);
    }

    localStorage.setItem('system-ai-setup-complete', 'true');
    localStorage.setItem('system-ai-settings', JSON.stringify({
      voice: persona,
      activeProvider: mode === 'api' ? (API_PROVIDERS.find((p) => savedKeys[p.id])?.id || 'groq') : 'ollama',
    }));
    onComplete();
  }, [savedKeys, mode, userName, userLocation, persona]);

  const hasAnyApiKey = Object.values(savedKeys).some(Boolean);
  const recommendedModel = deps?.hardware
    ? [...MODELS].reverse().find((m) => deps.hardware!.ramTotalGB >= m.minRam)
    : null;
  const stepList: WizardStep[] = ['welcome', 'mode', mode === 'local' ? 'local-setup' : 'api-setup', 'persona', 'profile'];
  const stepIdx = stepList.indexOf(step);

  return (
    <motion.div className="wizard-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="wizard-container">
        {/* Header */}
        <div className="wizard-header">
          <div className="wizard-logo font-display">SYSTEM AI</div>
          <div className="wizard-subtitle">First-Run Setup / 首次安装向导</div>
          <button className="wizard-skip" onClick={() => { localStorage.setItem('system-ai-setup-complete', 'true'); onComplete(); }}>
            Skip / 跳过
          </button>
        </div>

        {/* Progress dots */}
        <div className="wizard-steps">
          {stepList.map((s, i) => (
            <div key={s} className={`wizard-step-dot ${step === s ? 'active' : i < stepIdx ? 'done' : ''}`} />
          ))}
        </div>

        <div className="wizard-content">
          <AnimatePresence mode="wait">

            {/* ── Welcome ──────────────────────────────── */}
            {step === 'welcome' && (
              <motion.div key="welcome" {...slide} transition={{ duration: 0.35 }}>
                <h2 className="wizard-title">Welcome to System AI</h2>
                <p className="wizard-desc">Your personal Jarvis — real-time voice AI that lives on your desktop.</p>
                <div className="wizard-feature-grid">
                  {[
                    { icon: '🎙', text: 'Real-time voice conversation' },
                    { icon: '🤖', text: 'Runs local or via API' },
                    { icon: '🖥', text: 'Controls your computer' },
                    { icon: '⚡', text: 'Instant responses' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="wizard-feature-card">
                      <span className="wizard-feature-icon">{icon}</span>
                      <span className="wizard-feature-text">{text}</span>
                    </div>
                  ))}
                </div>
                <div className="wizard-actions">
                  <button className="wizard-btn wizard-btn--primary" onClick={() => setStep('mode')}>Get Started →</button>
                </div>
              </motion.div>
            )}

            {/* ── Mode Selection ────────────────────────── */}
            {step === 'mode' && (
              <motion.div key="mode" {...slide} transition={{ duration: 0.35 }}>
                <h2 className="wizard-title">How do you want to run it?</h2>
                <p className="wizard-desc">Choose your intelligence source. You can change this later in Settings.</p>

                <div className="wizard-mode-grid">
                  <button
                    className={`wizard-mode-card ${mode === 'api' ? 'selected' : ''}`}
                    onClick={() => setMode('api')}
                  >
                    <div className="wizard-mode-icon">⚡</div>
                    <div className="wizard-mode-name">Cloud API</div>
                    <div className="wizard-mode-sub">Recommended</div>
                    <ul className="wizard-mode-features">
                      <li>✓ Free options (Groq, OpenRouter)</li>
                      <li>✓ No GPU needed</li>
                      <li>✓ Fastest responses</li>
                      <li>✓ Works on any computer</li>
                    </ul>
                    <div className="wizard-mode-note">Needs internet</div>
                  </button>

                  <button
                    className={`wizard-mode-card ${mode === 'local' ? 'selected' : ''}`}
                    onClick={() => setMode('local')}
                  >
                    <div className="wizard-mode-icon">🔒</div>
                    <div className="wizard-mode-name">Local (Ollama)</div>
                    <div className="wizard-mode-sub">Private</div>
                    <ul className="wizard-mode-features">
                      <li>✓ 100% offline</li>
                      <li>✓ Full privacy</li>
                      <li>✗ Needs 8GB+ RAM</li>
                      <li>✗ Slower on low-end hardware</li>
                    </ul>
                    <div className="wizard-mode-note">Recommended: 16GB+ RAM</div>
                  </button>
                </div>

                <div className="wizard-actions">
                  <button className="wizard-btn wizard-btn--secondary" onClick={() => setStep('welcome')}>Back</button>
                  <button className="wizard-btn wizard-btn--primary" onClick={() => setStep(mode === 'local' ? 'local-setup' : 'api-setup')}>
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Local Setup ───────────────────────────── */}
            {step === 'local-setup' && (
              <motion.div key="local-setup" {...slide} transition={{ duration: 0.35 }}>
                <h2 className="wizard-title">Local Environment Setup</h2>

                {!deps ? (
                  <div className="wizard-loading"><div className="wizard-spinner" /><span>Scanning...</span></div>
                ) : (
                  <>
                    {/* Hardware */}
                    {deps.hardware && (
                      <div className="wizard-hw-box">
                        <div className="wizard-hw-title">Your Hardware</div>
                        <div className="wizard-hw-grid">
                          <HwItem label="CPU" value={deps.hardware.cpuBrand} />
                          <HwItem label="Cores" value={String(deps.hardware.cores)} />
                          <HwItem label="RAM" value={`${deps.hardware.ramTotalGB} GB`} />
                          <HwItem label="GPU" value={deps.hardware.gpuModel} />
                          <HwItem label="VRAM" value={formatVram(deps.hardware.gpuVram, deps.hardware.gpuModel)} />
                        </div>
                      </div>
                    )}

                    {/* Deps list */}
                    <div className="wizard-dep-list">
                      <DepRow name="Ollama" ok={deps.ollama.running} note={
                        deps.ollama.running ? 'Running' :
                        deps.ollama.installed ? 'Installed — run ollama serve' : 'Not installed'
                      } action={!deps.ollama.installed ? (
                        <button className="wizard-dep-btn" onClick={() => api?.openUrl('https://ollama.ai')}>
                          Download ↗
                        </button>
                      ) : null} />

                      <DepRow name="Python" ok={deps.python.installed} note={deps.python.installed ? deps.python.path.split('\\').slice(-3).join('\\') : 'Not found'} />

                      <DepRow name="edge-tts + faster-whisper" ok={deps.edgeTts.installed && deps.fasterWhisper.installed}
                        note={deps.edgeTts.installed && deps.fasterWhisper.installed ? 'Installed' : 'Required for voice'}
                        action={!(deps.edgeTts.installed && deps.fasterWhisper.installed) && deps.python.installed ? (
                          <button className="wizard-dep-btn" onClick={handleInstallDeps} disabled={installing}>
                            {installing ? 'Installing…' : 'Install'}
                          </button>
                        ) : null}
                      />
                    </div>

                    {/* Install log */}
                    {(installing || installLog) && (
                      <div className="wizard-terminal" ref={logRef}>
                        <div className="wizard-terminal-bar">
                          <span className="wizard-terminal-dot red" /><span className="wizard-terminal-dot yellow" /><span className="wizard-terminal-dot green" />
                          <span className="wizard-terminal-title">pip install</span>
                        </div>
                        <pre className="wizard-terminal-log">{installLog}{installing && <span className="wizard-cursor">▌</span>}</pre>
                      </div>
                    )}

                    {installDone && localDepsOk && (
                      <div className="wizard-success-banner">✓ All dependencies installed successfully</div>
                    )}

                    {/* Model selection */}
                    {deps.ollama.running && (
                      <div className="wizard-model-quick">
                        <div className="wizard-section-label">Select Model</div>
                        <div className="wizard-model-grid wizard-model-grid--compact">
                          {MODELS.map((m) => {
                            const tooHeavy = deps.hardware ? m.minRam > deps.hardware.ramTotalGB : false;
                            const isInstalled = deps.models.some((dm) => dm.name === m.name);
                            return (
                              <button
                                key={m.name}
                                className={`wizard-model-card ${selectedModel === m.name ? 'selected' : ''} ${tooHeavy ? 'disabled' : ''}`}
                                onClick={() => !tooHeavy && setSelectedModel(m.name)}
                                disabled={tooHeavy}
                              >
                                <div className="wizard-model-label">{m.label}</div>
                                <div className="wizard-model-name">{m.name}</div>
                                <div className="wizard-model-meta">{m.size}GB • {m.minRam}GB+ RAM</div>
                                {isInstalled && <div className="wizard-model-badge">✓ Installed</div>}
                                {m.name === recommendedModel?.name && !isInstalled && <div className="wizard-model-badge rec">★ Recommended</div>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="wizard-actions">
                  <button className="wizard-btn wizard-btn--secondary" onClick={() => setStep('mode')}>Back</button>
                  <button
                    className="wizard-btn wizard-btn--primary"
                    onClick={() => {
                      if (deps?.ollama.running && selectedModel) {
                        const isInstalled = deps.models.some((dm) => dm.name === selectedModel);
                        if (!isInstalled) { handlePull(); } else { setStep('persona'); }
                      } else {
                        setStep('persona');
                      }
                    }}
                  >
                    {deps?.ollama.running && selectedModel ? 'Next →' : 'Skip →'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Pulling Model ────────────────────────── */}
            {step === 'pulling' && (
              <motion.div key="pulling" {...slide} transition={{ duration: 0.35 }}>
                <h2 className="wizard-title">Downloading Model</h2>
                <div className="wizard-pull-model">{customModel.trim() || selectedModel}</div>
                <div className="wizard-progress-track">
                  <motion.div className="wizard-progress-fill" animate={{ width: `${pullPercent}%` }} transition={{ duration: 0.3 }} />
                </div>
                <div className="wizard-progress-meta">
                  <span>{pullPercent}%</span>
                  <span className="wizard-progress-status">{pullStatus}</span>
                </div>
                {pullError && <div className="wizard-error">{pullError}</div>}
                {pullPercent === 100 && !pullError && (
                  <div className="wizard-actions">
                    <button className="wizard-btn wizard-btn--primary" onClick={() => setStep('persona')}>Next →</button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── API Setup ─────────────────────────────── */}
            {step === 'api-setup' && (
              <motion.div key="api-setup" {...slide} transition={{ duration: 0.35 }}>
                <h2 className="wizard-title">Connect Your AI</h2>
                <p className="wizard-desc">Add at least one API key. Start with Groq — it's free and fastest.</p>

                <div className="wizard-api-list">
                  {API_PROVIDERS.map((p) => {
                    const status = keyStatus[p.id] || 'idle';
                    const hasSaved = savedKeys[p.id];
                    return (
                      <div key={p.id} className={`wizard-api-row ${hasSaved ? 'saved' : ''}`}>
                        <div className="wizard-api-info">
                          <div className="wizard-api-name">
                            {p.label}
                            {p.free && <span className="wizard-api-badge-free">FREE</span>}
                            {hasSaved && <span className="wizard-api-badge-ok">✓</span>}
                          </div>
                          <div className="wizard-api-hint" onClick={() => api?.openUrl(`https://${p.hint.split(' ')[0]}`)}>{p.hint}</div>
                        </div>
                        <div className="wizard-api-input-row">
                          <input
                            type="password"
                            className="wizard-api-input"
                            value={apiKeys[p.id] || ''}
                            onChange={(e) => setApiKeys((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder={hasSaved ? '••••••••  (saved)' : p.placeholder}
                          />
                          <button
                            className="wizard-api-btn"
                            onClick={() => handleSaveKey(p.id)}
                            disabled={!apiKeys[p.id]}
                          >Save</button>
                          <button
                            className={`wizard-api-btn wizard-api-btn--test ${status}`}
                            onClick={() => handleTestKey(p.id)}
                            disabled={status === 'testing' || !hasSaved}
                          >
                            {status === 'testing' ? '…' : status === 'ok' ? '✓' : status === 'error' ? '✗' : 'Test'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!hasAnyApiKey && (
                  <div className="wizard-tip">
                    💡 Tip: Groq is 100% free, no credit card needed. Takes 30 seconds to get a key.
                  </div>
                )}

                <div className="wizard-actions">
                  <button className="wizard-btn wizard-btn--secondary" onClick={() => setStep('mode')}>Back</button>
                  <button
                    className="wizard-btn wizard-btn--primary"
                    onClick={() => setStep('persona')}
                    disabled={!hasAnyApiKey}
                  >
                    {hasAnyApiKey ? 'Next →' : 'Add at least one key'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Persona ──────────────────────────────── */}
            {step === 'persona' && (
              <motion.div key="persona" {...slide} transition={{ duration: 0.35 }}>
                <h2 className="wizard-title">Choose Your Persona</h2>
                <p className="wizard-desc">Your AI's personality and voice.</p>
                <div className="wizard-persona-grid">
                  {[
                    { id: 'jarvis' as const, name: 'J.A.R.V.I.S.', icon: 'J', voice: 'British male voice', desc: 'Calm, dry wit — calls you "sir"' },
                    { id: 'friday' as const, name: 'F.R.I.D.A.Y.',  icon: 'F', voice: 'American female voice', desc: 'Warm, direct, efficient' },
                  ].map((p) => (
                    <button key={p.id} className={`wizard-persona-card ${persona === p.id ? 'selected' : ''}`} onClick={() => setPersona(p.id)}>
                      <div className="wizard-persona-icon">{p.icon}</div>
                      <div className="wizard-persona-name">{p.name}</div>
                      <div className="wizard-persona-voice">{p.voice}</div>
                      <div className="wizard-persona-desc">{p.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="wizard-actions">
                  <button className="wizard-btn wizard-btn--secondary" onClick={() => setStep(mode === 'local' ? 'local-setup' : 'api-setup')}>Back</button>
                  <button className="wizard-btn wizard-btn--primary" onClick={() => setStep('profile')}>Next →</button>
                </div>
              </motion.div>
            )}

            {/* ── Profile ──────────────────────────────── */}
            {step === 'profile' && (
              <motion.div key="profile" {...slide} transition={{ duration: 0.35 }}>
                <h2 className="wizard-title">Your Profile</h2>
                <p className="wizard-desc">Stored locally in <code>user.md</code>. The AI uses this to personalize responses.</p>
                <div className="wizard-form">
                  <div className="wizard-form-row">
                    <label>Name</label>
                    <input type="text" className="wizard-input" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="sir, boss, or your name" />
                  </div>
                  <div className="wizard-form-row">
                    <label>Location</label>
                    <input type="text" className="wizard-input" value={userLocation} onChange={(e) => setUserLocation(e.target.value)} placeholder="e.g. Kuala Lumpur, Malaysia" />
                  </div>
                </div>
                <div className="wizard-summary">
                  <SummaryRow label="Mode" value={mode === 'local' ? 'Local (Ollama)' : `Cloud API (${Object.values(savedKeys).filter(Boolean).length} key${Object.values(savedKeys).filter(Boolean).length !== 1 ? 's' : ''})`} />
                  {mode === 'local' && <SummaryRow label="Model" value={customModel.trim() || selectedModel || '—'} />}
                  <SummaryRow label="Persona" value={persona === 'jarvis' ? 'J.A.R.V.I.S.' : 'F.R.I.D.A.Y.'} />
                  <SummaryRow label="Name" value={userName || 'sir'} />
                </div>
                <div className="wizard-actions">
                  <button className="wizard-btn wizard-btn--secondary" onClick={() => setStep('persona')}>Back</button>
                  <button className="wizard-btn wizard-btn--primary" onClick={handleFinish}>Launch System AI ⟶</button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Sub-components ─────────────────────────────────────
function HwItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="wizard-hw-item">
      <span className="wizard-hw-label">{label}</span>
      <span className="wizard-hw-value">{value}</span>
    </div>
  );
}

function DepRow({ name, ok, note, action }: { name: string; ok: boolean; note: string; action?: React.ReactNode }) {
  return (
    <div className={`wizard-dep-row ${ok ? 'wizard-dep-row--ok' : 'wizard-dep-row--fail'}`}>
      <span className="wizard-dep-icon">{ok ? '✓' : '✗'}</span>
      <span className="wizard-dep-name">{name}</span>
      <span className="wizard-dep-note">{note}</span>
      {action && <div className="wizard-dep-action">{action}</div>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="wizard-summary-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
