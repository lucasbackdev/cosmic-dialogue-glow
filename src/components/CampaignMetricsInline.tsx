import { TrendingUp, Eye, MousePointerClick, DollarSign, Target, Lightbulb, BarChart3 } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  change?: "up" | "down" | "neutral";
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

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("pt-BR");
};

const cur = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

const CampaignMetricsInline = ({ summary }: CampaignMetricsInlineProps) => {
  const metrics: MetricCardProps[] = [
    {
      label: "Impressões",
      value: fmt(summary.impressions),
      icon: <Eye className="w-3.5 h-3.5" />,
      analysis: summary.impressions > 10000
        ? "Volume saudável. Bom alcance de público."
        : "Volume baixo. Expanda o público-alvo.",
      suggestion: summary.impressions > 10000
        ? "Monitore a qualidade do tráfego."
        : "Aumente orçamento diário em 20%.",
    },
    {
      label: "Cliques",
      value: fmt(summary.clicks),
      icon: <MousePointerClick className="w-3.5 h-3.5" />,
      analysis: summary.clicks > 500
        ? "Bom volume. Anúncios atraindo interesse."
        : "Abaixo do esperado. Otimize os anúncios.",
      suggestion: summary.clicks > 500
        ? "Teste novos textos para aumentar CTR."
        : "Revise títulos e descrições.",
    },
    {
      label: "CTR",
      value: summary.ctr.toFixed(2) + "%",
      icon: <Target className="w-3.5 h-3.5" />,
      analysis: summary.ctr > 5
        ? "Excelente! Anúncios muito relevantes."
        : summary.ctr > 2
        ? "Na média. Há espaço para melhorar."
        : "Baixo. Anúncios sem interesse suficiente.",
      suggestion: summary.ctr > 5
        ? "Expanda para públicos semelhantes."
        : "Adicione extensões e teste A/B.",
    },
    {
      label: "CPC Médio",
      value: cur(summary.averageCpc),
      icon: <DollarSign className="w-3.5 h-3.5" />,
      analysis: summary.averageCpc < 2
        ? "Competitivo. Valor justo por clique."
        : "Elevado. Palavras-chave caras.",
      suggestion: summary.averageCpc < 2
        ? "Foque em melhorar conversão."
        : "Remova palavras-chave de baixo desempenho.",
    },
    {
      label: "Conversões",
      value: fmt(summary.conversions),
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      analysis: summary.conversions > 50
        ? "Bom volume. Campanhas gerando resultados."
        : "Baixas. Ajuste o funil de vendas.",
      suggestion: summary.conversions > 50
        ? "Aumente orçamento nas melhores campanhas."
        : "Simplifique a página de destino.",
    },
    {
      label: "Custo Total",
      value: cur(summary.totalCost),
      icon: <DollarSign className="w-3.5 h-3.5" />,
      analysis: summary.conversions > 0
        ? `CPA: ${cur(summary.totalCost / summary.conversions)}. ${
            summary.totalCost / summary.conversions < 50 ? "ROI saudável." : "Otimize para reduzir."
          }`
        : "Sem conversões. Custo sem retorno.",
      suggestion: summary.conversions > 0 && summary.totalCost / summary.conversions < 50
        ? "Escale gradualmente o orçamento."
        : "Pause campanhas de baixo desempenho.",
    },
  ];

  return (
    <div className="w-full animate-[float-up_0.4s_ease-out_forwards]">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Dashboard — Últimos 30 dias</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
};

export default CampaignMetricsInline;
