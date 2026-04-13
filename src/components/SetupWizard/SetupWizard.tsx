import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SetupWizard.css';

// ── Model recommendations by RAM ─────────────────────────
const MODEL_RECOMMENDATIONS = [
  { name: 'gemma3:1b', size: 0.8, minRam: 4, label: 'Lightweight', desc: 'Fast responses, basic capability' },
  { name: 'llama3.2:3b', size: 2, minRam: 4, label: 'Fast', desc: 'Good balance of speed and quality' },
  { name: 'gemma3:4b', size: 2.5, minRam: 6, label: 'Good', desc: 'Recommended for most users' },
  { name: 'gemma4:e4b', size: 5, minRam: 8, label: 'Better', desc: 'Higher quality, moderate speed' },
  { name: 'gemma4:12b', size: 8, minRam: 16, label: 'Great', desc: 'High quality, needs decent hardware' },
  { name: 'gemma4:26b', size: 16, minRam: 32, label: 'Best', desc: 'Maximum quality, requires powerful hardware' },
];

type WizardStep = 'welcome' | 'deps' | 'model' | 'persona' | 'profile' | 'pulling' | 'done';

interface DepStatus {
  ollama: { installed: boolean; running: boolean; endpoint: string };
  python: { installed: boolean; path: string };
  edgeTts: { installed: boolean };
  fasterWhisper: { installed: boolean };
  hardware: {
    cpuBrand: string;
    cores: number;
    ramTotalGB: number;
    ramFreeGB: number;
    gpuModel: string;
    gpuVram: number;
  } | null;
  models: Array<{ name: string; size: number }>;
}

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [deps, setDeps] = useState<DepStatus | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [persona, setPersona] = useState<'jarvis' | 'friday'>('jarvis');
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [pullPercent, setPullPercent] = useState(0);
  const [pullStatus, setPullStatus] = useState('');
  const [pullError, setPullError] = useState('');
  const [customModel, setCustomModel] = useState('');
  const unsubRef = useRef<(() => void) | null>(null);

  // Check dependencies on mount
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.checkDependencies) return;

    api.checkDependencies().then((result: DepStatus) => {
      setDeps(result);
      // Auto-recommend model
      if (result.hardware) {
        const ram = result.hardware.ramTotalGB;
        const recommended = [...MODEL_RECOMMENDATIONS].reverse().find((m) => ram >= m.minRam);
        if (recommended) setSelectedModel(recommended.name);
      }
    });
  }, []);

  // Listen for pull progress
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.onPullProgress) return;

    const unsub = api.onPullProgress((data: { model: string; percent: number; status: string }) => {
      setPullPercent(data.percent);
      setPullStatus(data.status);
    });
    unsubRef.current = unsub;
    return unsub;
  }, []);

  const recommendedModel = deps?.hardware
    ? [...MODEL_RECOMMENDATIONS].reverse().find((m) => deps.hardware!.ramTotalGB >= m.minRam)
    : null;

  const allDepsOk = deps?.ollama.running && deps?.python.installed && deps?.edgeTts.installed;

  async function handlePullModel() {
    const model = customModel.trim() || selectedModel;
    if (!model) return;

    setStep('pulling');
    setPullPercent(0);
    setPullError('');

    const api = (window as any).electronAPI;
    try {
      const result = await api.pullModel(model);
      if (!result.success) {
        setPullError(result.error || 'Failed to pull model');
      }
    } catch (err: any) {
      setPullError(err.message);
    }
  }

  async function handleFinish() {
    const api = (window as any).electronAPI;

    // Write user.md
    if (userName || userLocation) {
      const md = `# User Profile
- Name: ${userName || 'sir'}
${userLocation ? `- Location: ${userLocation}` : ''}
- Language: English (conversational)

## Preferences
- Prefers concise, direct answers
- Likes the ${persona === 'jarvis' ? 'Jarvis' : 'Friday'} persona
`;
      await api?.writeUserMd(md);
    }

    // Save setup complete flag
    localStorage.setItem('system-ai-setup-complete', 'true');
    localStorage.setItem('system-ai-settings', JSON.stringify({
      voice: persona,
      currentModel: customModel.trim() || selectedModel,
    }));

    onComplete();
  }

  function skipToApp() {
    localStorage.setItem('system-ai-setup-complete', 'true');
    onComplete();
  }

  const fadeVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
  };

  return (
    <motion.div
      className="wizard-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="wizard-container">
        {/* Header */}
        <div className="wizard-header">
          <div className="wizard-logo font-display">SYSTEM AI</div>
          <div className="wizard-subtitle">First-Run Setup / 首次安装向导</div>
          <button className="wizard-skip" onClick={skipToApp}>
            Skip / 跳过
          </button>
        </div>

        {/* Step indicators */}
        <div className="wizard-steps">
          {['welcome', 'deps', 'model', 'persona', 'profile'].map((s, i) => (
            <div
              key={s}
              className={`wizard-step-dot ${
                step === s ? 'active' : ['welcome', 'deps', 'model', 'persona', 'profile'].indexOf(step) > i ? 'done' : ''
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="wizard-content">
          <AnimatePresence mode="wait">
            {/* ── Welcome ──────────────────────────────── */}
            {step === 'welcome' && (
              <motion.div key="welcome" {...fadeVariants} transition={{ duration: 0.4 }}>
                <h2 className="wizard-title">Welcome to System AI</h2>
                <p className="wizard-desc">
                  This wizard will set up your local AI assistant. We'll check your system,
                  recommend a model, and configure your preferences.
                </p>
                <p className="wizard-desc wizard-desc--cn">
                  此向导将帮助你设置本地 AI 助手。我们将检测系统环境、推荐模型并配置偏好。
                </p>
                <div className="wizard-info-box">
                  <div className="wizard-info-row">
                    <span className="wizard-info-label">What we'll do / 我们将做什么：</span>
                  </div>
                  <ul className="wizard-info-list">
                    <li>Check dependencies (Ollama, Python, packages) / 检测依赖</li>
                    <li>Detect your hardware and recommend a model / 检测硬件并推荐模型</li>
                    <li>Choose your AI persona / 选择 AI 角色</li>
                    <li>Create your user profile / 创建用户档案</li>
                  </ul>
                </div>
                <div className="wizard-actions">
                  <button className="wizard-btn wizard-btn--primary" onClick={() => setStep('deps')}>
                    Get Started / 开始
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Dependencies ─────────────────────────── */}
            {step === 'deps' && (
              <motion.div key="deps" {...fadeVariants} transition={{ duration: 0.4 }}>
                <h2 className="wizard-title">Dependency Check / 依赖检测</h2>
                {!deps ? (
                  <div className="wizard-loading">
                    <div className="wizard-spinner" />
                    <span>Scanning system... / 扫描系统中...</span>
                  </div>
                ) : (
                  <>
                    <div className="wizard-dep-list">
                      <DepRow
                        name="Ollama"
                        ok={deps.ollama.running}
                        installed={deps.ollama.installed}
                        okText="Running / 运行中"
                        installedText="Installed, not running / 已安装，未运行"
                        failText="Not installed / 未安装"
                      />
                      <DepRow
                        name="Python"
                        ok={deps.python.installed}
                        installed={deps.python.installed}
                        okText={`Found: ${deps.python.path}`}
                        failText="Not found / 未找到"
                      />
                      <DepRow
                        name="edge-tts"
                        ok={deps.edgeTts.installed}
                        installed={deps.edgeTts.installed}
                        okText="Installed / 已安装"
                        failText="Run: pip install edge-tts"
                      />
                      <DepRow
                        name="faster-whisper"
                        ok={deps.fasterWhisper.installed}
                        installed={deps.fasterWhisper.installed}
                        okText="Installed / 已安装"
                        failText="Run: pip install faster-whisper"
                      />
                    </div>

                    {deps.hardware && (
                      <div className="wizard-hw-box">
                        <div className="wizard-hw-title">Hardware Detected / 检测到的硬件</div>
                        <div className="wizard-hw-grid">
                          <div className="wizard-hw-item">
                            <span className="wizard-hw-label">CPU</span>
                            <span className="wizard-hw-value">{deps.hardware.cpuBrand}</span>
                          </div>
                          <div className="wizard-hw-item">
                            <span className="wizard-hw-label">Cores / 核心</span>
                            <span className="wizard-hw-value">{deps.hardware.cores}</span>
                          </div>
                          <div className="wizard-hw-item">
                            <span className="wizard-hw-label">RAM / 内存</span>
                            <span className="wizard-hw-value">{deps.hardware.ramTotalGB} GB</span>
                          </div>
                          <div className="wizard-hw-item">
                            <span className="wizard-hw-label">GPU</span>
                            <span className="wizard-hw-value">{deps.hardware.gpuModel}</span>
                          </div>
                          <div className="wizard-hw-item">
                            <span className="wizard-hw-label">VRAM / 显存</span>
                            <span className="wizard-hw-value">{deps.hardware.gpuVram} MB</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!deps.ollama.running && (
                      <div className="wizard-warning">
                        Ollama is not running. Start it with: <code>ollama serve</code>
                        <br />
                        Ollama 未运行。请先运行: <code>ollama serve</code>
                      </div>
                    )}

                    <div className="wizard-actions">
                      <button className="wizard-btn wizard-btn--secondary" onClick={() => setStep('welcome')}>
                        Back / 返回
                      </button>
                      <button
                        className="wizard-btn wizard-btn--primary"
                        onClick={() => setStep('model')}
                        disabled={!deps.ollama.running}
                      >
                        Next / 下一步
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Model Selection ──────────────────────── */}
            {step === 'model' && (
              <motion.div key="model" {...fadeVariants} transition={{ duration: 0.4 }}>
                <h2 className="wizard-title">Choose Your Model / 选择模型</h2>

                {recommendedModel && (
                  <div className="wizard-recommendation">
                    <span className="wizard-recommend-label">Recommended for your hardware / 推荐：</span>
                    <span className="wizard-recommend-model">{recommendedModel.name}</span>
                    <span className="wizard-recommend-reason">
                      — {recommendedModel.desc} ({recommendedModel.size}GB, needs {recommendedModel.minRam}GB+ RAM)
                    </span>
                  </div>
                )}

                <div className="wizard-model-grid">
                  {MODEL_RECOMMENDATIONS.map((m) => {
                    const isInstalled = deps?.models.some((dm) => dm.name === m.name);
                    const tooMuchRam = deps?.hardware ? m.minRam > deps.hardware.ramTotalGB : false;
                    return (
                      <button
                        key={m.name}
                        className={`wizard-model-card ${selectedModel === m.name ? 'selected' : ''} ${tooMuchRam ? 'warning' : ''}`}
                        onClick={() => { setSelectedModel(m.name); setCustomModel(''); }}
                        disabled={tooMuchRam}
                      >
                        <div className="wizard-model-name">{m.name}</div>
                        <div className="wizard-model-meta">
                          <span>{m.size}GB</span>
                          <span>{m.minRam}GB+ RAM</span>
                        </div>
                        <div className="wizard-model-label">{m.label}</div>
                        {isInstalled && <div className="wizard-model-badge">Installed</div>}
                        {tooMuchRam && <div className="wizard-model-badge warning">Low RAM</div>}
                      </button>
                    );
                  })}
                </div>

                <div className="wizard-custom-model">
                  <label>Or enter a custom model name / 或输入自定义模型：</label>
                  <input
                    type="text"
                    className="wizard-input"
                    value={customModel}
                    onChange={(e) => { setCustomModel(e.target.value); setSelectedModel(''); }}
                    placeholder="e.g. mistral:7b, qwen2.5:7b, deepseek-r1:8b"
                  />
                </div>

                {deps?.models && deps.models.length > 0 && (
                  <div className="wizard-installed-models">
                    <label>Already installed / 已安装：</label>
                    <div className="wizard-installed-list">
                      {deps.models.map((m) => (
                        <button
                          key={m.name}
                          className={`wizard-installed-tag ${selectedModel === m.name ? 'active' : ''}`}
                          onClick={() => { setSelectedModel(m.name); setCustomModel(''); }}
                        >
                          {m.name} ({(m.size / 1e9).toFixed(1)}GB)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="wizard-actions">
                  <button className="wizard-btn wizard-btn--secondary" onClick={() => setStep('deps')}>
                    Back / 返回
                  </button>
                  <button
                    className="wizard-btn wizard-btn--primary"
                    onClick={() => {
                      const model = customModel.trim() || selectedModel;
                      const isInstalled = deps?.models.some((dm) => dm.name === model);
                      if (model && !isInstalled) {
                        handlePullModel();
                      } else {
                        setStep('persona');
                      }
                    }}
                    disabled={!selectedModel && !customModel.trim()}
                  >
                    Next / 下一步
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Pulling Model ────────────────────────── */}
            {step === 'pulling' && (
              <motion.div key="pulling" {...fadeVariants} transition={{ duration: 0.4 }}>
                <h2 className="wizard-title">Downloading Model / 下载模型</h2>
                <div className="wizard-pull-info">
                  <span className="wizard-pull-model">{customModel.trim() || selectedModel}</span>
                </div>

                <div className="wizard-progress-container">
                  <div className="wizard-progress-track">
                    <motion.div
                      className="wizard-progress-fill"
                      initial={{ width: '0%' }}
                      animate={{ width: `${pullPercent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="wizard-progress-info">
                    <span className="wizard-progress-pct">{pullPercent}%</span>
                    <span className="wizard-progress-status">{pullStatus}</span>
                  </div>
                </div>

                {pullError && (
                  <div className="wizard-error">
                    Error: {pullError}
                    <br />
                    Make sure <code>ollama serve</code> is running.
                  </div>
                )}

                {pullPercent === 100 && !pullError && (
                  <div className="wizard-actions">
                    <button className="wizard-btn wizard-btn--primary" onClick={() => setStep('persona')}>
                      Next / 下一步
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Persona ──────────────────────────────── */}
            {step === 'persona' && (
              <motion.div key="persona" {...fadeVariants} transition={{ duration: 0.4 }}>
                <h2 className="wizard-title">Choose Your Persona / 选择角色</h2>
                <p className="wizard-desc">
                  Your AI assistant's personality and voice.
                  <br />
                  AI 助手的性格和声音。
                </p>

                <div className="wizard-persona-grid">
                  <button
                    className={`wizard-persona-card ${persona === 'jarvis' ? 'selected' : ''}`}
                    onClick={() => setPersona('jarvis')}
                  >
                    <div className="wizard-persona-icon">J</div>
                    <div className="wizard-persona-name">J.A.R.V.I.S.</div>
                    <div className="wizard-persona-voice">British male voice / 英式男声</div>
                    <div className="wizard-persona-desc">
                      Dry wit, calm confidence, addresses you as "sir"
                    </div>
                    <div className="wizard-persona-desc wizard-persona-desc--cn">
                      冷静幽默，称呼你为 "sir"
                    </div>
                  </button>
                  <button
                    className={`wizard-persona-card ${persona === 'friday' ? 'selected' : ''}`}
                    onClick={() => setPersona('friday')}
                  >
                    <div className="wizard-persona-icon">F</div>
                    <div className="wizard-persona-name">F.R.I.D.A.Y.</div>
                    <div className="wizard-persona-voice">American female voice / 美式女声</div>
                    <div className="wizard-persona-desc">
                      Warm, direct, efficient — gets things done
                    </div>
                    <div className="wizard-persona-desc wizard-persona-desc--cn">
                      温暖、直接、高效
                    </div>
                  </button>
                </div>

                <div className="wizard-actions">
                  <button className="wizard-btn wizard-btn--secondary" onClick={() => setStep('model')}>
                    Back / 返回
                  </button>
                  <button className="wizard-btn wizard-btn--primary" onClick={() => setStep('profile')}>
                    Next / 下一步
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Profile ──────────────────────────────── */}
            {step === 'profile' && (
              <motion.div key="profile" {...fadeVariants} transition={{ duration: 0.4 }}>
                <h2 className="wizard-title">Your Profile / 你的档案</h2>
                <p className="wizard-desc">
                  Tell the AI about yourself. This is stored locally in <code>user.md</code>.
                  <br />
                  告诉 AI 关于你自己。数据保存在本地 <code>user.md</code> 文件中。
                </p>

                <div className="wizard-form">
                  <div className="wizard-form-row">
                    <label>Name / 名字</label>
                    <input
                      type="text"
                      className="wizard-input"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. sir, boss, your name"
                    />
                  </div>
                  <div className="wizard-form-row">
                    <label>Location / 位置</label>
                    <input
                      type="text"
                      className="wizard-input"
                      value={userLocation}
                      onChange={(e) => setUserLocation(e.target.value)}
                      placeholder="e.g. Kuala Lumpur, Malaysia"
                    />
                  </div>
                </div>

                <div className="wizard-summary">
                  <div className="wizard-summary-title">Setup Summary / 设置摘要</div>
                  <div className="wizard-summary-row">
                    <span>Model / 模型:</span>
                    <span>{customModel.trim() || selectedModel || 'None selected'}</span>
                  </div>
                  <div className="wizard-summary-row">
                    <span>Persona / 角色:</span>
                    <span>{persona === 'jarvis' ? 'J.A.R.V.I.S.' : 'F.R.I.D.A.Y.'}</span>
                  </div>
                  <div className="wizard-summary-row">
                    <span>Name / 名字:</span>
                    <span>{userName || 'sir'}</span>
                  </div>
                </div>

                <div className="wizard-actions">
                  <button className="wizard-btn wizard-btn--secondary" onClick={() => setStep('persona')}>
                    Back / 返回
                  </button>
                  <button className="wizard-btn wizard-btn--primary" onClick={handleFinish}>
                    Finish / 完成
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Done ─────────────────────────────────── */}
            {step === 'done' && (
              <motion.div key="done" {...fadeVariants} transition={{ duration: 0.4 }}>
                <h2 className="wizard-title">Setup Complete / 设置完成</h2>
                <div className="wizard-done-check">&#10003;</div>
                <p className="wizard-desc">
                  System AI is ready. Launching...
                  <br />
                  System AI 已就绪，正在启动...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Dependency row component ──────────────────────────────
function DepRow({
  name,
  ok,
  installed,
  okText,
  installedText,
  failText,
}: {
  name: string;
  ok: boolean;
  installed: boolean;
  okText: string;
  installedText?: string;
  failText: string;
}) {
  const status = ok ? 'ok' : installed ? 'warn' : 'fail';
  const text = ok ? okText : installed ? (installedText || okText) : failText;
  return (
    <div className={`wizard-dep-row wizard-dep-row--${status}`}>
      <span className="wizard-dep-icon">{status === 'ok' ? '\u2713' : status === 'warn' ? '!' : '\u2717'}</span>
      <span className="wizard-dep-name">{name}</span>
      <span className="wizard-dep-status">{text}</span>
    </div>
  );
}
