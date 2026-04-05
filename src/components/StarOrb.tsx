import { useMemo } from "react";
import { cn } from "@/lib/utils";

type OrbState = "idle" | "listening" | "speaking";

interface StarOrbProps {
  state: OrbState;
  onClick: () => void;
}

const StarOrb = ({ state, onClick }: StarOrbProps) => {
  const stars = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => {
      const angle = (i / 120) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const baseRadius = 55 + (Math.random() - 0.5) * 25;
      const size = Math.random() * 2.5 + 1;
      const delay = Math.random() * 1.5;
      const expandAmount = 8 + Math.random() * 16; // how far each star expands

      return { id: i, angle, baseRadius, size, delay, expandAmount };
    });
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative w-48 h-48 cursor-pointer focus:outline-none"
      aria-label="Ativar assistente de voz"
    >
      {stars.map((star) => {
        const cx = 96; // center of 192px (w-48)
        const cy = 96;
        const x = cx + Math.cos(star.angle) * star.baseRadius;
        const y = cy + Math.sin(star.angle) * star.baseRadius;
        // expand direction
        const ex = Math.cos(star.angle) * star.expandAmount;
        const ey = Math.sin(star.angle) * star.expandAmount;

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
              transition: state !== "speaking" ? "transform 0.6s ease, box-shadow 0.4s ease, background-color 0.3s ease" : undefined,
              transform: state === "speaking" ? undefined : "translate(0, 0)",
              animation: state === "speaking"
                ? `star-expand-${star.id} 0.9s ease-in-out ${star.delay}s infinite alternate`
                : undefined,
            }}
          />
        );
      })}

      {/* Inject per-star keyframes for speaking */}
      {state === "speaking" && (
        <style>
          {stars.map(
            (star) => `
              @keyframes star-expand-${star.id} {
                0% { transform: translate(0, 0); }
                100% { transform: translate(${Math.cos(star.angle) * star.expandAmount}px, ${Math.sin(star.angle) * star.expandAmount}px); }
              }
            `
          ).join("")}
        </style>
      )}

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
