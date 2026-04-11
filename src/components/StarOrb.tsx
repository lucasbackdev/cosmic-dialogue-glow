import { useRef, useEffect, useCallback } from "react";

type OrbState = "idle" | "listening" | "speaking";

interface StarOrbProps {
  state: OrbState;
  onClick: () => void;
  audioLevel?: number;
}

const ORB_SIZE = 280;
const CENTER = ORB_SIZE / 2;
const RADIUS = 120;
const DPR = typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1;

const StarOrb = ({ state, onClick, audioLevel = 0 }: StarOrbProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const audioRef = useRef(audioLevel);
  stateRef.current = state;
  audioRef.current = audioLevel;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = ORB_SIZE * DPR;
    canvas.height = ORB_SIZE * DPR;
    ctx.scale(DPR, DPR);

    // Pre-generate cloud noise offsets
    const clouds = Array.from({ length: 8 }, (_, i) => ({
      cx: Math.random() * 0.6 - 0.3,
      cy: Math.random() * 0.6 - 0.3,
      r: 0.3 + Math.random() * 0.4,
      speed: 0.0003 + Math.random() * 0.0005,
      phase: Math.random() * Math.PI * 2,
      hue: 200 + Math.random() * 20,
      sat: 60 + Math.random() * 30,
      light: 75 + Math.random() * 15,
    }));

    let frameId = 0;

    const draw = (time: number) => {
      const currentState = stateRef.current;
      const level = audioRef.current;

      ctx.clearRect(0, 0, ORB_SIZE, ORB_SIZE);

      // Pulse effect
      const pulse = currentState === "speaking"
        ? 1 + level * 0.08 + Math.sin(time * 0.006) * 0.02
        : currentState === "listening"
          ? 1 + Math.sin(time * 0.003) * 0.03
          : 1 + Math.sin(time * 0.002) * 0.01;

      const r = RADIUS * pulse;

      // Outer glow
      const glowAlpha = currentState === "speaking" ? 0.15 + level * 0.1 : 0.1;
      const glow = ctx.createRadialGradient(CENTER, CENTER, r * 0.8, CENTER, CENTER, r * 1.5);
      glow.addColorStop(0, `hsla(210, 80%, 85%, ${glowAlpha})`);
      glow.addColorStop(1, "hsla(210, 80%, 85%, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, ORB_SIZE, ORB_SIZE);

      // Clip to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, r, 0, Math.PI * 2);
      ctx.clip();

      // Base gradient — soft white-blue
      const base = ctx.createRadialGradient(
        CENTER - r * 0.3, CENTER - r * 0.3, 0,
        CENTER, CENTER, r
      );
      base.addColorStop(0, "hsl(200, 30%, 97%)");
      base.addColorStop(0.5, "hsl(205, 60%, 88%)");
      base.addColorStop(1, "hsl(215, 70%, 75%)");
      ctx.fillStyle = base;
      ctx.fillRect(CENTER - r, CENTER - r, r * 2, r * 2);

      // Cloud layers
      for (const c of clouds) {
        const t = time * c.speed + c.phase;
        const cx = CENTER + (c.cx + Math.sin(t) * 0.1) * r;
        const cy = CENTER + (c.cy + Math.cos(t * 0.7) * 0.1) * r;
        const cr = c.r * r;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        const alpha = currentState === "speaking"
          ? 0.35 + level * 0.2
          : 0.3 + Math.sin(t * 2) * 0.05;
        grad.addColorStop(0, `hsla(${c.hue}, ${c.sat}%, ${c.light}%, ${alpha})`);
        grad.addColorStop(0.6, `hsla(${c.hue}, ${c.sat}%, ${c.light}%, ${alpha * 0.3})`);
        grad.addColorStop(1, `hsla(${c.hue}, ${c.sat}%, ${c.light}%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
      }

      // Inner highlight — top-left shine
      const shine = ctx.createRadialGradient(
        CENTER - r * 0.35, CENTER - r * 0.35, 0,
        CENTER - r * 0.2, CENTER - r * 0.2, r * 0.7
      );
      shine.addColorStop(0, "hsla(0, 0%, 100%, 0.6)");
      shine.addColorStop(0.5, "hsla(0, 0%, 100%, 0.15)");
      shine.addColorStop(1, "hsla(0, 0%, 100%, 0)");
      ctx.fillStyle = shine;
      ctx.fillRect(CENTER - r, CENTER - r, r * 2, r * 2);

      ctx.restore();

      // Subtle border
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, r, 0, Math.PI * 2);
      ctx.strokeStyle = "hsla(210, 40%, 80%, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleClick = useCallback(() => onClick(), [onClick]);

  return (
    <div className="relative" style={{ width: `${ORB_SIZE}px`, height: `${ORB_SIZE}px` }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="cursor-pointer"
        style={{ width: `${ORB_SIZE}px`, height: `${ORB_SIZE}px` }}
      />
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground whitespace-nowrap">
        {state === "idle" && "Toque para falar"}
        {state === "listening" && "Ouvindo..."}
        {state === "speaking" && "Respondendo..."}
      </span>
    </div>
  );
};

export default StarOrb;
