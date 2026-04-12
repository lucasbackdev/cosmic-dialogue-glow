import { useState, useEffect } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkSimulationProps {
  onComplete: () => void;
}

const STEPS = [
  { label: "Analisando solicitação", file: "request.ts" },
  { label: "Configurando estrutura da campanha", file: "campaign.ts" },
  { label: "Definindo público-alvo e segmentação", file: "audience.ts" },
  { label: "Gerando palavras-chave otimizadas", file: "keywords.ts" },
  { label: "Criando anúncios e extensões", file: "ads.tsx" },
  { label: "Configurando lances e orçamento", file: "budget.ts" },
  { label: "Revisando e finalizando campanha", file: "campaign.ts" },
];

const STEP_DURATION = 1600;

const WorkSimulation = ({ onComplete }: WorkSimulationProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<typeof STEPS>([]);

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      const timeout = setTimeout(onComplete, 600);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, STEPS[currentStep]]);
      setCurrentStep((prev) => prev + 1);
    }, STEP_DURATION);

    return () => clearTimeout(timeout);
  }, [currentStep, onComplete]);

  const activeStep = currentStep < STEPS.length ? STEPS[currentStep] : null;

  return (
    <div className="w-full flex justify-start animate-[float-up_0.4s_ease-out_forwards]">
      <div className="w-full max-w-[85%] md:max-w-[35%] space-y-2">
        {/* Completed steps */}
        {completedSteps.map((step, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-card/40 border border-border/30 cursor-default"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-muted-foreground shrink-0">Edited</span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground shrink-0">
                {step.file}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          </div>
        ))}

        {/* Active step */}
        {activeStep && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-card/60 border border-primary/20 cursor-default">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground shrink-0">Editing</span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                  {activeStep.file}
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate">{activeStep.label}</span>
            </div>
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkSimulation;
