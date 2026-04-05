import { TrendingUp, Eye, MousePointerClick, DollarSign, Target, Lightbulb } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  analysis: string;
  suggestion: string;
}

const MetricCard = ({ label, value, icon, analysis, suggestion }: MetricCardProps) => (
  <div className="p-3 rounded-xl bg-card/30 backdrop-blur-sm border border-border/20 space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
    <p className="text-xs text-muted-foreground leading-relaxed">{analysis}</p>
    <div className="flex items-start gap-1.5 text-xs text-primary">
      <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
      <span>{suggestion}</span>
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
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
};

const cur = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

const CampaignMetricsInline = ({ summary }: CampaignMetricsInlineProps) => {
  const metrics: MetricCardProps[] = [
    {
      label: "Impressões",
      value: fmt(summary.impressions),
      icon: <Eye className="w-4 h-4" />,
      analysis: summary.impressions > 10000
        ? "Volume de impressões saudável. Suas campanhas estão alcançando um bom público."
        : "Volume de impressões baixo. Considere aumentar o orçamento ou expandir o público-alvo.",
      suggestion: summary.impressions > 10000
        ? "Mantenha o investimento atual e monitore a qualidade do tráfego."
        : "Aumente o orçamento diário em 20% ou adicione novos grupos de anúncios.",
    },
    {
      label: "Cliques",
      value: fmt(summary.clicks),
      icon: <MousePointerClick className="w-4 h-4" />,
      analysis: summary.clicks > 500
        ? "Bom volume de cliques. Os anúncios estão atraindo interesse."
        : "Cliques abaixo do esperado. Os anúncios podem precisar de otimização.",
      suggestion: summary.clicks > 500
        ? "Teste novos textos de anúncio para aumentar ainda mais o CTR."
        : "Revise os títulos e descrições dos anúncios para torná-los mais atrativos.",
    },
    {
      label: "CTR",
      value: summary.ctr.toFixed(2) + "%",
      icon: <Target className="w-4 h-4" />,
      analysis: summary.ctr > 5
        ? "CTR excelente! Seus anúncios são muito relevantes para o público."
        : summary.ctr > 2
        ? "CTR dentro da média. Há espaço para melhorias."
        : "CTR baixo. Os anúncios não estão gerando interesse suficiente.",
      suggestion: summary.ctr > 5
        ? "Continue com a estratégia atual. Considere expandir para públicos semelhantes."
        : "Adicione extensões de anúncio e teste variações de texto A/B.",
    },
    {
      label: "CPC Médio",
      value: cur(summary.averageCpc),
      icon: <DollarSign className="w-4 h-4" />,
      analysis: summary.averageCpc < 2
        ? "CPC competitivo. Você está pagando um valor justo por clique."
        : "CPC elevado. Pode estar competindo em palavras-chave caras.",
      suggestion: summary.averageCpc < 2
        ? "Monitore e mantenha. Foque em melhorar a taxa de conversão."
        : "Revise as palavras-chave e remova as de baixo desempenho. Use correspondência exata.",
    },
    {
      label: "Conversões",
      value: fmt(summary.conversions),
      icon: <TrendingUp className="w-4 h-4" />,
      analysis: summary.conversions > 50
        ? "Bom volume de conversões. As campanhas estão gerando resultados."
        : "Conversões baixas. O funil de vendas pode precisar de ajustes.",
      suggestion: summary.conversions > 50
        ? "Aumente o orçamento nas campanhas com melhor custo por conversão."
        : "Verifique a página de destino e simplifique o processo de conversão.",
    },
    {
      label: "Custo Total",
      value: cur(summary.totalCost),
      icon: <DollarSign className="w-4 h-4" />,
      analysis: summary.conversions > 0
        ? `Custo por conversão: ${cur(summary.totalCost / summary.conversions)}. ${
            summary.totalCost / summary.conversions < 50
              ? "Dentro de um range saudável."
              : "Considere otimizar para reduzir este valor."
          }`
        : "Sem conversões registradas. O custo não está gerando retorno.",
      suggestion: summary.conversions > 0 && summary.totalCost / summary.conversions < 50
        ? "ROI positivo. Considere escalar gradualmente o orçamento."
        : "Pause campanhas de baixo desempenho e redistribua o orçamento.",
    },
  ];

  return (
    <div className="w-full animate-[float-up_0.4s_ease-out_forwards]">
      <p className="text-xs text-muted-foreground mb-3 font-medium">📊 Análise das Métricas — Últimos 30 dias</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
};

export default CampaignMetricsInline;
