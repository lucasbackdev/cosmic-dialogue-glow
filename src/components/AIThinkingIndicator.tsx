import { ChevronRight } from "lucide-react";

const AIThinkingIndicator = () => {
  return (
    <div className="w-full flex justify-start animate-fade-in">
      <div className="w-full max-w-[85%] md:max-w-[35%]">
        <div className="relative overflow-hidden rounded-xl bg-card/50 border border-border/30 px-4 py-3">
          {/* Shimmer */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.06) 40%, hsl(var(--primary) / 0.12) 50%, hsl(var(--primary) / 0.06) 60%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Edited</span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                campaign.ts
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <p className="relative text-xs text-muted-foreground mt-1">Processando sua solicitação...</p>
        </div>
      </div>
    </div>
  );
};

export default AIThinkingIndicator;
