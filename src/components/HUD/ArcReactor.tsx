import { useRef, useEffect } from 'react';
import './ArcReactor.css';

export default function ArcReactor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const size = 240;
    canvas.width = size * 2; // retina
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(2, 2);
    const cx = size / 2;
    const cy = size / 2;
    let angle = 0;

    function drawRing(radius: number, segments: number, gap: number, width: number, alpha: number, speed: number) {
      const segAngle = (Math.PI * 2) / segments;
      const gapAngle = (gap * Math.PI) / 180;
      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
      ctx.lineCap = 'round';
      for (let i = 0; i < segments; i++) {
        const start = i * segAngle + angle * speed;
        const end = start + segAngle - gapAngle;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, end);
        ctx.stroke();
      }
    }

    function drawDots(radius: number, count: number, dotSize: number, alpha: number, speed: number) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + angle * speed;
        const x = cx + Math.cos(a) * radius;
        const y = cy + Math.sin(a) * radius;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
        ctx.fill();
      }
    }

    function drawCore() {
      // Core glow
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.9)');
      gradient.addColorStop(0.3, 'rgba(0, 212, 255, 0.4)');
      gradient.addColorStop(0.7, 'rgba(0, 212, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core center
      const breath = 0.7 + Math.sin(angle * 2) * 0.3;
      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
      coreGradient.addColorStop(0, `rgba(200, 240, 255, ${breath})`);
      coreGradient.addColorStop(0.5, `rgba(0, 212, 255, ${breath * 0.7})`);
      coreGradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
    }

    function drawTrianglePointers(radius: number, count: number, alpha: number, speed: number) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + angle * speed;
        const x = cx + Math.cos(a) * radius;
        const y = cy + Math.sin(a) * radius;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(3, 4);
        ctx.lineTo(-3, 4);
        ctx.closePath();
        ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
        ctx.fill();
        ctx.restore();
      }
    }

    function render() {
      ctx.clearRect(0, 0, size, size);
      angle += 0.008;

      // Outer ambient glow
      const outerGlow = ctx.createRadialGradient(cx, cy, 60, cx, cy, 120);
      outerGlow.addColorStop(0, 'rgba(0, 212, 255, 0.03)');
      outerGlow.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Rings (outside → inside)
      drawRing(100, 60, 2, 1, 0.08, 0.3);
      drawRing(88, 3, 20, 2, 0.25, -0.5);
      drawDots(88, 24, 1.2, 0.2, 0.4);
      drawTrianglePointers(76, 6, 0.3, -0.7);
      drawRing(68, 8, 8, 1.5, 0.35, 0.8);
      drawRing(55, 4, 15, 2.5, 0.4, -1.0);
      drawDots(55, 12, 1.5, 0.3, -0.6);
      drawRing(42, 12, 5, 1, 0.5, 1.2);
      drawRing(32, 6, 10, 2, 0.3, -0.4);

      // Core
      drawCore();

      frameRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div className="arc-reactor">
      <canvas ref={canvasRef} className="arc-reactor-canvas" />
      <div className="arc-reactor-label font-display">
        J.A.R.V.I.S.
      </div>
    </div>
  );
}
