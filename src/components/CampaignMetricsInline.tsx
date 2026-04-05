import { TrendingUp, Eye, MousePointerClick, DollarSign, Target, Lightbulb, BarChart3, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  analysis: string;
  suggestion: string;
}

const MetricCard = ({ label, value, icon, analysis, suggestion }: MetricCardProps) => (
  <div className="p-3 rounded-lg bg-secondary/40 border border-border/30 space-y-1.5 hover:bg-secondary/60 transition-colors">
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {icon}
      <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
    </div>
    <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
    <p className="text-[10px] text-muted-foreground leading-relaxed">{analysis}</p>
    <div className="flex items-start gap-1 pt-1 border-t border-border/20">
      <Lightbulb className="w-2.5 h-2.5 mt-0.5 shrink-0 text-primary" />
      <span className="text-[10px] text-primary leading-relaxed">{suggestion}</span>
    </div>
  </div>
);

interface CampaignSummary {
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  conversions: number;
  totalCost: number;
}

interface CampaignMetricsInlineProps {
  summary: CampaignSummary;
  connected?: boolean;
}

const CampaignMetricsInline = ({ summary, connected = true }: CampaignMetricsInlineProps) => {
  const { t, language } = useLanguage();

  const fmt = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString(language);
  };

  const cur = (n: number) =>
    language === "pt-BR"
      ? `R$ ${n.toFixed(2).replace(".", ",")}`
      : `R$ ${n.toFixed(2)}`;

  const metrics: MetricCardProps[] = [
    {
      label: t("impressions"),
      value: fmt(summary.impressions),
      icon: <Eye className="w-3.5 h-3.5" />,
      analysis: summary.impressions > 10000 ? t("healthyVolume") : t("lowVolume"),
      suggestion: summary.impressions > 10000 ? t("monitorQuality") : t("increaseBudget"),
    },
    {
      label: t("clicks"),
      value: fmt(summary.clicks),
      icon: <MousePointerClick className="w-3.5 h-3.5" />,
      analysis: summary.clicks > 500 ? t("goodClicks") : t("lowClicks"),
      suggestion: summary.clicks > 500 ? t("testNewTexts") : t("reviewTitles"),
    },
    {
      label: t("ctr"),
      value: summary.ctr.toFixed(2) + "%",
      icon: <Target className="w-3.5 h-3.5" />,
      analysis: summary.ctr > 5 ? t("excellentCtr") : summary.ctr > 2 ? t("averageCtr") : t("lowCtr"),
      suggestion: summary.ctr > 5 ? t("expandAudiences") : t("addExtensions"),
    },
    {
      label: t("avgCpc"),
      value: cur(summary.averageCpc),
      icon: <DollarSign className="w-3.5 h-3.5" />,
      analysis: summary.averageCpc < 2 ? t("competitiveCpc") : t("highCpc"),
      suggestion: summary.averageCpc < 2 ? t("focusConversion") : t("removeLowPerf"),
    },
    {
      label: t("conversions"),
      value: fmt(summary.conversions),
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      analysis: summary.conversions > 50 ? t("goodConversions") : t("lowConversions"),
      suggestion: summary.conversions > 50 ? t("increaseBudgetBest") : t("simplifyLanding"),
    },
    {
      label: t("totalCost"),
      value: cur(summary.totalCost),
      icon: <DollarSign className="w-3.5 h-3.5" />,
      analysis: summary.conversions > 0
        ? `${t("cpa")}: ${cur(summary.totalCost / summary.conversions)}. ${
            summary.totalCost / summary.conversions < 50 ? t("healthyRoi") : t("optimizeReduce")
          }`
        : t("noConversionsYet"),
      suggestion: summary.conversions > 0 && summary.totalCost / summary.conversions < 50
        ? t("scaleBudget")
        : t("pauseLowPerf"),
    },
  ];

  return (
    <div className="w-full animate-[float-up_0.4s_ease-out_forwards]">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">{t("dashboardTitle")}</span>
      </div>

      {!connected && (
        <div className="mb-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{t("notConnected")}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
};

export default CampaignMetricsInline;
