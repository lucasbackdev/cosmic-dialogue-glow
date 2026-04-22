import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um gestor de tráfego sênior do Google Ads. Você recebe um comando do usuário para executar em uma conta. Você NÃO conversa, apenas analisa o comando e produz um plano de ação JSON.

Regras de risco:
- "safe": consulta/leitura, ajustes pequenos (< 20% no orçamento), pausar/ativar grupos individuais.
- "warn": alterações de orçamento entre 20%-50%, pausar campanhas ativas com gasto recente, alterar lances em massa.
- "danger": deletar campanha/grupo/anúncio, aumento de orçamento > 50%, pausar todas as campanhas, alterações que removam histórico.

Para "warn" e "danger" SEMPRE inclua "betterStrategy" com uma sugestão estratégica concreta de gestor profissional.

Responda APENAS com JSON válido neste formato:
{
  "summary": "string curta do que será feito",
  "risk": "safe" | "warn" | "danger",
  "actions": [{ "type": "string", "target": "string", "params": {} }],
  "warning": "string (apenas se warn/danger) explicando os riscos",
  "betterStrategy": "string (apenas se warn/danger) com sugestão melhor"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { command, context, force } = await req.json();
    if (!command || typeof command !== "string") {
      return new Response(JSON.stringify({ error: "command required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Comando do usuário: "${command}"

Contexto da conta:
${JSON.stringify(context || {}, null, 2)}

${force ? "ATENÇÃO: o usuário confirmou execução mesmo com risco. Marque como 'safe' e prossiga com as ações." : ""}

Analise e responda com o JSON do plano.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados na IA Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      plan = { summary: content, risk: "warn", actions: [], warning: "Resposta não estruturada da IA." };
    }

    return new Response(JSON.stringify({ plan, executedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("google-ads-command error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
