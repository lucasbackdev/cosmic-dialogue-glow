import { useMemo, useRef, useCallback, useEffect } from "react";

type OrbState = "idle" | "listening" | "speaking";

interface StarOrbProps {
  state: OrbState;
  onClick: () => void;
  /** 0-1 audio intensity for voice-reactive pulsing */
  audioLevel?: number;
}

const ORB_SIZE = 320;
const CENTER = ORB_SIZE / 2;
const SPHERE_RADIUS = 110;
const STAR_COUNT = 300;
const DPR = typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1;

interface Star {
  px: number; py: number; pz: number;
  size: number;
  twinkleOffset: number;
  twinkleSpeed: number;
  driftAngle: number;
  driftSpeed: number;
  driftAmount: number;
}

const StarOrb = ({ state, onClick, audioLevel = 0 }: StarOrbProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const dragStarted = useRef(false);
  const stateRef = useRef(state);
  const audioLevelRef = useRef(audioLevel);
  const speakingBlend = useRef(0);
  stateRef.current = state;
  audioLevelRef.current = audioLevel;

  const stars = useMemo<Star[]>(() => {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    return Array.from({ length: STAR_COUNT }, (_, i) => {
      const y = 1 - (i / (STAR_COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      return {
        px: Math.cos(theta) * r * SPHERE_RADIUS,
        py: y * SPHERE_RADIUS,
        pz: Math.sin(theta) * r * SPHERE_RADIUS,
        size: 1 + Math.random() * 2,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 1.5,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: 0.3 + Math.random() * 0.7,
        driftAmount: 3 + Math.random() * 6,
      };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = ORB_SIZE * DPR;
    canvas.height = ORB_SIZE * DPR;
    ctx.scale(DPR, DPR);

    let frameId = 0;
    const friction = 0.97;
    const perspective = 500;

    const draw = (time: number) => {
      const currentState = stateRef.current;
      const level = audioLevelRef.current;

      if (!isDragging.current) {
        if (Math.abs(velRef.current.x) > 0.1 || Math.abs(velRef.current.y) > 0.1) {
          velRef.current.x *= friction;
          velRef.current.y *= friction;
          rotRef.current.x += velRef.current.x * (1 / 60);
          rotRef.current.y += velRef.current.y * (1 / 60);
        }
      }

      const toRad = Math.PI / 180;
      const cosRx = Math.cos(rotRef.current.x * toRad);
      const sinRx = Math.sin(rotRef.current.x * toRad);
      const cosRy = Math.cos(rotRef.current.y * toRad);
      const sinRy = Math.sin(rotRef.current.y * toRad);

      ctx.clearRect(0, 0, ORB_SIZE, ORB_SIZE);

      const isSpeaking = currentState === "speaking";
      const isListening = currentState === "listening";

      // Smooth blend factor: eases in/out over ~1 second
      const targetBlend = isSpeaking ? 1 : 0;
      speakingBlend.current += (targetBlend - speakingBlend.current) * 0.02;
      const blend = speakingBlend.current;

      const baseColor = isSpeaking ? [59, 130, 246] : isListening ? [0, 120, 255] : [30, 100, 255];
      const glowColor = isSpeaking ? "59,130,246" : isListening ? "0,120,255" : "30,100,255";

      // Smooth breathing pulse, scaled by blend
      const breathe = blend * (0.5 + 0.5 * Math.sin(time * 0.002));

      const voicePulse = blend * (0.3 + level * 0.7 * (0.6 + 0.4 * Math.sin(time * 0.008 + 1.3)));

      const listenPulse = isListening
        ? 0.5 + 0.5 * Math.sin(time * 0.003)
        : 0;

      const projected: { sx: number; sy: number; depth: number; size: number; alpha: number }[] = [];

      for (const star of stars) {
        let spx = star.px;
        let spy = star.py;
        let spz = star.pz;

        if (!isSpeaking) {
          const driftT = time * 0.001 * star.driftSpeed;
          const dx = Math.cos(star.driftAngle) * Math.sin(driftT) * star.driftAmount;
          const dy = Math.sin(star.driftAngle) * Math.cos(driftT * 0.7) * star.driftAmount;
          const dz = Math.sin(driftT * 0.5 + star.twinkleOffset) * star.driftAmount * 0.5;
          spx += dx;
          spy += dy;
          spz += dz;
        }

        if (isSpeaking) {
          const len = Math.sqrt(spx * spx + spy * spy + spz * spz) || 1;
          const nx = spx / len, ny = spy / len, nz = spz / len;
          // Smooth breathing: stars expand and contract together
          const breatheAmount = breathe * 25;
          const pulseAmount = voicePulse * 10 * (0.5 + 0.5 * Math.sin(time * 0.005 + star.twinkleOffset));
          spx += nx * (breatheAmount + pulseAmount);
          spy += ny * (breatheAmount + pulseAmount);
          spz += nz * (breatheAmount + pulseAmount);
        }

        if (isListening) {
          const len = Math.sqrt(spx * spx + spy * spy + spz * spz) || 1;
          const nx = spx / len, ny = spy / len, nz = spz / len;
          spx += nx * listenPulse * 5;
          spy += ny * listenPulse * 5;
          spz += nz * listenPulse * 5;
        }

        const x1 = spx * cosRy + spz * sinRy;
        const z1 = -spx * sinRy + spz * cosRy;
        const y2 = spy * cosRx - z1 * sinRx;
        const z2 = spy * sinRx + z1 * cosRx;

        const scale = perspective / (perspective + z2);
        const screenX = CENTER + x1 * scale;
        const screenY = CENTER + y2 * scale;
        const depth = (z2 + SPHERE_RADIUS) / (2 * SPHERE_RADIUS);
        const twinkle = 0.6 + 0.4 * Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset);
        const alpha = (0.1 + depth * 0.9) * twinkle;

        const finalAlpha = isSpeaking ? Math.min(1, alpha + breathe * 0.3 + voicePulse * 0.4) : alpha;

        projected.push({ sx: screenX, sy: screenY, depth, size: star.size * scale, alpha: finalAlpha });
      }

      projected.sort((a, b) => a.depth - b.depth);

      for (const p of projected) {
        const r = isSpeaking ? p.size * (1 + voicePulse * 0.5) : p.size;
        const glowR = r * (isSpeaking ? 4 : 3);

        const grad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowR);
        grad.addColorStop(0, `rgba(${glowColor},${p.alpha * 0.5})`);
        grad.addColorStop(1, `rgba(${glowColor},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(p.sx - glowR, p.sy - glowR, glowR * 2, glowR * 2);

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${p.alpha})`;
        ctx.fill();
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [stars]);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    dragStarted.current = false;
    const pos = "touches" in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
    lastPos.current = pos;
    lastTime.current = performance.now();
    velRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const pos = "touches" in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
      const dx = pos.x - lastPos.current.x;
      const dy = pos.y - lastPos.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragStarted.current = true;
      const now = performance.now();
      const dt = Math.max(now - lastTime.current, 1);
      velRef.current = { x: (-dy / dt) * 300, y: (dx / dt) * 300 };
      rotRef.current.x += -dy * 0.3;
      rotRef.current.y += dx * 0.3;
      lastPos.current = pos;
      lastTime.current = now;
    };
    const handleUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (dragStarted.current) { e.preventDefault(); return; }
    onClick();
  }, [onClick]);

  return (
    <div className="relative" style={{ width: `${ORB_SIZE}px`, height: `${ORB_SIZE}px` }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onClick={handleClick}
        className="cursor-grab active:cursor-grabbing touch-none"
        style={{ width: `${ORB_SIZE}px`, height: `${ORB_SIZE}px` }}
      />
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-muted-foreground whitespace-nowrap">
        {state === "listening" && "Ouvindo..."}
        {state === "speaking" && "Respondendo..."}
      </span>
    </div>
  );
};

export default StarOrb;
