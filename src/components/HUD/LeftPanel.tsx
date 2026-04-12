import { useState, useEffect, useRef } from 'react';
import './LeftPanel.css';

interface SystemStats {
  cpu: number;
  ram: number;
  gpu: number;
  gpuName: string;
  totalRam: string;
  totalDisk: number;
  freeDisk: number;
}

export default function LeftPanel() {
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0, ram: 0, gpu: 0,
    gpuName: 'Detecting...', totalRam: '...',
    totalDisk: 0, freeDisk: 0,
  });
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setTime(new Date()), 1000);
    const t2 = setInterval(() => setUptime(p => p + 1), 1000);
    const t3 = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpu: 15 + Math.random() * 25,
        ram: 50 + Math.random() * 15,
        gpu: 10 + Math.random() * 20,
      }));
    }, 2000);

    if (window.electronAPI) {
      window.electronAPI.getHardwareInfo().then((info: any) => {
        if (info && !info.error) {
          setStats(prev => ({
            ...prev,
            gpuName: info.gpu?.[0]?.model || 'Unknown GPU',
            totalRam: `${Math.round((info.memory?.total || 0) / (1024 ** 3))} GB`,
            totalDisk: 522,
            freeDisk: 215,
          }));
        }
      }).catch(() => {});
    }

    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const month = time.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = time.getDate().toString().padStart(2, '0');
  const weekday = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  const uptimeH = Math.floor(uptime / 3600);
  const uptimeM = Math.floor((uptime % 3600) / 60);

  const diskPercent = stats.totalDisk > 0
    ? Math.round(((stats.totalDisk - stats.freeDisk) / stats.totalDisk) * 100)
    : 0;

  return (
    <div className="left-panel">
      {/* ── Header: Date & Time ─────────────────── */}
      <div className="lp-header hud-panel">
        <div className="hud-corner hud-corner--tl" />
        <div className="hud-corner hud-corner--tr" />
        <div className="hud-corner hud-corner--bl" />
        <div className="hud-corner hud-corner--br" />
        <div className="lp-datetime">
          <div className="lp-date font-display">
            {day} {month} {weekday}
          </div>
          <div className="lp-time font-display">
            <span>{hours}</span>
            <span className="lp-time-colon">:</span>
            <span>{minutes}</span>
            <span className="lp-time-seconds font-mono">:{seconds}</span>
          </div>
        </div>
      </div>

      {/* ── Primary Storage ────────────────────── */}
      <div className="lp-section hud-panel">
        <div className="hud-corner hud-corner--tl" />
        <div className="hud-corner hud-corner--tr" />
        <div className="hud-corner hud-corner--bl" />
        <div className="hud-corner hud-corner--br" />
        <div className="lp-section-header font-display">PRIMARY STORAGE</div>
        <div className="lp-storage-info">
          <div className="lp-storage-bar-track">
            <div className="lp-storage-bar-fill" style={{ width: `${diskPercent}%` }} />
          </div>
          <div className="lp-storage-labels font-mono">
            <span>{stats.totalDisk}G</span>
            <span>{stats.freeDisk}G FREE</span>
          </div>
        </div>
      </div>

      {/* ── Power + CPU/RAM ────────────────────── */}
      <div className="lp-section hud-panel">
        <div className="hud-corner hud-corner--tl" />
        <div className="hud-corner hud-corner--tr" />
        <div className="hud-corner hud-corner--bl" />
        <div className="hud-corner hud-corner--br" />
        <div className="lp-section-header font-display">CORE METRICS</div>
        <div className="lp-metrics">
          <PowerCircle value={95} />
          <MetricBar label="CPU" value={stats.cpu} color="var(--color-primary)" />
          <MetricBar label="RAM" value={stats.ram} color="var(--color-success)" />
        </div>
      </div>

      {/* ── Environment ────────────────────────── */}
      <div className="lp-section hud-panel">
        <div className="hud-corner hud-corner--tl" />
        <div className="hud-corner hud-corner--tr" />
        <div className="hud-corner hud-corner--bl" />
        <div className="hud-corner hud-corner--br" />
        <div className="lp-section-header font-display">ENVIRONMENT</div>
        <div className="lp-env">
          <div className="lp-env-row">
            <span className="lp-env-label">WEATHER</span>
            <span className="lp-env-value font-mono">24°C</span>
          </div>
          <div className="lp-env-desc font-mono">Partly Cloudy</div>
          <div className="lp-env-row">
            <span className="lp-env-label">UPTIME</span>
            <span className="lp-env-value font-mono">{uptimeH}h {uptimeM}m</span>
          </div>
        </div>
      </div>

      {/* ── Radar ──────────────────────────────── */}
      <div className="lp-radar-container hud-panel">
        <div className="hud-corner hud-corner--tl" />
        <div className="hud-corner hud-corner--tr" />
        <div className="hud-corner hud-corner--bl" />
        <div className="hud-corner hud-corner--br" />
        <RadarScanner />
      </div>
    </div>
  );
}

/* ── Power Circle ────────────────────────────────────── */
function PowerCircle({ value }: { value: number }) {
  const radius = 36;
  const stroke = 4;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="lp-power">
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle cx="45" cy="45" r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ filter: 'drop-shadow(0 0 6px var(--color-primary-glow))', transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="45" y="40" textAnchor="middle" fill="var(--text-primary)"
          fontFamily="var(--font-display)" fontSize="10" letterSpacing="1">POWER</text>
        <text x="45" y="56" textAnchor="middle" fill="var(--color-primary)"
          fontFamily="var(--font-display)" fontSize="16">{value}%</text>
      </svg>
    </div>
  );
}

/* ── Metric Bar ──────────────────────────────────────── */
function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="lp-metric">
      <div className="lp-metric-header font-mono">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="lp-metric-track">
        <div className="lp-metric-fill"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Radar Scanner ───────────────────────────────────── */
function RadarScanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const size = 120;
    canvas.width = size * 2;
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(2, 2);
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;
    let angle = 0;

    // Random blips
    const blips = Array.from({ length: 5 }, () => ({
      a: Math.random() * Math.PI * 2,
      d: 0.3 + Math.random() * 0.6,
      life: Math.random(),
    }));

    function render() {
      ctx.clearRect(0, 0, size, size);
      angle += 0.015;

      // Rings
      [0.33, 0.66, 1].forEach(s => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * s, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.12)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Cross lines
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
      ctx.stroke();

      // Sweep
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const sweepGrad = ctx.createLinearGradient(0, 0, r, 0);
      sweepGrad.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
      sweepGrad.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, -0.3, 0);
      ctx.lineTo(0, 0);
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Sweep line
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Blips
      blips.forEach(b => {
        const blipAngle = b.a;
        let diff = angle - blipAngle;
        if (diff < 0) diff += Math.PI * 2;
        const fade = diff < 1.5 ? 1 - diff / 1.5 : 0;
        if (fade <= 0) return;
        const bx = cx + Math.cos(b.a) * r * b.d;
        const by = cy + Math.sin(b.a) * r * b.d;
        ctx.beginPath();
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${fade * 0.8})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${fade * 0.2})`;
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(render);
    }
    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return <canvas ref={canvasRef} className="lp-radar-canvas" />;
}
