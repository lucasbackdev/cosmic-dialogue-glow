import { Loader2 } from "lucide-react";

const THINKING_PHRASES = [
  "Processando sua solicitação...",
  "Analisando dados...",
  "Gerando resposta...",
];

const AIThinkingIndicator = () => {
  return (
    <div className="w-full flex justify-start animate-fade-in">
      <div className="w-full max-w-[85%] md:max-w-[35%]">
        <div className="relative overflow-hidden rounded-xl bg-card/50 border border-border/30 px-4 py-3.5">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.08) 40%, hsl(var(--primary) / 0.15) 50%, hsl(var(--primary) / 0.08) 60%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
          <div className="relative flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            <p className="text-sm text-foreground font-medium">
              Processando...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIThinkingIndicator;
