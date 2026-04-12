import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speakText } from '../../stores/chatStore';
import './BootSequence.css';

interface BootSequenceProps {
  onComplete: () => void;
}

interface LogEntry {
  text: string;
  status: 'pending' | 'running' | 'done' | 'error';
  delay: number;
}

const BOOT_LOGS: LogEntry[] = [
  { text: 'Initializing System Core', status: 'done', delay: 300 },
  { text: 'Loading neural interface', status: 'done', delay: 600 },
  { text: 'Scanning hardware configuration', status: 'done', delay: 1000 },
  { text: 'Detecting GPU capabilities', status: 'done', delay: 1400 },
  { text: 'Connecting to Ollama service', status: 'done', delay: 1800 },
  { text: 'Loading Gemma 4 language model', status: 'done', delay: 2200 },
  { text: 'Initializing voice synthesis module', status: 'done', delay: 2600 },
  { text: 'Calibrating agent protocols', status: 'done', delay: 3000 },
  { text: 'System online', status: 'done', delay: 3400 },
];

// ── Boot beep sound (Web Audio API) ────────────────────
function playBootBeeps() {
  try {
    const ctx = new AudioContext();

    // Rapid beep sequence — like a radar sweep
    const beepTimes = [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72];

    beepTimes.forEach((time, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 800 + (i * 60);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + 0.08);
    });

    // Final confirmation tone — deeper, longer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 600;
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.9);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.9);
    osc2.stop(ctx.currentTime + 1.2);

    // Ambient hum — subtle background tone
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.value = 120;
    gain3.gain.setValueAtTime(0.02, ctx.currentTime);
    gain3.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
    gain3.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(ctx.currentTime);
    osc3.stop(ctx.currentTime + 4);
  } catch {
    // AudioContext may not be available
  }
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [phase, setPhase] = useState<'dark' | 'spark' | 'rings' | 'logs' | 'ready' | 'exit'>('dark');
  const [visibleLogs, setVisibleLogs] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Dark → Spark (center point appears)
    timers.push(setTimeout(() => setPhase('spark'), 400));

    // Spark → Rings (rings expand)
    timers.push(setTimeout(() => setPhase('rings'), 1200));

    // Rings → Logs (status messages appear) + start beeps
    timers.push(setTimeout(() => {
      setPhase('logs');
      playBootBeeps();
    }, 2000));

    // Show logs one by one
    BOOT_LOGS.forEach((log, i) => {
      timers.push(setTimeout(() => {
        setVisibleLogs(i + 1);
        setProgress(((i + 1) / BOOT_LOGS.length) * 100);
      }, 2000 + log.delay));
    });

    // Ready state — speak welcome message
    timers.push(setTimeout(() => {
      setPhase('ready');
      speakText('Welcome back, sir. System is live. All diagnostics nominal.', 'jarvis');
    }, 5800));

    // Exit transition
    timers.push(setTimeout(() => setPhase('exit'), 6600));

    // Complete
    timers.push(setTimeout(() => onCompleteRef.current(), 7200));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? (
        <motion.div
          ref={containerRef}
          className="boot-container"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Background vignette */}
          <div className="boot-vignette" />

          {/* Central spark point */}
          <AnimatePresence>
            {(phase === 'spark' || phase === 'rings' || phase === 'logs' || phase === 'ready') && (
              <motion.div
                className="boot-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {/* Core dot */}
                <motion.div
                  className="boot-core-dot"
                  animate={{
                    boxShadow: phase === 'ready'
                      ? '0 0 60px rgba(0, 212, 255, 0.8), 0 0 120px rgba(0, 212, 255, 0.3)'
                      : '0 0 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(0, 212, 255, 0.15)',
                  }}
                  transition={{ duration: 0.8 }}
                />

                {/* Ring 1 - Inner */}
                {(phase === 'rings' || phase === 'logs' || phase === 'ready') && (
                  <motion.div
                    className="boot-ring boot-ring-1"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.7 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}

                {/* Ring 2 - Middle */}
                {(phase === 'rings' || phase === 'logs' || phase === 'ready') && (
                  <motion.div
                    className="boot-ring boot-ring-2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.5 }}
                    transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}

                {/* Ring 3 - Outer */}
                {(phase === 'rings' || phase === 'logs' || phase === 'ready') && (
                  <motion.div
                    className="boot-ring boot-ring-3"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.3 }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}

                {/* Rotating dashes */}
                {(phase === 'logs' || phase === 'ready') && (
                  <motion.div
                    className="boot-rotator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="boot-rotator-dash"
                        style={{ transform: `rotate(${i * 30}deg)` }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Horizontal scan lines expanding from center */}
          {(phase === 'rings' || phase === 'logs' || phase === 'ready') && (
            <>
              <motion.div
                className="boot-hline boot-hline-top"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '80%', opacity: 0.4 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                className="boot-hline boot-hline-bottom"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '60%', opacity: 0.3 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </>
          )}

          {/* Status logs */}
          {(phase === 'logs' || phase === 'ready') && (
            <motion.div
              className="boot-logs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {BOOT_LOGS.slice(0, visibleLogs).map((log, i) => (
                <motion.div
                  key={i}
                  className={`boot-log-entry ${i === visibleLogs - 1 ? 'boot-log-entry--active' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="boot-log-marker">
                    {i < visibleLogs - 1 || phase === 'ready' ? '\u2713' : '\u27f3'}
                  </span>
                  <span className="boot-log-text">{log.text}</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Progress bar */}
          {(phase === 'logs' || phase === 'ready') && (
            <motion.div
              className="boot-progress-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="boot-progress-track">
                <motion.div
                  className="boot-progress-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="boot-progress-text font-mono">
                {Math.round(progress)}%
              </span>
            </motion.div>
          )}

          {/* System Online flash */}
          {phase === 'ready' && (
            <motion.div
              className="boot-ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <span className="boot-ready-text font-display glow-text">
                SYSTEM ONLINE
              </span>
            </motion.div>
          )}

          {/* SYSTEM label at top */}
          {(phase === 'rings' || phase === 'logs' || phase === 'ready') && (
            <motion.div
              className="boot-title font-display"
              initial={{ opacity: 0, letterSpacing: '20px' }}
              animate={{ opacity: 1, letterSpacing: '12px' }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              SYSTEM
            </motion.div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
