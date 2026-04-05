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
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);
  const lastTime = useRef(0);
  const animFrameRef = useRef<number>(0);
  const dragStarted = useRef(false);

  const getAngle = useCallback((e: MouseEvent | React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx);
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStarted.current = false;
    lastAngle.current = getAngle(e);
    lastTime.current = performance.now();
    velocityRef.current = 0;
  }, [getAngle]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const angle = getAngle(e);
      let delta = angle - lastAngle.current;
      // Normalize delta
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      if (Math.abs(delta) > 0.01) dragStarted.current = true;

      const now = performance.now();
      const dt = Math.max(now - lastTime.current, 1);
      velocityRef.current = (delta / dt) * 1000; // rad/s

      rotationRef.current += delta * (180 / Math.PI);
      setRotation(rotationRef.current);

      lastAngle.current = angle;
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
  }, [getAngle]);

  // Inertia animation
  useEffect(() => {
    const friction = 0.97;
    const tick = () => {
      if (!isDragging.current && Math.abs(velocityRef.current) > 0.5) {
        velocityRef.current *= friction;
        rotationRef.current += velocityRef.current * (1 / 60) * (180 / Math.PI);
        setRotation(rotationRef.current);
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
    const result = [];
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
      const baseRadius = Math.random() * 70; // fill 0-70px radius
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
      style={{ width: `${ORB_SIZE}px`, height: `${ORB_SIZE}px` }}
      aria-label="Ativar assistente de voz"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `rotate(${rotation}deg)`,
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
