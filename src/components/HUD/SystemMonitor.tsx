import { useState, useEffect } from 'react';
import './SystemMonitor.css';

interface SystemStats {
  cpu: number;
  ram: number;
  gpu: number;
  gpuName: string;
  totalRam: string;
}

export default function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    ram: 0,
    gpu: 0,
    gpuName: 'Detecting...',
    totalRam: '...',
  });

  useEffect(() => {
    // Simulate real-time stats (will connect to actual IPC later)
    const interval = setInterval(() => {
      setStats({
        cpu: 15 + Math.random() * 20,
        ram: 55 + Math.random() * 15,
        gpu: 10 + Math.random() * 25,
        gpuName: 'GPU',
        totalRam: '32 GB',
      });
    }, 2000);

    // Try to get real hardware info
    if (window.electronAPI) {
      window.electronAPI.getHardwareInfo().then((info: any) => {
        if (info && !info.error) {
          setStats(prev => ({
            ...prev,
            gpuName: info.gpu?.[0]?.model || 'Unknown GPU',
            totalRam: `${Math.round((info.memory?.total || 0) / (1024 ** 3))} GB`,
          }));
        }
      }).catch(() => {});
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sys-monitor hud-panel">
      <div className="hud-corner hud-corner--tl" />
      <div className="hud-corner hud-corner--tr" />
      <div className="hud-corner hud-corner--bl" />
      <div className="hud-corner hud-corner--br" />

      <div className="sys-monitor-header font-display">SYSTEM</div>

      <div className="sys-monitor-metrics">
        <MetricBar label="CPU" value={stats.cpu} color="var(--color-primary)" />
        <MetricBar label="RAM" value={stats.ram} color="var(--color-success)" />
        <MetricBar label="GPU" value={stats.gpu} color="var(--color-accent)" />
      </div>

      <div className="sys-monitor-info">
        <div className="sys-info-row">
          <span className="sys-info-label">GPU</span>
          <span className="sys-info-value font-mono">{stats.gpuName}</span>
        </div>
        <div className="sys-info-row">
          <span className="sys-info-label">RAM</span>
          <span className="sys-info-value font-mono">{stats.totalRam}</span>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="metric-bar">
      <div className="metric-bar-header">
        <span className="metric-bar-label font-mono">{label}</span>
        <span className="metric-bar-value font-mono">{Math.round(value)}%</span>
      </div>
      <div className="metric-bar-track">
        <div
          className="metric-bar-fill"
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
