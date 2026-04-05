import { cn } from "@/lib/utils";

type OrbState = "idle" | "listening" | "speaking";

interface AIOrbProps {
  state: OrbState;
  onClick: () => void;
}

const AIOrb = ({ state, onClick }: AIOrbProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-40 h-40 rounded-full cursor-pointer transition-all duration-300",
        "bg-gradient-to-br from-primary to-[hsl(var(--orb-inner))]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        state === "idle" && "animate-[orb-pulse_3s_ease-in-out_infinite]",
        state === "speaking" && "animate-[orb-speaking_0.8s_ease-in-out_infinite]",
        state === "listening" && "animate-[orb-listening_1.2s_ease-in-out_infinite]",
      )}
    >
      {/* Inner glow */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-foreground/20 to-transparent" />

      {/* Label */}
      <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-muted-foreground whitespace-nowrap">
        {state === "idle" && "Toque para falar"}
        {state === "listening" && "Ouvindo..."}
        {state === "speaking" && "Respondendo..."}
      </span>
    </button>
  );
};

export default AIOrb;
