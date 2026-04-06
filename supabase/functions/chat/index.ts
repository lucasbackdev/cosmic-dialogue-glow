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

const PLATE_REGEX = /\b([A-Za-z]{3}[-\s]?\d[A-Za-z0-9]\d{2})\b/;

function extractPlate(messages: { role: string; content: string }[]): string | null {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  if (!lastUserMsg) return null;
  const match = lastUserMsg.content.match(PLATE_REGEX);
  return match ? match[1].replace(/[-\s]/g, "").toUpperCase() : null;
}

function isCampaignQuestion(messages: { role: string; content: string }[]): boolean {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  if (!lastUserMsg) return false;
  const lower = lastUserMsg.content.toLowerCase();
  return CAMPAIGN_KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchVehicleData(placa: string): Promise<string | null> {
  const email = Deno.env.get("CONSULTAR_PLACA_EMAIL");
  const apiKey = Deno.env.get("CONSULTAR_PLACA_API_KEY");
  if (!email || !apiKey) return null;

  try {
    const basicAuth = btoa(`${email}:${apiKey}`);
    const resp = await fetch(
      `https://api.consultarplaca.com.br/v2/consultarPlaca?placa=${placa}`,
      { headers: { Authorization: `Basic ${basicAuth}` } }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.status !== "ok") return null;

    const d = data.dados?.informacoes_veiculo;
    if (!d) return null;

    const v = d.dados_veiculo || {};
    const t = d.dados_tecnicos || {};
    const c = d.dados_carga || {};

    let context = `\n\n[DADOS DO VEÍCULO - PLACA ${placa}]\n`;
    context += `Marca: ${v.marca || "N/A"}\n`;
    context += `Modelo: ${v.modelo || "N/A"}\n`;
    context += `Ano Fabricação: ${v.ano_fabricacao || "N/A"}\n`;
    context += `Ano Modelo: ${v.ano_modelo || "N/A"}\n`;
    context += `Cor: ${v.cor || "N/A"}\n`;
    context += `Combustível: ${v.combustivel || "N/A"}\n`;
    context += `Segmento: ${v.segmento || "N/A"}\n`;
    context += `Procedência: ${v.procedencia || "N/A"}\n`;
    context += `Município: ${v.municipio || "N/A"} - ${v.uf_municipio || "N/A"}\n`;
    context += `Chassi: ${v.chassi || "N/A"}\n`;
    if (t.tipo_veiculo) context += `Tipo: ${t.tipo_veiculo}\n`;
    if (t.sub_segmento) context += `Sub-segmento: ${t.sub_segmento}\n`;
    if (t.potencia) context += `Potência: ${t.potencia} cv\n`;
    if (t.cilindradas) context += `Cilindradas: ${t.cilindradas} cc\n`;
    if (t.numero_motor) context += `Motor: ${t.numero_motor}\n`;
    if (c.capacidade_passageiro) context += `Passageiros: ${c.capacidade_passageiro}\n`;
    if (c.numero_eixos) context += `Eixos: ${c.numero_eixos}\n`;

    return context;
  } catch (err) {
    console.warn("Error fetching vehicle data:", err);
    return null;
  }
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

async function fetchCampaignData(customerId: string): Promise<string | null> {
  const serviceAccountJson = Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_JSON");
  const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");

  if (!serviceAccountJson || !developerToken) return null;

  try {
    const accessToken = await getAccessToken(serviceAccountJson);
    const cleanId = customerId.replace(/-/g, "");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "Content-Type": "application/json",
    };

    // Fetch campaigns
    const campaignQuery = `
      SELECT campaign.name, campaign.status,
        metrics.impressions, metrics.clicks, metrics.ctr,
        metrics.average_cpc, metrics.conversions, metrics.cost_micros
      FROM campaign ORDER BY metrics.impressions DESC LIMIT 20
    `;

    const campaignResp = await fetch(
      `${GOOGLE_ADS_BASE}/customers/${cleanId}/googleAds:searchStream`,
      { method: "POST", headers, body: JSON.stringify({ query: campaignQuery }) }
    );

    if (!campaignResp.ok) {
      console.warn("Google Ads fetch failed:", campaignResp.status);
      return null;
    }

    const rawData = await campaignResp.json();
    const campaigns: { name: string; status: string; impressions: number; clicks: number; ctr: number; cpc: number; conversions: number; cost: number }[] = [];

    if (rawData && Array.isArray(rawData)) {
      for (const batch of rawData) {
        if (batch.results) {
          for (const row of batch.results) {
            const m = row.metrics || {};
            campaigns.push({
              name: row.campaign?.name || "Sem nome",
              status: row.campaign?.status || "UNKNOWN",
              impressions: Number(m.impressions || 0),
              clicks: Number(m.clicks || 0),
              ctr: Number(m.ctr || 0) * 100,
              cpc: Number(m.averageCpc || 0) / 1_000_000,
              conversions: Number(m.conversions || 0),
              cost: Number(m.costMicros || 0) / 1_000_000,
            });
          }
        }
      }
    }

    let context = `\n\n[DADOS DO GOOGLE ADS]\nCampanhas disponíveis:\n`;
    for (const c of campaigns) {
      context += `- ${c.name} [${c.status}]\n`;
    }
    return context;
  } catch (err) {
    console.warn("Error fetching Google Ads:", err);
    return null;
  }
}

async function fetchCampaignCreatives(customerId: string, campaignName: string): Promise<string | null> {
  const serviceAccountJson = Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_JSON");
  const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");

  if (!serviceAccountJson || !developerToken) return null;

  try {
    const accessToken = await getAccessToken(serviceAccountJson);
    const cleanId = customerId.replace(/-/g, "");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "Content-Type": "application/json",
    };

    // Fetch ad group ads with headlines, descriptions, and images
    const adQuery = `
      SELECT
        campaign.name,
        ad_group.name,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.ad.responsive_display_ad.headlines,
        ad_group_ad.ad.responsive_display_ad.descriptions,
        ad_group_ad.ad.responsive_display_ad.marketing_images,
        ad_group_ad.ad.responsive_display_ad.square_marketing_images,
        ad_group_ad.ad.responsive_display_ad.logo_images,
        ad_group_ad.ad.responsive_display_ad.long_headline,
        ad_group_ad.ad.responsive_display_ad.business_name,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.type,
        ad_group_ad.status,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.conversions,
        metrics.cost_micros
      FROM ad_group_ad
      WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
      ORDER BY metrics.impressions DESC
      LIMIT 10
    `;

    const adResp = await fetch(
      `${GOOGLE_ADS_BASE}/customers/${cleanId}/googleAds:searchStream`,
      { method: "POST", headers, body: JSON.stringify({ query: adQuery }) }
    );

    if (!adResp.ok) {
      const errText = await adResp.text();
      console.warn("Ad creatives fetch failed:", adResp.status, errText.slice(0, 300));
      return null;
    }

    const rawData = await adResp.json();
    let context = `\n\n[DETALHES DOS ANÚNCIOS DA CAMPANHA "${campaignName}"]\n`;

    if (rawData && Array.isArray(rawData)) {
      for (const batch of rawData) {
        if (!batch.results) continue;
        for (const row of batch.results) {
          const ad = row.adGroupAd?.ad || {};
          const adGroup = row.adGroup?.name || "Sem grupo";
          const status = row.adGroupAd?.status || "UNKNOWN";
          const m = row.metrics || {};
          const adType = ad.type || "UNKNOWN";

          context += `\n--- Anúncio (Grupo: ${adGroup}) [${status}] ---\n`;
          context += `Tipo: ${adType}\n`;

          if (ad.finalUrls?.length) {
            context += `URL final: ${ad.finalUrls.join(", ")}\n`;
          }

          // Responsive Search Ad
          const rsa = ad.responsiveSearchAd;
          if (rsa) {
            if (rsa.headlines?.length) {
              context += `Títulos:\n`;
              for (const h of rsa.headlines) {
                context += `  - "${h.text}" ${h.pinnedField ? `(fixado: ${h.pinnedField})` : ""}\n`;
              }
            }
            if (rsa.descriptions?.length) {
              context += `Descrições:\n`;
              for (const d of rsa.descriptions) {
                context += `  - "${d.text}" ${d.pinnedField ? `(fixado: ${d.pinnedField})` : ""}\n`;
              }
            }
          }

          // Responsive Display Ad
          const rda = ad.responsiveDisplayAd;
          if (rda) {
            if (rda.businessName) context += `Empresa: ${rda.businessName}\n`;
            if (rda.longHeadline?.text) context += `Título longo: "${rda.longHeadline.text}"\n`;
            if (rda.headlines?.length) {
              context += `Títulos:\n`;
              for (const h of rda.headlines) {
                context += `  - "${h.text}"\n`;
              }
            }
            if (rda.descriptions?.length) {
              context += `Descrições:\n`;
              for (const d of rda.descriptions) {
                context += `  - "${d.text}"\n`;
              }
            }
            if (rda.marketingImages?.length) {
              context += `Imagens de marketing: ${rda.marketingImages.length} imagem(ns)\n`;
            }
            if (rda.squareMarketingImages?.length) {
              context += `Imagens quadradas: ${rda.squareMarketingImages.length} imagem(ns)\n`;
            }
            if (rda.logoImages?.length) {
              context += `Logos: ${rda.logoImages.length} logo(s)\n`;
            }
          }

          context += `Métricas: ${Number(m.impressions || 0)} imp, ${Number(m.clicks || 0)} cli, CTR ${(Number(m.ctr || 0) * 100).toFixed(2)}%, ${Number(m.conversions || 0)} conv, Custo R$${(Number(m.costMicros || 0) / 1_000_000).toFixed(2)}\n`;
        }
      }
    }

    // Also fetch keywords
    const kwQuery = `
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.conversions,
        metrics.cost_micros
      FROM keyword_view
      WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
      ORDER BY metrics.impressions DESC
      LIMIT 15
    `;

    try {
      const kwResp = await fetch(
        `${GOOGLE_ADS_BASE}/customers/${cleanId}/googleAds:searchStream`,
        { method: "POST", headers, body: JSON.stringify({ query: kwQuery }) }
      );

      if (kwResp.ok) {
        const kwData = await kwResp.json();
        context += `\n[PALAVRAS-CHAVE]\n`;
        if (kwData && Array.isArray(kwData)) {
          for (const batch of kwData) {
            if (!batch.results) continue;
            for (const row of batch.results) {
              const kw = row.adGroupCriterion?.keyword || {};
              const m = row.metrics || {};
              context += `- "${kw.text}" [${kw.matchType}] ${row.adGroupCriterion?.status}: ${Number(m.impressions || 0)} imp, ${Number(m.clicks || 0)} cli, CTR ${(Number(m.ctr || 0) * 100).toFixed(2)}%, ${Number(m.conversions || 0)} conv\n`;
            }
          }
        }
      }
    } catch { /* keywords are optional */ }

    return context;
  } catch (err) {
    console.warn("Error fetching campaign creatives:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, googleAdsCustomerId, selectedCampaign } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemContent = `Você é a Orion, uma assistente virtual especializada em Google Ads, marketing digital e consulta veicular.

REGRAS CRÍTICAS DE RESPOSTA:
1) NUNCA liste métricas numéricas brutas no texto — os dados já estão no dashboard visual.
2) Seja CONVERSACIONAL — máximo 3-4 frases curtas, a menos que esteja analisando uma campanha selecionada ou dados de veículo.
3) Responda SEMPRE no mesmo idioma que o usuário usar.
4) Quando o usuário pedir campanhas/métricas SEM selecionar uma específica, diga que os dados estão no dashboard e faça perguntas como:
   - "Qual campanha quer analisar?"
   - "Quer personalizar o período?"
   - "Posso comparar campanhas?"
5) Foque em ser um CONSULTOR que guia o usuário.
6) Quando receber dados de veículo, apresente de forma organizada e bonita usando markdown. Dê uma análise do veículo incluindo:
   - Resumo dos dados principais
   - Estimativa de valor baseada no modelo/ano (se possível, sugira consultar a tabela FIPE)
   - Dicas relevantes sobre o veículo
   - Se o usuário perguntar sobre compra, dê dicas de verificação`;

    // Check for vehicle plate in message
    const detectedPlate = extractPlate(messages);
    if (detectedPlate) {
      console.log("Plate detected:", detectedPlate);
      const vehicleData = await fetchVehicleData(detectedPlate);
      if (vehicleData) {
        systemContent += `\n\nO usuário consultou uma placa de veículo. Apresente os dados de forma organizada e bonita com emojis e markdown.
Dê uma análise completa incluindo:
- 🚗 Dados do veículo formatados
- 💰 Sugestão de consultar tabela FIPE para valor
- ⚠️ Dicas de verificação se for compra
- 📊 Score geral do veículo baseado nos dados disponíveis (1-10)
${vehicleData}`;
      } else {
        systemContent += `\n\nO usuário tentou consultar a placa "${detectedPlate}" mas não foi possível obter os dados. Informe que houve um problema e peça para verificar se a placa está correta.`;
      }
    }

    // If a specific campaign is selected, fetch its creatives and do deep analysis
    if (googleAdsCustomerId && selectedCampaign) {
      console.log("Deep analysis requested for campaign:", selectedCampaign);
      const creativesContext = await fetchCampaignCreatives(googleAdsCustomerId, selectedCampaign);
      if (creativesContext) {
        systemContent += `\n\nO usuário selecionou a campanha "${selectedCampaign}" para análise detalhada. Você tem acesso aos anúncios, títulos, descrições, palavras-chave e métricas desta campanha.

INSTRUÇÕES PARA ANÁLISE:
1) Dê uma ANÁLISE SINCERA e DETALHADA da campanha.
2) PONTUE cada elemento de 1 a 10:
   - Títulos: avalie relevância, clareza, call-to-action, uso de palavras-chave
   - Descrições: avalie proposta de valor, urgência, diferencial
   - Palavras-chave: avalie relevância, tipos de correspondência, cobertura
   - URLs de destino: avalie se parecem adequadas
   - Imagens (se houver): comente sobre quantidade e variedade
3) Liste O QUE ESTÁ BOM ✅ e O QUE PODE MELHORAR ⚠️
4) Dê SUGESTÕES ESPECÍFICAS e acionáveis para cada ponto fraco
5) Termine com um resumo geral e nota da campanha
6) Use formatação markdown com headers para organizar

${creativesContext}`;
      } else {
        systemContent += `\n\nO usuário selecionou a campanha "${selectedCampaign}" mas não foi possível obter os detalhes dos anúncios. Dê sugestões gerais baseadas nas métricas visíveis no dashboard.`;
      }
    } else if (googleAdsCustomerId && isCampaignQuestion(messages)) {
      console.log("Campaign question detected, fetching Google Ads data for:", googleAdsCustomerId);
      const adsContext = await fetchCampaignData(googleAdsCustomerId);
      if (adsContext) {
        systemContent += `\n\nOs dados e métricas JÁ ESTÃO SENDO EXIBIDOS no dashboard visual. NÃO repita números. Apenas faça perguntas inteligentes e ofereça insights.${adsContext}`;
      } else {
        systemContent += "\n\nO usuário tem uma conta Google Ads configurada mas não foi possível obter os dados no momento. Informe que houve um problema temporário.";
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
