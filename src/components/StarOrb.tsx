import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

type OrbState = "idle" | "listening" | "speaking";

interface StarOrbProps {
  state: OrbState;
  onClick: () => void;
}

const ORB_SIZE = 320;
const CENTER = ORB_SIZE / 2;

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

      // dx rotates around Y axis, dy rotates around X axis
      velRef.current = {
        x: (-dy / dt) * 1000 * 0.3,
        y: (dx / dt) * 1000 * 0.3,
      };

      rotRef.current.x += -dy * 0.3;
      rotRef.current.y += dx * 0.3;
      setRotX(rotRef.current.x);
      setRotY(rotRef.current.y);

      lastPos.current = { x: e.clientX, y: e.clientY };
      lastTime.current = now;
    };

    const handleUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  // Inertia
  useEffect(() => {
    const friction = 0.96;
    const tick = () => {
      if (!isDragging.current) {
        const vx = velRef.current.x;
        const vy = velRef.current.y;
        if (Math.abs(vx) > 0.3 || Math.abs(vy) > 0.3) {
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
    if (dragStarted.current) {
      e.preventDefault();
      return;
    }
    onClick();
  }, [onClick]);

  const stars = useMemo(() => {
    const result: Array<{
      id: number; angle: number; baseRadius: number; size: number;
      delay: number; expandAmount: number; idleDrift: number;
    }> = [];
    let id = 0;

    // Ring stars
    for (let i = 0; i < 150; i++) {
      const angle = (i / 150) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const baseRadius = 90 + (Math.random() - 0.5) * 40;
      const size = Math.random() * 2.8 + 1;
      const delay = Math.random() * 4;
      const expandAmount = 10 + Math.random() * 20;
      const idleDrift = 3 + Math.random() * 5;
      result.push({ id: id++, angle, baseRadius, size, delay, expandAmount, idleDrift });
    }

    // Center fill stars
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const baseRadius = Math.random() * 70;
      const size = Math.random() * 2.2 + 0.6;
      const delay = Math.random() * 4;
      const expandAmount = 5 + Math.random() * 10;
      const idleDrift = 2 + Math.random() * 3;
      result.push({ id: id++, angle, baseRadius, size, delay, expandAmount, idleDrift });
    }

    return result;
  }, []);

  return (
    <button
      ref={containerRef}
      onMouseDown={handlePointerDown}
      onClick={handleClick}
      className="relative cursor-grab active:cursor-grabbing focus:outline-none"
      style={{
        width: `${ORB_SIZE}px`,
        height: `${ORB_SIZE}px`,
        perspective: "800px",
      }}
      aria-label="Ativar assistente de voz"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transformStyle: "preserve-3d",
          position: "relative",
        }}
      >
        {stars.map((star) => {
          const x = CENTER + Math.cos(star.angle) * star.baseRadius;
          const y = CENTER + Math.sin(star.angle) * star.baseRadius;

          const animName = state === "speaking"
            ? `star-expand-${star.id}`
            : `star-idle-${star.id}`;
          const animDuration = state === "speaking" ? "0.9s" : "4s";

          return (
            <div
              key={star.id}
              className={cn(
                "absolute rounded-full",
                state === "speaking" ? "bg-primary" : "bg-foreground"
              )}
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${x}px`,
                top: `${y}px`,
                boxShadow: `0 0 ${star.size * 2}px hsl(var(--orb-glow) / ${state === "speaking" ? 0.7 : 0.3})`,
                animation: `${animName} ${animDuration} ease-in-out ${star.delay}s infinite alternate`,
              }}
            />
          );
        })}
      </div>

      <style>
        {stars.map((star) => {
          const dx = Math.cos(star.angle);
          const dy = Math.sin(star.angle);
          return `
            @keyframes star-idle-${star.id} {
              0% { transform: translate(0, 0); }
              100% { transform: translate(${dx * star.idleDrift}px, ${dy * star.idleDrift}px); }
            }
            @keyframes star-expand-${star.id} {
              0% { transform: translate(0, 0); }
              100% { transform: translate(${dx * star.expandAmount}px, ${dy * star.expandAmount}px); }
            }
          `;
        }).join("")}
      </style>

      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-muted-foreground whitespace-nowrap">
        {state === "idle" && "Toque para falar"}
        {state === "listening" && "Ouvindo..."}
        {state === "speaking" && "Respondendo..."}
      </span>
    </button>
  );
};

export default StarOrb;
