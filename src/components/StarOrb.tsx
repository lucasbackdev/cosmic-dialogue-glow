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
      const radius = 50 + (Math.random() - 0.5) * 20;
      return {
        id: i,
        angle,
        radius,
        size: Math.random() * 2.5 + 1,
        delay: Math.random() * 1.5,
      };
    });
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative w-48 h-48 rounded-full cursor-pointer focus:outline-none"
    >
      {stars.map((star) => {
        const baseX = Math.cos(star.angle) * star.radius;
        const baseY = Math.sin(star.angle) * star.radius;

        return (
          <div
            key={star.id}
            className={cn(
              "absolute rounded-full bg-foreground",
              state === "speaking" && "animate-[star-breathe_0.9s_ease-in-out_infinite]"
            )}
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `calc(50% + ${baseX}px)`,
              top: `calc(50% + ${baseY}px)`,
              translate: "-50% -50%",
              animationDelay: state === "speaking" ? `${star.delay}s` : undefined,
              // idle glow
              boxShadow:
                state === "idle"
                  ? `0 0 ${star.size * 2}px hsl(var(--orb-glow) / 0.4)`
                  : `0 0 ${star.size * 3}px hsl(var(--orb-glow) / 0.6)`,
              transition: "box-shadow 0.4s ease",
            }}
          />
        );
      })}

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
