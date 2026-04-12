import { useState, useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkSimulationProps {
  onComplete: () => void;
}

const STEPS = [
  { text: "Analisando sua solicitação...", duration: 1200 },
  { text: "Configurando estrutura da campanha...", duration: 1800 },
  { text: "Definindo público-alvo e segmentação...", duration: 1500 },
  { text: "Gerando palavras-chave otimizadas...", duration: 2000 },
  { text: "Criando anúncios e extensões...", duration: 1600 },
  { text: "Configurando lances e orçamento...", duration: 1200 },
  { text: "Revisando e finalizando campanha...", duration: 1400 },
];

const WorkSimulation = ({ onComplete }: WorkSimulationProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      const timeout = setTimeout(onComplete, 800);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep((prev) => prev + 1);
    }, STEPS[currentStep].duration);

    return () => clearTimeout(timeout);
  }, [currentStep, onComplete]);

  return (
    <div className="w-full animate-[float-up_0.4s_ease-out_forwards] text-left">
      <div className="inline-block max-w-[85%] text-sm text-foreground">
        <div className="space-y-2">
          {STEPS.map((step, i) => {
            if (i > currentStep) return null;
            const isCompleted = completedSteps.includes(i);
            const isActive = i === currentStep && !isCompleted;

            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 transition-opacity duration-300",
                  isCompleted ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
                <span className={cn("text-xs", isActive && "text-foreground font-medium")}>
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkSimulation;
