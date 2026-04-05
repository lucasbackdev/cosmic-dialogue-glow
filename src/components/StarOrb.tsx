import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

type OrbState = "idle" | "listening" | "speaking";

interface StarOrbProps {
  state: OrbState;
  onClick: () => void;
}

const ORB_SIZE = 320;
const CENTER = ORB_SIZE / 2;
const SPHERE_RADIUS = 110;

const StarOrb = ({ state, onClick }: StarOrbProps) => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const rotRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const animFrameRef = useRef<number>(0);
  const dragStarted = useRef(false);

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
      setRotX(rotRef.current.x);
      setRotY(rotRef.current.y);
      lastPos.current = { x: e.clientX, y: e.clientY };
      lastTime.current = now;
    };
    const handleUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, []);

  useEffect(() => {
    const friction = 0.96;
    const tick = () => {
      if (!isDragging.current) {
        if (Math.abs(velRef.current.x) > 0.3 || Math.abs(velRef.current.y) > 0.3) {
          velRef.current.x *= friction;
          velRef.current.y *= friction;
          rotRef.current.x += velRef.current.x * (1 / 60);
          rotRef.current.y += velRef.current.y * (1 / 60);
          setRotX(rotRef.current.x);
          setRotY(rotRef.current.y);
        }
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (dragStarted.current) { e.preventDefault(); return; }
    onClick();
  }, [onClick]);

  // Generate stars on a sphere using fibonacci distribution
  const stars = useMemo(() => {
    const count = 300;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    return Array.from({ length: count }, (_, i) => {
      const y = 1 - (i / (count - 1)) * 2; // -1 to 1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const px = Math.cos(theta) * radiusAtY * SPHERE_RADIUS;
      const py = y * SPHERE_RADIUS;
      const pz = Math.sin(theta) * radiusAtY * SPHERE_RADIUS;
      const size = 1 + Math.random() * 2;
      const twinkleDelay = Math.random() * 3;
      const twinkleDuration = 2 + Math.random() * 3;
      return { id: i, px, py, pz, size, twinkleDelay, twinkleDuration };
    });
  }, []);

  // Project 3D → 2D with rotation
  const toRad = Math.PI / 180;
  const cosX = Math.cos(rotX * toRad);
  const sinX = Math.sin(rotX * toRad);
  const cosY = Math.cos(rotY * toRad);
  const sinY = Math.sin(rotY * toRad);

  const projected = stars.map((star) => {
    // Rotate around Y
    let x1 = star.px * cosY + star.pz * sinY;
    let z1 = -star.px * sinY + star.pz * cosY;
    let y1 = star.py;
    // Rotate around X
    let y2 = y1 * cosX - z1 * sinX;
    let z2 = y1 * sinX + z1 * cosX;
    let x2 = x1;

    const perspective = 600;
    const scale = perspective / (perspective + z2);
    const screenX = CENTER + x2 * scale;
    const screenY = CENTER + y2 * scale;
    const depth = (z2 + SPHERE_RADIUS) / (2 * SPHERE_RADIUS); // 0 (back) to 1 (front)

    return { ...star, screenX, screenY, depth, scale, z2 };
  });

  // Sort by depth for proper layering
  projected.sort((a, b) => a.z2 - b.z2);

  return (
    <button
      ref={containerRef}
      onMouseDown={handlePointerDown}
      onClick={handleClick}
      className="relative cursor-grab active:cursor-grabbing focus:outline-none"
      style={{ width: `${ORB_SIZE}px`, height: `${ORB_SIZE}px` }}
      aria-label="Ativar assistente de voz"
    >
      <div className="relative w-full h-full">
        {projected.map((star) => {
          const opacity = 0.15 + star.depth * 0.85;
          const sz = star.size * star.scale;
          const glowIntensity = state === "speaking" ? 0.8 : 0.4;
          const glowSize = sz * (state === "speaking" ? 3 : 2);

          return (
            <div
              key={star.id}
              className={cn(
                "absolute rounded-full",
                state === "speaking" ? "bg-primary" : "bg-foreground"
              )}
              style={{
                width: `${sz}px`,
                height: `${sz}px`,
                left: `${star.screenX}px`,
                top: `${star.screenY}px`,
                opacity,
                boxShadow: `0 0 ${glowSize}px hsl(var(--orb-glow) / ${glowIntensity * opacity})`,
                animation: `twinkle ${star.twinkleDuration}s ease-in-out ${star.twinkleDelay}s infinite alternate`,
                transform: "translate(-50%, -50%)",
              }}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes twinkle {
          0% { opacity: var(--tw-opacity, 1); transform: translate(-50%, -50%) scale(1); }
          100% { opacity: calc(var(--tw-opacity, 1) * 0.5); transform: translate(-50%, -50%) scale(0.7); }
        }
      `}</style>

      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-muted-foreground whitespace-nowrap">
        {state === "idle" && "Toque para falar"}
        {state === "listening" && "Ouvindo..."}
        {state === "speaking" && "Respondendo..."}
      </span>
    </button>
  );
};

export default StarOrb;
