import { useState, useCallback } from 'react';
import BootSequence from './components/BootSequence/BootSequence';
import HUDLayout from './components/HUD/HUDLayout';
import TitleBar from './components/TitleBar/TitleBar';

type AppPhase = 'boot' | 'main';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('boot');

  const handleBootComplete = useCallback(() => {
    setPhase('main');
    // Welcome message + TTS is handled inside BootSequence at the "ready" phase
  }, []);

  return (
    <div className="app-root">
      <div className="bg-grid" />
      <TitleBar />

      {phase === 'boot' && (
        <BootSequence onComplete={handleBootComplete} />
      )}

      {phase === 'main' && (
        <HUDLayout />
      )}

      <div className="scanline-overlay" />
    </div>
  );
}
