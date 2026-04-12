import { useState, useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface WorkSimulationProps {
  onComplete: () => void;
}

const STEPS = [
  "Analisando sua solicitação...",
  "Configurando estrutura da campanha...",
  "Definindo público-alvo e segmentação...",
  "Gerando palavras-chave otimizadas...",
  "Criando anúncios e extensões...",
  "Configurando lances e orçamento...",
  "Finalizando campanha...",
];

const STEP_DURATION = 1800;

const WorkSimulation = ({ onComplete }: WorkSimulationProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const finished = currentStep >= STEPS.length;

  useEffect(() => {
    if (finished) {
      const timeout = setTimeout(onComplete, 800);
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

  const progress = finished ? 100 : Math.round((currentStep / STEPS.length) * 100);

  return (
    <div className="w-full flex justify-start animate-fade-in">
      <div className="w-full max-w-[85%] md:max-w-[35%]">
        <div className="relative overflow-hidden rounded-xl bg-card/50 border border-border/30 px-4 py-3.5">
          {/* Shimmer sweep */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.08) 40%, hsl(var(--primary) / 0.15) 50%, hsl(var(--primary) / 0.08) 60%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />

          {/* Content */}
          <div className="relative flex items-center gap-3">
            {finished ? (
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <p
                className="text-sm text-foreground font-medium transition-all duration-300"
                style={{ opacity: transitioning ? 0 : 1, transform: transitioning ? "translateY(6px)" : "translateY(0)" }}
              >
                {finished ? "Campanha criada com sucesso!" : STEPS[currentStep]}
              </p>
            </div>

            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {progress}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative mt-3 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkSimulation;
