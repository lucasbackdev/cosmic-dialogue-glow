import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import GoogleAdsOnboarding from "./GoogleAdsOnboarding";

interface WorkSimulationProps {
  onComplete: () => void;
  onOpenSettings: () => void;
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

const PAUSE_AFTER_STEP = 2; // Pause after 3rd step (0-indexed)
const STEP_DURATION = 2800;

const WorkSimulation = ({ onComplete, onOpenSettings }: WorkSimulationProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const finished = currentStep >= STEPS.length;

  useEffect(() => {
    if (paused || finished) return;
    if (finished) {
      const timeout = setTimeout(onComplete, 600);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setTransitioning(true);
      setTimeout(() => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setTransitioning(false);
        // Pause after the designated step
        if (currentStep === PAUSE_AFTER_STEP) {
          setPaused(true);
        }
      }, 300);
    }, STEP_DURATION);

    return () => clearTimeout(timeout);
  }, [currentStep, finished, onComplete, paused]);

  // Handle completion separately
  useEffect(() => {
    if (finished && !paused) {
      const timeout = setTimeout(onComplete, 600);
      return () => clearTimeout(timeout);
    }
  }, [finished, paused, onComplete]);

  const handleResume = () => {
    setPaused(false);
  };

  const step = finished ? { file: "campaign.ts", label: "Campanha criada com sucesso!" } : STEPS[currentStep];

  return (
    <div className="w-full flex flex-col gap-3 animate-fade-in">
      <div className="w-full flex justify-start">
        <div className="w-full max-w-[85%] md:max-w-[35%]">
          <div className="relative overflow-hidden rounded-xl bg-card/50 border border-border/30 px-4 py-3">
            {/* Shimmer */}
            {!paused && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.06) 40%, hsl(var(--primary) / 0.12) 50%, hsl(var(--primary) / 0.06) 60%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s ease-in-out infinite",
                }}
              />
            )}
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

      {/* Show onboarding instruction when paused */}
      {paused && (
        <div className="w-full animate-fade-in">
          <GoogleAdsOnboarding
            onOpenSettings={onOpenSettings}
            showResumeButton
            onResume={handleResume}
          />
        </div>
      )}
    </div>
  );
};

export default WorkSimulation;
