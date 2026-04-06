import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_ADS_API_VERSION = "v23";
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

const CAMPAIGN_KEYWORDS = [
  "campanha", "campanhas", "métrica", "métricas", "google ads",
  "cliques", "impressões", "ctr", "cpc", "conversões", "custo",
  "orçamento", "anúncio", "anúncios", "performance", "desempenho",
  "ads", "campaign", "clicks", "impressions", "conversions", "cost",
  "como estão", "relatório", "report", "análise", "analyze", "budget",
];

function isCampaignQuestion(messages: { role: string; content: string }[]): boolean {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  if (!lastUserMsg) return false;
  const lower = lastUserMsg.content.toLowerCase();
  return CAMPAIGN_KEYWORDS.some(kw => lower.includes(kw));
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/adwords",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = (obj: unknown) => {
    const json = JSON.stringify(obj);
    const b64 = btoa(json);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const unsignedToken = `${enc(header)}.${enc(claimSet)}`;
  const pemContent = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${sigB64}`;

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResp.json();
  if (!tokenResp.ok) throw new Error(`Token error: ${tokenData.error_description || tokenData.error}`);
  return tokenData.access_token;
}

async function fetchGoogleAdsMetrics(customerId: string): Promise<string | null> {
  const serviceAccountJson = Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_JSON");
  const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
  const mccId = Deno.env.get("GOOGLE_ADS_MCC_ID");

  if (!serviceAccountJson || !developerToken || !mccId) return null;

  try {
    const accessToken = await getAccessToken(serviceAccountJson);
    const cleanId = customerId.replace(/-/g, "");
    const cleanMccId = mccId.replace(/-/g, "");

    const query = `
      SELECT
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
      LIMIT 20
    `;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "Content-Type": "application/json",
    };

    // Don't set login-customer-id for direct service account access

    const resp = await fetch(
      `${GOOGLE_ADS_BASE}/customers/${cleanId}/googleAds:searchStream`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ query }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn("Google Ads metrics fetch failed:", resp.status, errText.slice(0, 300));
      return null;
    }

    const rawData = await resp.json();
    
    const campaigns: { name: string; status: string; impressions: number; clicks: number; ctr: number; cpc: number; conversions: number; cost: number }[] = [];
    let totalImpressions = 0, totalClicks = 0, totalConversions = 0, totalCostMicros = 0;

    if (rawData && Array.isArray(rawData)) {
      for (const batch of rawData) {
        if (batch.results) {
          for (const row of batch.results) {
            const m = row.metrics || {};
            const impressions = Number(m.impressions || 0);
            const clicks = Number(m.clicks || 0);
            const conversions = Number(m.conversions || 0);
            const costMicros = Number(m.costMicros || 0);

            totalImpressions += impressions;
            totalClicks += clicks;
            totalConversions += conversions;
            totalCostMicros += costMicros;

            campaigns.push({
              name: row.campaign?.name || "Sem nome",
              status: row.campaign?.status || "UNKNOWN",
              impressions,
              clicks,
              ctr: Number(m.ctr || 0) * 100,
              cpc: Number(m.averageCpc || 0) / 1_000_000,
              conversions,
              cost: costMicros / 1_000_000,
            });
          }
        }
      }
    }

    const totalCost = totalCostMicros / 1_000_000;
    const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const overallCpc = totalClicks > 0 ? totalCost / totalClicks : 0;

    // Format as readable context for the AI
    let context = `\n\n[DADOS REAIS DO GOOGLE ADS - Últimos 30 dias]\n`;
    context += `Resumo Geral: ${totalImpressions.toLocaleString()} impressões, ${totalClicks.toLocaleString()} cliques, CTR ${overallCtr.toFixed(2)}%, CPC médio R$${overallCpc.toFixed(2)}, ${totalConversions} conversões, Custo total R$${totalCost.toFixed(2)}\n`;
    
    if (campaigns.length > 0) {
      context += `\nCampanhas:\n`;
      for (const c of campaigns) {
        context += `- ${c.name} [${c.status}]: ${c.impressions.toLocaleString()} imp, ${c.clicks} cli, CTR ${c.ctr.toFixed(2)}%, CPC R$${c.cpc.toFixed(2)}, ${c.conversions} conv, Custo R$${c.cost.toFixed(2)}\n`;
      }
    } else {
      context += `Nenhuma campanha ativa encontrada.\n`;
    }

    return context;
  } catch (err) {
    console.warn("Error fetching Google Ads for chat context:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, googleAdsCustomerId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemContent = `Você é a Orion, uma assistente virtual especializada em Google Ads e marketing digital.

REGRAS CRÍTICAS DE RESPOSTA:
1) NUNCA liste métricas, números ou dados de campanhas no texto. Os dados já são exibidos visualmente no dashboard ao lado. Repetir números no texto é redundante.
2) Seja CURTA e CONVERSACIONAL — máximo 2-3 frases.
3) Responda SEMPRE no mesmo idioma que o usuário usar.
4) Quando o usuário pedir campanhas/métricas, NÃO repita os dados. Em vez disso, diga que os dados estão no dashboard e faça PERGUNTAS de acompanhamento como:
   - "Qual campanha você quer analisar mais a fundo?"
   - "Quer que eu compare o desempenho entre duas campanhas?"
   - "Deseja personalizar o período de análise?"
   - "Quer sugestões de otimização para alguma campanha específica?"
   - "Posso analisar palavras-chave ou público-alvo de alguma delas?"
5) Quando o usuário escolher uma campanha, dê insights e sugestões ACIONÁVEIS sem repetir os números que já estão visíveis.
6) Foque em ser um CONSULTOR que guia o usuário, não um relatório de dados.`;


    // If user is asking about campaigns and has a customer ID, fetch real data
    if (googleAdsCustomerId && isCampaignQuestion(messages)) {
      console.log("Campaign question detected, fetching Google Ads data for:", googleAdsCustomerId);
      const adsContext = await fetchGoogleAdsMetrics(googleAdsCustomerId);
      if (adsContext) {
        systemContent += `\n\nVocê tem acesso aos dados REAIS do Google Ads do usuário. Os dados e métricas JÁ ESTÃO SENDO EXIBIDOS no dashboard visual. NÃO repita números. Apenas faça perguntas inteligentes e ofereça insights consultivos.${adsContext}`;
      } else {
        systemContent += "\n\nO usuário tem uma conta Google Ads configurada mas não foi possível obter os dados no momento. Informe que houve um problema temporário ao acessar os dados.";
      }
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemContent },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione fundos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro no gateway de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
