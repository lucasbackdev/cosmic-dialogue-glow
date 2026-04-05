import { useMemo, useRef, useCallback, useEffect } from "react";

type OrbState = "idle" | "listening" | "speaking";

interface StarOrbProps {
  state: OrbState;
  onClick: () => void;
}

const ORB_SIZE = 320;
const CENTER = ORB_SIZE / 2;
const SPHERE_RADIUS = 110;
const STAR_COUNT = 300;
const DPR = typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1;

interface Star {
  px: number; py: number; pz: number;
  size: number; twinkleOffset: number; twinkleSpeed: number;
}

const StarOrb = ({ state, onClick }: StarOrbProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const dragStarted = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

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
      };
    });
  }, []);

  // Render loop on canvas
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
      // Inertia
      if (!isDragging.current) {
        if (Math.abs(velRef.current.x) > 0.1 || Math.abs(velRef.current.y) > 0.1) {
          velRef.current.x *= friction;
          velRef.current.y *= friction;
          rotRef.current.x += velRef.current.x * (1 / 60);
          rotRef.current.y += velRef.current.y * (1 / 60);
        }
      }

      const toRad = Math.PI / 180;
      const cx = Math.cos(rotRef.current.x * toRad);
      const sx = Math.sin(rotRef.current.x * toRad);
      const cy = Math.cos(rotRef.current.y * toRad);
      const sy = Math.sin(rotRef.current.y * toRad);

      ctx.clearRect(0, 0, ORB_SIZE, ORB_SIZE);

      const isSpeaking = stateRef.current === "speaking";
      const baseColor = isSpeaking ? [59, 130, 246] : [210, 220, 240]; // primary blue vs foreground
      const glowColor = isSpeaking ? "59,130,246" : "150,170,220";

      // Project and sort
      const projected: { sx: number; sy: number; depth: number; size: number; twinkle: number }[] = [];
      for (const star of stars) {
        const x1 = star.px * cy + star.pz * sy;
        const z1 = -star.px * sy + star.pz * cy;
        const y2 = star.py * cx - z1 * sx;
        const z2 = star.py * sx + z1 * cx;

        const scale = perspective / (perspective + z2);
        const screenX = CENTER + x1 * scale;
        const screenY = CENTER + y2 * scale;
        const depth = (z2 + SPHERE_RADIUS) / (2 * SPHERE_RADIUS);
        const twinkle = 0.6 + 0.4 * Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset);

        projected.push({ sx: screenX, sy: screenY, depth, size: star.size * scale, twinkle });
      }

      projected.sort((a, b) => a.depth - b.depth);

      for (const p of projected) {
        const alpha = (0.1 + p.depth * 0.9) * p.twinkle;
        const r = p.size;
        const glowR = r * (isSpeaking ? 4 : 3);

        // Glow
        const grad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowR);
        grad.addColorStop(0, `rgba(${glowColor},${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(${glowColor},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(p.sx - glowR, p.sy - glowR, glowR * 2, glowR * 2);

        // Star dot
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${alpha})`;
        ctx.fill();
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [stars]);

  // Mouse handlers
  const handlePointerDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStarted.current = false;
    lastPos.current = { x: e.clientX, y: e.clientY };
    lastTime.current = performance.now();
    velRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragStarted.current = true;
      const now = performance.now();
      const dt = Math.max(now - lastTime.current, 1);
      velRef.current = { x: (-dy / dt) * 300, y: (dx / dt) * 300 };
      rotRef.current.x += -dy * 0.3;
      rotRef.current.y += dx * 0.3;
      lastPos.current = { x: e.clientX, y: e.clientY };
      lastTime.current = now;
    };
    const handleUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
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
        onClick={handleClick}
        className="cursor-grab active:cursor-grabbing"
        style={{ width: `${ORB_SIZE}px`, height: `${ORB_SIZE}px` }}
      />
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-muted-foreground whitespace-nowrap">
        {state === "idle" && "Toque para falar"}
        {state === "listening" && "Ouvindo..."}
        {state === "speaking" && "Respondendo..."}
      </span>
    </div>
  );
};

export default StarOrb;
