import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface WorkSimulationProps {
  onComplete: () => void;
}

const STEPS = [
  { file: "request.ts", label: "Analisando sua solicitação..." },
  { file: "campaign.ts", label: "Configurando estrutura da campanha..." },
  { file: "audience.ts", label: "Definindo público-alvo e segmentação..." },
  { file: "keywords.ts", label: "Gerando palavras-chave otimizadas..." },
  { file: "ads.tsx", label: "Criando anúncios e extensões..." },
  { file: "budget.ts", label: "Configurando lances e orçamento..." },
  { file: "campaign.ts", label: "Finalizando campanha..." },
];

const STEP_DURATION = 1800;

const WorkSimulation = ({ onComplete }: WorkSimulationProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const finished = currentStep >= STEPS.length;

  useEffect(() => {
    if (finished) {
      const timeout = setTimeout(onComplete, 600);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setTransitioning(false);
      }, 300);
    }, STEP_DURATION);

    return () => clearTimeout(timeout);
  }, [currentStep, finished, onComplete]);

  const step = finished ? { file: "campaign.ts", label: "Campanha criada com sucesso!" } : STEPS[currentStep];

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
                {step.file}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <p
            className="relative text-xs text-muted-foreground mt-1 transition-all duration-300"
            style={{ opacity: transitioning ? 0 : 1, transform: transitioning ? "translateY(4px)" : "translateY(0)" }}
          >
            {step.label}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkSimulation;
