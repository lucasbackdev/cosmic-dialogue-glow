import { useState } from "react";
import { TrendingUp, TrendingDown, Eye, MousePointerClick, DollarSign, Target, Loader2, RefreshCw, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useGoogleAds } from "@/hooks/useGoogleAds";

interface CRMPanelProps {
  visible: boolean;
  userId?: string;
}

const formatNumber = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toFixed(0);
};

const formatCurrency = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

const CRMPanel = ({ visible, userId }: CRMPanelProps) => {
  const { customerId, data, loading, error, saveCustomerId, fetchMetrics } = useGoogleAds(userId);
  const [inputId, setInputId] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  if (!visible) return null;

  const handleSubmitId = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputId.trim()) saveCustomerId(inputId.trim());
  };

  const metrics = data?.summary
    ? [
        { label: "Impressões", value: formatNumber(data.summary.impressions), icon: <Eye className="w-4 h-4" /> },
        { label: "Cliques", value: formatNumber(data.summary.clicks), icon: <MousePointerClick className="w-4 h-4" /> },
        { label: "CTR", value: data.summary.ctr.toFixed(2) + "%", icon: <Target className="w-4 h-4" /> },
        { label: "CPC Médio", value: formatCurrency(data.summary.averageCpc), icon: <DollarSign className="w-4 h-4" /> },
        { label: "Conversões", value: formatNumber(data.summary.conversions), icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Custo Total", value: formatCurrency(data.summary.totalCost), icon: <DollarSign className="w-4 h-4" /> },
      ]
    : null;

  return (
    <div className="fixed left-0 top-0 h-full w-80 z-20 animate-[slide-in_0.3s_ease-out_forwards]">
      <div className="h-full bg-card/20 backdrop-blur-xl border-r border-border/30 pt-16 pb-4 px-4 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Métricas Google Ads</h2>
            {customerId && (
              <p className="text-xs text-muted-foreground mt-0.5">ID: {customerId}</p>
            )}
          </div>
          <div className="flex gap-1">
            {customerId && (
              <button onClick={fetchMetrics} disabled={loading} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            )}
            <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Settings / ID input */}
        {(!customerId || showSettings) && (
          <form onSubmit={handleSubmitId} className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary mb-2">
              {customerId ? "Alterar" : "Digite"} o ID da sua conta Google Ads (ex: 123-456-7890):
            </p>
            <div className="flex gap-2">
              <Input
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="123-456-7890"
                className="text-xs h-8 bg-background/50"
              />
              <button type="submit" className="px-3 h-8 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                OK
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Metrics */}
        {metrics && !loading && (
          <div className="space-y-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="p-3 rounded-xl bg-card/30 backdrop-blur-sm border border-border/20">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  {metric.icon}
                  <span className="text-xs">{metric.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{metric.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Campaigns list */}
        {data?.campaigns && data.campaigns.length > 0 && !loading && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">Campanhas (últimos 30 dias)</h3>
            <div className="space-y-2">
              {data.campaigns.slice(0, 5).map((c, i) => (
                <div key={i} className="p-2 rounded-lg bg-card/20 border border-border/10">
                  <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatNumber(c.impressions)} imp</span>
                    <span>{formatNumber(c.clicks)} cli</span>
                    <span>{formatCurrency(c.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No data yet */}
        {!customerId && !showSettings && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary">
              Conecte sua conta Google Ads para ver dados reais.
            </p>
          </div>
        )}
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
