import { TrendingUp, TrendingDown, Eye, MousePointerClick, DollarSign, Target } from "lucide-react";

interface Metric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}

interface CRMPanelProps {
  visible: boolean;
  campaignName?: string;
}

// Mock data for now — will be replaced with real Google Ads data
const mockMetrics: Metric[] = [
  { label: "Impressões", value: "45.2K", change: "+12.3%", positive: true, icon: <Eye className="w-4 h-4" /> },
  { label: "Cliques", value: "3.8K", change: "+8.1%", positive: true, icon: <MousePointerClick className="w-4 h-4" /> },
  { label: "CTR", value: "8.4%", change: "+0.5%", positive: true, icon: <Target className="w-4 h-4" /> },
  { label: "CPC Médio", value: "R$ 1.23", change: "-5.2%", positive: true, icon: <DollarSign className="w-4 h-4" /> },
  { label: "Conversões", value: "342", change: "+15.7%", positive: true, icon: <TrendingUp className="w-4 h-4" /> },
  { label: "Custo Total", value: "R$ 4.674", change: "+3.1%", positive: false, icon: <DollarSign className="w-4 h-4" /> },
];

const CRMPanel = ({ visible, campaignName }: CRMPanelProps) => {
  if (!visible) return null;

  return (
    <div className="fixed left-0 top-0 h-full w-80 z-20 animate-[slide-in_0.3s_ease-out_forwards]">
      <div className="h-full bg-card/20 backdrop-blur-xl border-r border-border/30 pt-16 pb-4 px-4 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Métricas da Campanha</h2>
          {campaignName && (
            <p className="text-xs text-muted-foreground mt-1">{campaignName}</p>
          )}
          <p className="text-xs text-muted-foreground/60 mt-0.5">Dados de exemplo — conecte o Google Ads</p>
        </div>

        <div className="space-y-3">
          {mockMetrics.map((metric) => (
            <div
              key={metric.label}
              className="p-3 rounded-xl bg-card/30 backdrop-blur-sm border border-border/20"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {metric.icon}
                  <span className="text-xs">{metric.label}</span>
                </div>
                <div className={`flex items-center gap-1 text-xs ${metric.positive ? "text-emerald-400" : "text-red-400"}`}>
                  {metric.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {metric.change}
                </div>
              </div>
              <p className="text-lg font-bold text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-xs text-primary">
            Conecte sua conta Google Ads para ver dados reais das suas campanhas.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CRMPanel;
