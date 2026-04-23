import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  DollarSign,
  Target,
  TrendingUp,
  Megaphone,
  Layers,
  FileText,
  KeyRound,
  Shield,
  Clock,
  Send,
  AlertTriangle,
  Check,
  Loader2,
  Power,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useGoogleAds, type DatePeriod } from "@/hooks/useGoogleAds";
import { supabase } from "@/integrations/supabase/client";
import googleAdsLogo from "@/assets/google-ads-logo.png";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GoogleAdsDashboardProps {
  userId: string | undefined;
  onBack: () => void;
}

interface ActionLog {
  id: string;
  ts: string;
  summary: string;
  risk: "safe" | "warn" | "danger";
}

interface Plan {
  summary: string;
  risk: "safe" | "warn" | "danger";
  actions: Array<{ type: string; target: string; params: Record<string, unknown> }>;
  warning?: string;
  betterStrategy?: string;
}

const formatN = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
};
const formatBRL = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

const PERMISSIONS = [
  { id: "view", label: "Visualizar campanhas, grupos e anúncios", default: true },
  { id: "pause", label: "Pausar / ativar campanhas e grupos", default: true },
  { id: "budget", label: "Alterar orçamento diário", default: false },
  { id: "bid", label: "Ajustar lances de palavras-chave", default: false },
  { id: "create_ad", label: "Criar novos anúncios", default: false },
  { id: "create_campaign", label: "Criar novas campanhas", default: false },
  { id: "delete", label: "Deletar campanhas / grupos / anúncios", default: false },
  { id: "negative_kw", label: "Adicionar palavras negativas", default: true },
];

const PERIODS: { value: DatePeriod; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "all", label: "Todo o período" },
];

const GoogleAdsDashboard = ({ userId, onBack }: GoogleAdsDashboardProps) => {
  const { customerId, data, loading, fetchMetrics, period, changePeriod } = useGoogleAds(userId);
  const [command, setCommand] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [pendingCommand, setPendingCommand] = useState<string>("");
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    Object.fromEntries(PERMISSIONS.map((p) => [p.id, p.default]))
  );
  const [watcherEnabled, setWatcherEnabled] = useState(false);
  const [watcherInterval, setWatcherInterval] = useState(6);
  const [selectedCampaignIdx, setSelectedCampaignIdx] = useState<number | null>(null);

  useEffect(() => {
    if (customerId) fetchMetrics();
  }, [customerId, fetchMetrics]);

  const summary = data?.summary;
  const campaigns = data?.campaigns || [];
  const selectedCampaign =
    selectedCampaignIdx !== null ? campaigns[selectedCampaignIdx] : null;

  const executePlan = (plan: Plan, originalCmd: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), ts: new Date().toISOString(), summary: plan.summary, risk: plan.risk },
      ...prev,
    ]);
    toast.success(plan.summary, { description: `Comando: "${originalCmd}"` });
    setPendingPlan(null);
    setPendingCommand("");
  };

  const sendCommand = async (text: string, force = false) => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-ads-command`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            command: text,
            force,
            context: {
              customerId,
              campaigns: campaigns.slice(0, 10).map((c) => ({
                name: c.name,
                status: c.status,
                cost: c.cost,
                clicks: c.clicks,
              })),
              permissions,
            },
          }),
        }
      );

      const body = await resp.json();
      if (!resp.ok) {
        toast.error(body.error || "Erro ao processar comando");
        return;
      }

      const plan: Plan = body.plan;
      if ((plan.risk === "warn" || plan.risk === "danger") && !force) {
        setPendingPlan(plan);
        setPendingCommand(text);
      } else {
        executePlan(plan, text);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro inesperado");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendCommand(command);
    setCommand("");
  };

  if (!customerId) {
    return (
      <div className="fixed inset-0 z-20 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <img src={googleAdsLogo} alt="Google Ads" className="w-16 h-16 mx-auto object-contain" />
          <h2 className="text-xl font-semibold text-foreground">Conecte sua conta Google Ads</h2>
          <p className="text-sm text-muted-foreground">
            Vá em Configurações na barra lateral e adicione seu Customer ID para usar o dashboard.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-muted transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 bg-background overflow-y-auto pl-0 md:pl-14">
      {/* Header — pt-16 garante que fique abaixo da logo/nome do app na barra lateral */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 md:px-8 pt-16 md:pt-16 pb-3 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={googleAdsLogo} alt="Google Ads" className="w-7 h-7 object-contain" />
        <h1 className="text-lg font-semibold text-foreground">Google Ads</h1>
        <span className="text-xs text-muted-foreground ml-auto">ID: {customerId}</span>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto pb-32">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Visão geral - azul */}
        <section className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Visão geral</h2>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border/40">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => changePeriod(p.value)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-md transition-colors",
                    period === p.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Impressões", value: summary ? formatN(summary.impressions) : "—", icon: Eye },
              { label: "Cliques", value: summary ? formatN(summary.clicks) : "—", icon: MousePointerClick },
              { label: "CTR", value: summary ? summary.ctr.toFixed(2) + "%" : "—", icon: Target },
              { label: "CPC médio", value: summary ? formatBRL(summary.averageCpc) : "—", icon: DollarSign },
              { label: "Conversões", value: summary ? formatN(summary.conversions) : "—", icon: TrendingUp },
              { label: "Custo total", value: summary ? formatBRL(summary.totalCost) : "—", icon: DollarSign },
            ].map((m) => (
              <div
                key={m.label}
                className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"
              >
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                  <m.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wide">{m.label}</span>
                </div>
                <p className="text-base font-bold text-foreground">{m.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Métricas da campanha selecionada - ciano */}
        <section className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Métricas da campanha
              </h2>
            </div>
            {campaigns.length > 0 && (
              <select
                value={selectedCampaignIdx ?? ""}
                onChange={(e) =>
                  setSelectedCampaignIdx(e.target.value === "" ? null : Number(e.target.value))
                }
                className="text-xs bg-muted/40 border border-border/40 rounded-lg px-3 py-1.5 text-foreground max-w-[260px] truncate"
              >
                <option value="">Selecione uma campanha…</option>
                {campaigns.map((c, i) => (
                  <option key={i} value={i}>
                    {c.name} {c.status !== "ENABLED" ? `(${c.status})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!selectedCampaign ? (
            <p className="text-xs text-muted-foreground p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              Selecione uma campanha acima ou clique em um card abaixo para ver suas métricas detalhadas no período escolhido.
            </p>
          ) : (
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground truncate">{selectedCampaign.name}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">
                  {selectedCampaign.status} · {PERIODS.find((p) => p.value === period)?.label}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Impressões", value: formatN(selectedCampaign.impressions), icon: Eye },
                  { label: "Cliques", value: formatN(selectedCampaign.clicks), icon: MousePointerClick },
                  { label: "CTR", value: (selectedCampaign.ctr * 100).toFixed(2) + "%", icon: Target },
                  { label: "CPC médio", value: formatBRL(selectedCampaign.averageCpc), icon: DollarSign },
                  { label: "Conversões", value: formatN(selectedCampaign.conversions), icon: TrendingUp },
                  { label: "Custo", value: formatBRL(selectedCampaign.cost), icon: DollarSign },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="p-3 rounded-lg bg-background/40 border border-border/30"
                  >
                    <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 mb-1">
                      <m.icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wide">{m.label}</span>
                    </div>
                    <p className="text-base font-bold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Campanhas - verde */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-4 h-4 text-green-500" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Campanhas</h2>
          </div>
          {campaigns.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              Nenhuma campanha encontrada no período.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {campaigns.map((c, i) => {
                const isSelected = selectedCampaignIdx === i;
                return (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-500/50 ring-1 ring-cyan-500/40"
                        : "bg-green-500/10 border-green-500/20"
                    )}
                  >
                    <button
                      onClick={() => setSelectedCampaignIdx(i)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span>{formatN(c.impressions)} imp</span>
                        <span>{formatN(c.clicks)} cli</span>
                        <span>{(c.ctr * 100).toFixed(1)}% ctr</span>
                        <span>{formatBRL(c.cost)}</span>
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        sendCommand(
                          c.status === "ENABLED"
                            ? `Pausar a campanha "${c.name}"`
                            : `Ativar a campanha "${c.name}"`
                        )
                      }
                      className={cn(
                        "shrink-0 p-2 rounded-lg transition-colors",
                        c.status === "ENABLED"
                          ? "bg-green-500/20 text-green-600 hover:bg-green-500/30"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      title={c.status === "ENABLED" ? "Pausar" : "Ativar"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tabela detalhada estilo Google Ads */}
        {campaigns.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Tabela de campanhas
              </h2>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {PERIODS.find((p) => p.value === period)?.label}
              </span>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[860px]">
                  <thead className="bg-muted/40 border-b border-border/50">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium w-10"></th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Campanha</th>
                      <th className="px-3 py-2 font-medium text-right">Impressões</th>
                      <th className="px-3 py-2 font-medium text-right">Cliques</th>
                      <th className="px-3 py-2 font-medium text-right">CTR</th>
                      <th className="px-3 py-2 font-medium text-right">CPC médio</th>
                      <th className="px-3 py-2 font-medium text-right">Conversões</th>
                      <th className="px-3 py-2 font-medium text-right">Custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c, i) => {
                      const isSelected = selectedCampaignIdx === i;
                      const statusColor =
                        c.status === "ENABLED"
                          ? "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30"
                          : c.status === "PAUSED"
                            ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
                            : "bg-muted text-muted-foreground border-border/40";
                      return (
                        <tr
                          key={i}
                          onClick={() => setSelectedCampaignIdx(i)}
                          className={cn(
                            "border-b border-border/30 last:border-0 cursor-pointer transition-colors",
                            isSelected
                              ? "bg-cyan-500/10 hover:bg-cyan-500/15"
                              : "hover:bg-muted/40"
                          )}
                        >
                          <td className="px-3 py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sendCommand(
                                  c.status === "ENABLED"
                                    ? `Pausar a campanha "${c.name}"`
                                    : `Ativar a campanha "${c.name}"`
                                );
                              }}
                              className={cn(
                                "p-1 rounded-md transition-colors",
                                c.status === "ENABLED"
                                  ? "text-green-600 hover:bg-green-500/20"
                                  : "text-muted-foreground hover:bg-muted"
                              )}
                              title={c.status === "ENABLED" ? "Pausar" : "Ativar"}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-block px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wide",
                                statusColor
                              )}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 max-w-[260px] truncate text-foreground font-medium">
                            {c.name}
                          </td>
                          <td className="px-3 py-2 text-right text-foreground tabular-nums">
                            {c.impressions.toLocaleString("pt-BR")}
                          </td>
                          <td className="px-3 py-2 text-right text-foreground tabular-nums">
                            {c.clicks.toLocaleString("pt-BR")}
                          </td>
                          <td className="px-3 py-2 text-right text-foreground tabular-nums">
                            {(c.ctr * 100).toFixed(2)}%
                          </td>
                          <td className="px-3 py-2 text-right text-foreground tabular-nums">
                            {formatBRL(c.averageCpc)}
                          </td>
                          <td className="px-3 py-2 text-right text-foreground tabular-nums">
                            {c.conversions.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-right text-foreground tabular-nums font-medium">
                            {formatBRL(c.cost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {summary && (
                    <tfoot className="bg-muted/30 border-t border-border/50">
                      <tr className="text-foreground font-semibold">
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-[10px] uppercase text-muted-foreground" colSpan={2}>
                          Total da conta
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {summary.impressions.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {summary.clicks.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {summary.ctr.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatBRL(summary.averageCpc)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {summary.conversions.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatBRL(summary.totalCost)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </section>
        )}
        <section className="mb-6 grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-foreground">Grupos de anúncios</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Use o chat de comandos abaixo para listar, pausar ou criar grupos. Ex: <em>"Liste os grupos da campanha X"</em>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-pink-500" />
              <h3 className="text-sm font-semibold text-foreground">Anúncios</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Crie, pause ou ative anúncios via comando. Ex: <em>"Crie um anúncio responsivo para o grupo Y"</em>.
            </p>
          </div>
        </section>

        {/* Keywords & lances - amarelo */}
        <section className="mb-6">
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-yellow-600" />
              <h3 className="text-sm font-semibold text-foreground">Palavras-chave e lances</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Adicione negativas, ajuste lances, descubra novas keywords. Ex: <em>"Adicionar 'grátis' como palavra negativa em todas as campanhas"</em>.
            </p>
          </div>
        </section>

        {/* Permissões IA - vermelho */}
        <section className="mb-6">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-foreground">Permissões da IA</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {PERMISSIONS.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg bg-background/40 border border-border/30"
                >
                  <span className="text-xs text-foreground">{p.label}</span>
                  <Switch
                    checked={permissions[p.id]}
                    onCheckedChange={(v) =>
                      setPermissions((prev) => ({ ...prev, [p.id]: v }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Vigilância 24h - laranja */}
        <section className="mb-6">
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-foreground">Vigilância 24h</h3>
              </div>
              <Switch checked={watcherEnabled} onCheckedChange={setWatcherEnabled} />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              A IA verifica suas campanhas periodicamente e te avisa de anomalias (CTR caindo, CPC subindo, gasto fora do padrão).
            </p>
            {watcherEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground">Verificar a cada</span>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={watcherInterval}
                  onChange={(e) => setWatcherInterval(Number(e.target.value) || 6)}
                  className="w-20 h-8 text-xs"
                />
                <span className="text-xs text-foreground">horas</span>
              </div>
            )}
          </div>
        </section>

        {/* Log de ações - cinza */}
        {logs.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Histórico de ações
            </h3>
            <div className="space-y-1.5">
              {logs.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/40 border border-border/30 text-xs"
                >
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <span className="text-foreground flex-1 truncate">{l.summary}</span>
                  <span className="text-muted-foreground">
                    {new Date(l.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Risk warning modal */}
      {pendingPlan && (
        <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-5 rounded-2xl bg-card border-2 border-red-500/50 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-semibold text-red-500 uppercase tracking-wide">
                {pendingPlan.risk === "danger" ? "Ação de alto risco" : "Atenção"}
              </h3>
            </div>
            <p className="text-sm text-foreground mb-3">
              <strong>O que será feito:</strong> {pendingPlan.summary}
            </p>
            {pendingPlan.warning && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-3">
                <p className="text-xs text-red-600 dark:text-red-400">{pendingPlan.warning}</p>
              </div>
            )}
            {pendingPlan.betterStrategy && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-4">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-blue-600 dark:text-blue-400 mb-1">
                  Sugestão estratégica
                </p>
                <p className="text-xs text-foreground">{pendingPlan.betterStrategy}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setPendingPlan(null);
                  setPendingCommand("");
                }}
                className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => sendCommand(pendingCommand, true)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
              >
                Executar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command input - fixed bottom */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-0 right-0 z-20 bg-background/90 backdrop-blur-md border-t border-border/50 px-4 md:px-8 py-3"
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Diga o que a IA deve fazer (ex: pausar a campanha de baixo CTR)"
            className="bg-card/40 backdrop-blur-md border-border/50 text-foreground"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!command.trim() || sending}
            className="shrink-0 p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-colors"
            aria-label="Enviar comando"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoogleAdsDashboard;
