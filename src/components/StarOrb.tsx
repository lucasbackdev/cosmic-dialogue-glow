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

// Simplex-like noise using layered sine waves
function fbm(x: number, y: number, t: number): number {
  let v = 0;
  v += 0.5 * Math.sin(x * 1.2 + t * 0.4 + Math.sin(y * 0.8 + t * 0.3));
  v += 0.25 * Math.sin(x * 2.5 - t * 0.6 + y * 1.8);
  v += 0.125 * Math.sin(x * 4.1 + t * 0.8 - y * 3.2 + Math.sin(t * 0.5));
  v += 0.0625 * Math.sin(x * 7.3 - t * 1.1 + y * 5.5);
  return v;
}

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

    // Off-screen buffer for the cloud texture
    const buf = document.createElement("canvas");
    buf.width = ORB_SIZE;
    buf.height = ORB_SIZE;
    const bctx = buf.getContext("2d")!;

    let frameId = 0;
    const step = 4; // pixel step for performance

    const draw = (time: number) => {
      const t = time * 0.001;
      const currentState = stateRef.current;
      const level = audioRef.current;

      // Speed multiplier: idle = slow drift, speaking = energetic
      const speed = currentState === "speaking"
        ? 1.8 + level * 2.5
        : currentState === "listening"
          ? 1.2
          : 1.0;

      // Distortion amount: speaking = turbulent
      const distortion = currentState === "speaking"
        ? 0.4 + level * 0.8
        : currentState === "listening"
          ? 0.15
          : 0.0;

      const st = t * speed;

      // Draw cloud texture into buffer
      const imgData = bctx.createImageData(ORB_SIZE, ORB_SIZE);
      const data = imgData.data;

      for (let py = 0; py < ORB_SIZE; py += step) {
        for (let px = 0; px < ORB_SIZE; px += step) {
          // Distance from center (normalized)
          const dx = (px - CENTER) / RADIUS;
          const dy = (py - CENTER) / RADIUS;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 1.05) continue; // outside circle

          // UV coordinates with distortion
          let u = dx + distortion * Math.sin(st * 2 + dy * 3);
          let v = dy + distortion * Math.cos(st * 1.7 + dx * 3);

          // Layered noise for cloud pattern
          const n1 = fbm(u * 2, v * 2, st);
          const n2 = fbm(u * 3 + 5.2, v * 3 + 1.3, st * 0.7);
          const cloud = (n1 + n2) * 0.5; // -1 to 1 range roughly

          // Map to colors: bright white-blue at top-right, deeper blue at bottom-left
          // Diagonal gradient factor
          const diag = (-dx + -dy) * 0.5; // -1 (top-right) to 1 (bottom-left)
          const gradientFactor = diag * 0.5 + 0.5; // 0 (top-right) to 1 (bottom-left)

          // Cloud brightness (0-1)
          const brightness = 0.5 + cloud * 0.5;

          // Blue channel: always strong
          // Green: less in deep areas
          // Red: less in deep areas
          const deepBlue = gradientFactor * (1 - brightness * 0.3);

          // Interpolate between white-ish and sky blue based on depth + cloud
          const r = Math.floor(180 + (1 - deepBlue) * 75 + brightness * (1 - gradientFactor) * 50);
          const g = Math.floor(210 + (1 - deepBlue) * 45 + brightness * (1 - gradientFactor) * 30);
          const b = Math.floor(235 + (1 - deepBlue * 0.3) * 20);

          // Clamp
          const cr = Math.min(255, Math.max(0, r));
          const cg = Math.min(255, Math.max(0, g));
          const cb = Math.min(255, Math.max(0, b));

          // Edge fade
          const edgeFade = dist > 0.92 ? Math.max(0, 1 - (dist - 0.92) / 0.13) : 1;
          const alpha = Math.floor(edgeFade * 255);

          // Fill step x step block
          for (let sy = 0; sy < step && py + sy < ORB_SIZE; sy++) {
            for (let sx = 0; sx < step && px + sx < ORB_SIZE; sx++) {
              const idx = ((py + sy) * ORB_SIZE + (px + sx)) * 4;
              data[idx] = cr;
              data[idx + 1] = cg;
              data[idx + 2] = cb;
              data[idx + 3] = alpha;
            }
          }
        }
      }

      bctx.putImageData(imgData, 0, 0);

      // Clear main canvas and draw
      ctx.clearRect(0, 0, ORB_SIZE, ORB_SIZE);

      // Outer glow
      const glowAlpha = currentState === "speaking" ? 0.12 + level * 0.1 : 0.06;
      const glow = ctx.createRadialGradient(CENTER, CENTER, RADIUS * 0.9, CENTER, CENTER, RADIUS * 1.4);
      glow.addColorStop(0, `hsla(210, 80%, 75%, ${glowAlpha})`);
      glow.addColorStop(1, "hsla(210, 80%, 75%, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, ORB_SIZE, ORB_SIZE);

      // Draw cloud sphere (clipped circle)
      ctx.save();
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(buf, 0, 0);

      // Inner highlight on top-right
      const shine = ctx.createRadialGradient(
        CENTER + RADIUS * 0.25, CENTER - RADIUS * 0.3, 0,
        CENTER + RADIUS * 0.15, CENTER - RADIUS * 0.2, RADIUS * 0.8
      );
      shine.addColorStop(0, "hsla(40, 60%, 97%, 0.5)");
      shine.addColorStop(0.4, "hsla(200, 40%, 95%, 0.15)");
      shine.addColorStop(1, "hsla(200, 40%, 90%, 0)");
      ctx.fillStyle = shine;
      ctx.fillRect(0, 0, ORB_SIZE, ORB_SIZE);

      ctx.restore();

      // Subtle edge ring
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = "hsla(210, 50%, 80%, 0.2)";
      ctx.lineWidth = 0.5;
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
