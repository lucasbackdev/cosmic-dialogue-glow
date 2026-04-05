import { useMemo } from "react";
import { cn } from "@/lib/utils";

type OrbState = "idle" | "listening" | "speaking";

interface StarOrbProps {
  state: OrbState;
  onClick: () => void;
}

const ORB_SIZE = 320; // px
const CENTER = ORB_SIZE / 2;

const StarOrb = ({ state, onClick }: StarOrbProps) => {
  const stars = useMemo(() => {
    return Array.from({ length: 150 }, (_, i) => {
      const angle = (i / 150) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const baseRadius = 90 + (Math.random() - 0.5) * 40;
      const size = Math.random() * 2.8 + 1;
      const delay = Math.random() * 4;
      const expandAmount = 10 + Math.random() * 20;
      // idle drift: small gentle movement
      const idleDrift = 3 + Math.random() * 5;

      return { id: i, angle, baseRadius, size, delay, expandAmount, idleDrift };
    });
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative cursor-pointer focus:outline-none"
      style={{ width: `${ORB_SIZE}px`, height: `${ORB_SIZE}px` }}
      aria-label="Ativar assistente de voz"
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

      {/* Keyframes for all states */}
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

      {/* Label */}
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-muted-foreground whitespace-nowrap">
        {state === "idle" && "Toque para falar"}
        {state === "listening" && "Ouvindo..."}
        {state === "speaking" && "Respondendo..."}
      </span>
    </button>
  );
};

export default StarOrb;
