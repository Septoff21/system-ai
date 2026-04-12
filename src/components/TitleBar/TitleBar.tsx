import './TitleBar.css';

export default function TitleBar() {
  const api = window.electronAPI;

  return (
    <div className="titlebar">
      <div className="titlebar-label font-mono">
        <span className="titlebar-dot" />
        SYSTEM
      </div>
      <div className="titlebar-controls">
        <button
          className="titlebar-btn"
          onClick={() => api?.minimize()}
          title="Minimize"
          id="btn-minimize"
        >
          ─
        </button>
        <button
          className="titlebar-btn"
          onClick={() => api?.maximize()}
          title="Maximize"
          id="btn-maximize"
        >
          □
        </button>
        <button
          className="titlebar-btn titlebar-btn--close"
          onClick={() => api?.close()}
          title="Close"
          id="btn-close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
