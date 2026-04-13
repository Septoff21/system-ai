import { useState, useCallback, useEffect } from 'react';
import BootSequence from './components/BootSequence/BootSequence';
import SetupWizard from './components/SetupWizard/SetupWizard';
import HUDLayout from './components/HUD/HUDLayout';
import TitleBar from './components/TitleBar/TitleBar';

type AppPhase = 'boot' | 'setup' | 'main';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('boot');
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  // Check if first-run setup is needed
  useEffect(() => {
    const done = localStorage.getItem('system-ai-setup-complete');
    setNeedsSetup(!done);
  }, []);

  const handleBootComplete = useCallback(() => {
    if (needsSetup) {
      setPhase('setup');
    } else {
      setPhase('main');
    }
  }, [needsSetup]);

  const handleSetupComplete = useCallback(() => {
    setPhase('main');
  }, []);

  // Don't render until we know if setup is needed
  if (needsSetup === null) return null;

  return (
    <div className="app-root">
      <div className="bg-grid" />
      <TitleBar />

      {phase === 'boot' && (
        <BootSequence onComplete={handleBootComplete} />
      )}

      {phase === 'setup' && (
        <SetupWizard onComplete={handleSetupComplete} />
      )}

      {phase === 'main' && (
        <HUDLayout />
      )}

      <div className="scanline-overlay" />
    </div>
  );
}
