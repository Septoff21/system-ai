import { useState, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import './RightPanel.css';

export default function RightPanel() {
  const { ollamaRunning, currentModel, checkOllamaStatus } = useChatStore();

  useEffect(() => {
    checkOllamaStatus();
  }, [checkOllamaStatus]);

  return (
    <div className="right-panel">
      {/* ── AI Status ──────────────────────── */}
      <div className="rp-section hud-panel">
        <div className="hud-corner hud-corner--tl" />
        <div className="hud-corner hud-corner--tr" />
        <div className="hud-corner hud-corner--bl" />
        <div className="hud-corner hud-corner--br" />
        <div className="rp-section-header font-display">AI STATUS</div>
        <div className="rp-status-list">
          <StatusItem label="OLLAMA" value={ollamaRunning ? 'ONLINE' : 'OFFLINE'} online={ollamaRunning} />
          <StatusItem label="MODEL" value={currentModel || 'NONE'} online={!!currentModel} />
          <StatusItem label="VOICE" value="JARVIS" online />
        </div>
      </div>

      {/* ── System ─────────────────────────── */}
      <div className="rp-section hud-panel">
        <div className="hud-corner hud-corner--tl" />
        <div className="hud-corner hud-corner--tr" />
        <div className="hud-corner hud-corner--bl" />
        <div className="hud-corner hud-corner--br" />
        <div className="rp-section-header font-display">SYSTEM</div>
        <div className="rp-status-list">
          <StatusItem label="OS" value="WINDOWS" online />
          <StatusItem label="GPU" value="RTX 4090" online />
          <StatusItem label="RAM" value="32 GB" online />
        </div>
      </div>

      {/* ── Communication (compact) ────────── */}
      <div className="rp-section rp-section--compact hud-panel">
        <div className="hud-corner hud-corner--tl" />
        <div className="hud-corner hud-corner--tr" />
        <div className="hud-corner hud-corner--bl" />
        <div className="hud-corner hud-corner--br" />
        <div className="rp-section-header font-display">COMMS</div>
        <div className="rp-comm-list">
          <CommItem label="SHIELD" status="ACTIVE" online />
          <CommItem label="SATELLITE" status="LOCKED" online />
          <CommItem label="MESH" status="STANDBY" online={false} />
        </div>
      </div>
    </div>
  );
}

function CommItem({ label, status, online }: { label: string; status: string; online: boolean }) {
  return (
    <div className="rp-comm-row">
      <span className={`rp-status-dot ${online ? 'rp-status-dot--on' : 'rp-status-dot--off'}`} />
      <span className="rp-comm-label font-mono">{label}</span>
      <span className={`rp-comm-status font-mono ${online ? 'rp-comm-status--on' : ''}`}>{status}</span>
    </div>
  );
}

function StatusItem({ label, value, online }: { label: string; value: string; online: boolean }) {
  return (
    <div className="rp-status-row">
      <span className={`rp-status-dot ${online ? 'rp-status-dot--on' : 'rp-status-dot--off'}`} />
      <span className="rp-status-label">{label}</span>
      <span className="rp-status-value font-mono">{value}</span>
    </div>
  );
}
