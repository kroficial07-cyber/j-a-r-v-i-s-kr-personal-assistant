import React, { useEffect, useRef } from 'react';
import { AssistantState } from '../types';

interface NeuralCoreProps {
  state: AssistantState;
  onClick?: () => void;
  size?: number;
  lowPowerMode?: boolean;
}

export const NeuralCore: React.FC<NeuralCoreProps> = ({
  state,
  onClick,
  size = 280,
  lowPowerMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let pulseAngle = 0;
    let lastTime = performance.now();

    // Responsive pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;

    const render = (time: number) => {
      // Throttle if low power mode
      if (lowPowerMode && time - lastTime < 33) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastTime = time;

      ctx.clearRect(0, 0, size, size);

      // Speed multiplier depending on state
      let speed = 0.015;
      let pulseSpeed = 0.04;
      let primaryColor = 'rgba(6, 182, 212, '; // cyan-500
      let secondaryColor = 'rgba(59, 130, 246, '; // blue-500
      let glowColor = 'rgba(6, 182, 212, 0.4)';

      if (state === 'listening') {
        speed = 0.04;
        pulseSpeed = 0.12;
        primaryColor = 'rgba(34, 211, 238, '; // cyan-400
        secondaryColor = 'rgba(14, 165, 233, '; // sky-500
        glowColor = 'rgba(34, 211, 238, 0.8)';
      } else if (state === 'processing') {
        speed = 0.06;
        pulseSpeed = 0.16;
        primaryColor = 'rgba(56, 189, 248, '; // sky-400
        secondaryColor = 'rgba(99, 102, 241, '; // indigo-500
        glowColor = 'rgba(56, 189, 248, 0.7)';
      } else if (state === 'speaking') {
        speed = 0.025;
        pulseSpeed = 0.08;
        primaryColor = 'rgba(6, 182, 212, ';
        secondaryColor = 'rgba(37, 99, 235, ';
        glowColor = 'rgba(6, 182, 212, 0.6)';
      }

      angle += speed;
      pulseAngle += pulseSpeed;

      const dynamicRadius = center * 0.42 + Math.sin(pulseAngle) * (state === 'listening' ? 12 : 5);

      // 1. Ambient Glow Backing
      const glowGrad = ctx.createRadialGradient(
        center,
        center,
        dynamicRadius * 0.2,
        center,
        center,
        center * 0.95
      );
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
      glowGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, size, size);

      // 2. Outer Segmented Ring
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle * 0.5);
      ctx.strokeStyle = primaryColor + '0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 14, 32, 14]);
      ctx.beginPath();
      ctx.arc(0, 0, center * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. Middle Counter-Rotating Ring with Marks
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(-angle * 0.8);
      ctx.strokeStyle = secondaryColor + '0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([24, 8, 48, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, center * 0.68, 0, Math.PI * 2);
      ctx.stroke();

      // Mini satellite ticks
      const tickCount = 12;
      for (let i = 0; i < tickCount; i++) {
        const theta = (i * Math.PI * 2) / tickCount;
        const x1 = Math.cos(theta) * (center * 0.64);
        const y1 = Math.sin(theta) * (center * 0.64);
        const x2 = Math.cos(theta) * (center * 0.72);
        const y2 = Math.sin(theta) * (center * 0.72);
        ctx.strokeStyle = primaryColor + '0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Waveform Spikes if Listening or Speaking
      if (state === 'listening' || state === 'speaking') {
        ctx.save();
        ctx.translate(center, center);
        const spikeCount = 36;
        for (let i = 0; i < spikeCount; i++) {
          const theta = (i * Math.PI * 2) / spikeCount;
          const amp = Math.sin(time * 0.008 + i * 0.6) * 14 + (state === 'listening' ? 16 : 8);
          const rBase = dynamicRadius + 4;
          const x1 = Math.cos(theta) * rBase;
          const y1 = Math.sin(theta) * rBase;
          const x2 = Math.cos(theta) * (rBase + Math.max(2, amp));
          const y2 = Math.sin(theta) * (rBase + Math.max(2, amp));

          ctx.strokeStyle = primaryColor + '0.85)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Inner Core (Arc Reactor Center)
      const coreGrad = ctx.createRadialGradient(
        center,
        center,
        0,
        center,
        center,
        dynamicRadius
      );
      coreGrad.addColorStop(0, primaryColor + '0.95)');
      coreGrad.addColorStop(0.3, secondaryColor + '0.6)');
      coreGrad.addColorStop(0.7, primaryColor + '0.2)');
      coreGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(center, center, dynamicRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner high-density white/cyan center
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(center, center, dynamicRadius * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 6. Crosshair reticles
      ctx.strokeStyle = primaryColor + '0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(center - center * 0.2, center);
      ctx.lineTo(center + center * 0.2, center);
      ctx.moveTo(center, center - center * 0.2);
      ctx.lineTo(center, center + center * 0.2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, size, lowPowerMode]);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Ativar núcleo neural por voz"
      className="relative flex items-center justify-center cursor-pointer select-none group transition-transform active:scale-95 focus:outline-none"
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="transition-opacity duration-300"
      />
      {/* State label overlay at bottom of core */}
      <div className="absolute -bottom-2 px-3 py-1 bg-slate-950/90 border border-cyan-500/30 rounded-full text-[11px] font-mono tracking-wider text-cyan-300 shadow-lg backdrop-blur-sm pointer-events-none uppercase">
        {state === 'idle' && 'ONLINE // STANDBY'}
        {state === 'listening' && 'OUVINDO...'}
        {state === 'processing' && 'PROCESSANDO'}
        {state === 'speaking' && 'RESPONDENDO'}
      </div>
    </div>
  );
};
