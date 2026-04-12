import { useState, useEffect, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import GoogleAdsOnboarding from "./GoogleAdsOnboarding";

interface WorkSimulationProps {
  userMessage: string;
  onComplete: () => void;
  onOpenSettings: () => void;
}

function generateSteps(input: string): { file: string; label: string }[] {
  const lower = input.toLowerCase();

  // Campaign related
  if (["campanha", "campaign", "google ads", "anúncio", "anuncio"].some(k => lower.includes(k))) {
    return [
      { file: "analyze.ts", label: `Analisando: "${input.slice(0, 50)}..."` },
      { file: "targeting.ts", label: "Definindo segmentação ideal para o público..." },
      { file: "keywords.ts", label: "Pesquisando palavras-chave com maior potencial..." },
      { file: "ads.tsx", label: "Criando variações de anúncios otimizados..." },
      { file: "bidding.ts", label: "Calculando estratégia de lances..." },
      { file: "campaign.ts", label: "Montando estrutura final da campanha..." },
    ];
  }

  // Lead prospecting
  if (["lead", "prospecção", "prospectar", "clientes", "empresas", "nicho"].some(k => lower.includes(k))) {
    return [
      { file: "search.ts", label: `Buscando: "${input.slice(0, 50)}..."` },
      { file: "scraper.ts", label: "Rastreando fontes de dados públicos..." },
      { file: "filter.ts", label: "Filtrando resultados por relevância..." },
      { file: "enrich.ts", label: "Enriquecendo dados de contato..." },
      { file: "results.ts", label: "Organizando leads qualificados..." },
    ];
  }

  // Vehicle
  if (["placa", "veículo", "veiculo", "carro", "consulta"].some(k => lower.includes(k))) {
    return [
      { file: "plate.ts", label: `Consultando: "${input.slice(0, 50)}..."` },
      { file: "api.ts", label: "Conectando com base de dados veicular..." },
      { file: "decode.ts", label: "Decodificando informações do veículo..." },
      { file: "report.ts", label: "Montando relatório completo..." },
    ];
  }

  // Metrics / analysis
  if (["métrica", "metrica", "desempenho", "performance", "relatório", "analise", "análise"].some(k => lower.includes(k))) {
    return [
      { file: "fetch.ts", label: `Coletando dados: "${input.slice(0, 50)}..."` },
      { file: "metrics.ts", label: "Processando métricas de desempenho..." },
      { file: "insights.ts", label: "Gerando insights e recomendações..." },
      { file: "report.tsx", label: "Preparando visualização dos dados..." },
    ];
  }

  // Generic fallback — still contextual
  return [
    { file: "process.ts", label: `Processando: "${input.slice(0, 60)}..."` },
    { file: "research.ts", label: "Pesquisando informações relevantes..." },
    { file: "analyze.ts", label: "Analisando dados encontrados..." },
    { file: "response.ts", label: "Preparando resposta personalizada..." },
  ];
}

const PAUSE_AFTER_STEP = 2;
const STEP_DURATION = 2800;

const WorkSimulation = ({ userMessage, onComplete, onOpenSettings }: WorkSimulationProps) => {
  const steps = useMemo(() => generateSteps(userMessage), [userMessage]);
  const [currentStep, setCurrentStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const finished = currentStep >= steps.length;

  useEffect(() => {
    if (paused || finished) return;

    const timeout = setTimeout(() => {
      setTransitioning(true);
      setTimeout(() => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setTransitioning(false);
        if (currentStep === PAUSE_AFTER_STEP) {
          setPaused(true);
        }
      }, 300);
    }, STEP_DURATION);

    return () => clearTimeout(timeout);
  }, [currentStep, finished, paused, steps.length]);

  useEffect(() => {
    if (finished && !paused) {
      const timeout = setTimeout(onComplete, 600);
      return () => clearTimeout(timeout);
    }
  }, [finished, paused, onComplete]);

  const handleResume = () => {
    setPaused(false);
  };

  const step = finished ? { file: "done.ts", label: "Concluído! ✅" } : steps[currentStep];

  return (
    <div className="w-full flex flex-col gap-3 animate-fade-in">
      <div className="w-full flex justify-start">
        <div className="w-full max-w-[85%] md:max-w-[35%]">
          <div className="relative overflow-hidden rounded-xl bg-card/50 border border-border/30 px-4 py-3">
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
                <span className="text-sm font-medium text-foreground">
                  {finished ? "Done" : "Working"}
                </span>
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
