import { useState, useEffect } from 'react';
import './TimeDisplay.css';

export default function TimeDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const date = time.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const day = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  return (
    <div className="time-display hud-panel">
      <div className="hud-corner hud-corner--tl" />
      <div className="hud-corner hud-corner--tr" />
      <div className="hud-corner hud-corner--bl" />
      <div className="hud-corner hud-corner--br" />

      <div className="time-main font-display">
        <span className="time-hours">{hours}</span>
        <span className="time-colon">:</span>
        <span className="time-minutes">{minutes}</span>
      </div>
      <div className="time-seconds font-mono">{seconds}s</div>
      <div className="time-date font-mono">
        <span>{day}</span>
        <span className="time-date-separator">·</span>
        <span>{date}</span>
      </div>
    </div>
  );
}
