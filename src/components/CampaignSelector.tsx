import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, Play, Pause, Trash2, MousePointerClick, Eye, DollarSign, TrendingUp, Calendar } from "lucide-react";
import type { DatePeriod } from "@/hooks/useGoogleAds";

export interface Campaign {
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  conversions: number;
  cost: number;
}

interface CampaignSelectorProps {
  campaigns: Campaign[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  period: DatePeriod;
  onPeriodChange: (period: DatePeriod) => void;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  ENABLED: { icon: <Play className="w-3 h-3" />, label: "Ativa", color: "text-green-400 bg-green-400/10 border-green-400/30" },
  PAUSED: { icon: <Pause className="w-3 h-3" />, label: "Pausada", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  REMOVED: { icon: <Trash2 className="w-3 h-3" />, label: "Removida", color: "text-red-400 bg-red-400/10 border-red-400/30" },
};

const periods: { value: DatePeriod; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "all", label: "Tudo" },
];

const CampaignSelector = ({ campaigns, selectedIndex, onSelect, period, onPeriodChange }: CampaignSelectorProps) => {
  const { language } = useLanguage();

  const fmt = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString(language);
  };

  const cur = (n: number) => `R$ ${n.toFixed(2)}`;

  if (!campaigns.length) return null;

  return (
    <div className="w-full animate-[float-up_0.4s_ease-out_forwards]">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">
          {language === "pt-BR" ? "Suas Campanhas" : "Your Campaigns"}
        </span>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-1.5 mb-3">
        <Calendar className="w-3 h-3 text-muted-foreground" />
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
              period === p.value
                ? "bg-primary/20 border-primary/40 text-primary font-medium"
                : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {campaigns.map((c, i) => {
          const status = statusConfig[c.status] || statusConfig.REMOVED;
          const isSelected = selectedIndex === i;

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? "bg-primary/15 border-primary/40 shadow-lg shadow-primary/10"
                  : "bg-secondary/30 border-border/30 hover:bg-secondary/50 hover:border-border/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {c.name}
                </span>
                <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${status.color}`}>
                  {status.icon}
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-muted-foreground" />
                  <div>
                    <p className="text-[9px] text-muted-foreground">Imp.</p>
                    <p className="text-xs font-semibold text-foreground">{fmt(c.impressions)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3 text-muted-foreground" />
                  <div>
                    <p className="text-[9px] text-muted-foreground">Cliques</p>
                    <p className="text-xs font-semibold text-foreground">{fmt(c.clicks)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <div>
                    <p className="text-[9px] text-muted-foreground">Conv.</p>
                    <p className="text-xs font-semibold text-foreground">{fmt(c.conversions)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <div>
                    <p className="text-[9px] text-muted-foreground">Custo</p>
                    <p className="text-xs font-semibold text-foreground">{cur(c.cost)}</p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignSelector;
