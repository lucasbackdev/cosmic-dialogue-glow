import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  metric: "clicks" | "conversions" | "cost" | "cpc";
  value: number | string;
  context?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    cost?: number;
    cpc?: number;
    ctr?: number;
    period?: string;
    campaignName?: string | null;
  };
  language?: "pt-BR" | "en";
}

const METRIC_LABEL: Record<Body["metric"], { pt: string; en: string }> = {
  clicks: { pt: "Cliques", en: "Clicks" },
  conversions: { pt: "Conversões", en: "Conversions" },
  cost: { pt: "Custo total", en: "Total cost" },
  cpc: { pt: "CPC médio", en: "Average CPC" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    const { metric, value, context = {}, language = "pt-BR" } = body;

    if (!metric || value === undefined || value === null) {
      return new Response(
        JSON.stringify({ error: "metric and value are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isPT = language === "pt-BR";
    const label = METRIC_LABEL[metric][isPT ? "pt" : "en"];

    const systemPrompt = isPT
      ? `Você é um analista sênior de Google Ads. Responda em PORTUGUÊS BRASILEIRO de forma direta e curta (máximo 4 frases curtas). Estrutura obrigatória usando markdown:
**Status:** (uma palavra: Bom / Médio / Ruim)
**Por que:** (1 frase explicando o porquê dessa métrica estar nesse nível)
**O que fazer:** (1 frase com ação prática para melhorar)
Não repita o número da métrica. Não use emojis.`
      : `You are a senior Google Ads analyst. Reply in ENGLISH, short and direct (max 4 short sentences). Required structure using markdown:
**Status:** (one word: Good / Average / Poor)
**Why:** (1 sentence explaining why this metric is at this level)
**What to do:** (1 sentence with a practical action to improve)
Do not repeat the metric number. No emojis.`;

    const userPrompt = isPT
      ? `Métrica clicada: **${label}** = ${value}
Contexto da campanha${context.campaignName ? ` "${context.campaignName}"` : ""} (período: ${context.period ?? "30d"}):
- Impressões: ${context.impressions ?? "?"}
- Cliques: ${context.clicks ?? "?"}
- Conversões: ${context.conversions ?? "?"}
- Custo total: R$ ${context.cost ?? "?"}
- CPC médio: R$ ${context.cpc ?? "?"}
- CTR: ${context.ctr ?? "?"}%

Analise especificamente a métrica "${label}".`
      : `Clicked metric: **${label}** = ${value}
Campaign context${context.campaignName ? ` "${context.campaignName}"` : ""} (period: ${context.period ?? "30d"}):
- Impressions: ${context.impressions ?? "?"}
- Clicks: ${context.clicks ?? "?"}
- Conversions: ${context.conversions ?? "?"}
- Total cost: $${context.cost ?? "?"}
- Avg CPC: $${context.cpc ?? "?"}
- CTR: ${context.ctr ?? "?"}%

Analyze specifically the "${label}" metric.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Sem créditos no workspace Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const explanation: string = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ explanation, metric, label }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("explain-metric error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
