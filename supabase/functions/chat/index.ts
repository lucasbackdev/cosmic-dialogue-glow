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

const LEAD_KEYWORDS = [
  "lead", "leads", "prospecção", "prospeccao", "prospectar", "encontrar clientes",
  "brasileiros", "brasileiro", "empresas nos estados unidos", "empresas nos eua",
  "empresas no canadá", "empresas no canada", "empresas na europa",
  "tráfego pago", "trafego pago", "desenvolvedor web", "desenvolvimento web",
  "desenvolvimento de aplicativo", "app developer", "web developer",
  "buscar clientes", "encontrar empresas", "prospectar clientes",
  "empreendedores brasileiros", "brasileiros no exterior",
  "empresas que buscam", "pessoas que buscam", "quem precisa de",
  "serviço de", "mostre empresas", "mostre pessoas", "nicho", "nichos",
  "clientes potenciais", "marketing digital", "design", "consultoria",
  "contabilidade", "advocacia", "freelancer", "agência",
];

const PLATE_REGEX = /\b([A-Za-z]{3}[-\s]?\d[A-Za-z0-9]\d{2})\b/;

const VEHICLE_CONSULT_TYPES: Record<string, { keywords: string[]; label: string; price: string }> = {
  basica: { keywords: ["básica", "basica", "dados básicos", "dados basicos", "informações básicas"], label: "📋 Dados Básicos", price: "R$ 0,25" },
  fipe: { keywords: ["fipe", "preço", "preco", "valor", "tabela fipe", "quanto vale"], label: "💰 Preço FIPE", price: "R$ 0,79" },
  sinistro: { keywords: ["sinistro", "perda total", "pt", "batida", "acidente"], label: "💥 Sinistro / Perda Total", price: "R$ 3,60" },
  roubo: { keywords: ["roubo", "furto", "roubado", "furtado"], label: "🚨 Histórico Roubo e Furto", price: "R$ 5,52" },
  leilao: { keywords: ["leilão", "leilao", "leiloado"], label: "🔨 Registro de Leilão", price: "R$ 13,52" },
  gravame: { keywords: ["gravame", "financiamento", "alienação", "alienacao", "financiado"], label: "🏦 Gravame / Financiamento", price: "R$ 3,68" },
  infracoes: { keywords: ["infração", "infracao", "multa", "multas", "débito", "debito", "renainf"], label: "📝 Infrações (RENAINF)", price: "R$ 3,60" },
};

function extractPlate(messages: { role: string; content: string }[]): string | null {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  if (!lastUserMsg) return null;
  const match = lastUserMsg.content.match(PLATE_REGEX);
  return match ? match[1].replace(/[-\s]/g, "").toUpperCase() : null;
}

function extractPlateFromHistory(messages: { role: string; content: string }[]): string | null {
  for (const m of [...messages].reverse()) {
    if (m.role === "user") {
      const match = m.content.match(PLATE_REGEX);
      if (match) return match[1].replace(/[-\s]/g, "").toUpperCase();
    }
  }
  return null;
}

function detectConsultTypes(text: string): string[] {
  const lower = text.toLowerCase();
  // Check for "tudo" / "completa" / "todas" first
  if (/(tudo|completa|todas|todos|relatório completo|relatorio completo)/.test(lower)) {
    return Object.keys(VEHICLE_CONSULT_TYPES);
  }
  const detected: string[] = [];
  for (const [key, info] of Object.entries(VEHICLE_CONSULT_TYPES)) {
    if (info.keywords.some(kw => lower.includes(kw))) {
      detected.push(key);
    }
  }
  return detected;
}

function isLeadProspectingQuestion(messages: { role: string; content: string }[]): boolean {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  if (!lastUserMsg) return false;
  const lower = lastUserMsg.content.toLowerCase();
  return LEAD_KEYWORDS.some(kw => lower.includes(kw));
}

function isCampaignQuestion(messages: { role: string; content: string }[]): boolean {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  if (!lastUserMsg) return false;
  const lower = lastUserMsg.content.toLowerCase();
  return CAMPAIGN_KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchVehicleData(placa: string, tipos: string[]): Promise<string | null> {
  const email = Deno.env.get("CONSULTAR_PLACA_EMAIL");
  const apiKey = Deno.env.get("CONSULTAR_PLACA_API_KEY");
  if (!email || !apiKey) return null;

  const basicAuth = btoa(`${email}:${apiKey}`);

  const ENDPOINTS: Record<string, { path: string; label: string }> = {
    basica: { path: "consultarPlaca", label: "Dados Básicos" },
    fipe: { path: "consultarPrecoFipe", label: "Preço FIPE" },
    sinistro: { path: "consultarSinistroComPerdaTotal", label: "Sinistro / Perda Total" },
    roubo: { path: "consultarHistoricoRouboFurto", label: "Histórico Roubo e Furto" },
    leilao: { path: "consultarRegistroLeilaoPrime", label: "Registro de Leilão" },
    gravame: { path: "consultarGravame", label: "Gravame / Financiamento" },
    infracoes: { path: "consultarRegistrosInfracoesRenainf", label: "Infrações (RENAINF)" },
  };

  try {
    let context = `\n\n[DADOS DO VEÍCULO - PLACA ${placa}]\n`;
    const validTypes = tipos.filter(t => ENDPOINTS[t]);

    const results = await Promise.all(
      validTypes.map(async (tipo) => {
        const ep = ENDPOINTS[tipo];
        try {
          const resp = await fetch(
            `https://api.consultarplaca.com.br/v2/${ep.path}?placa=${placa}`,
            { headers: { Authorization: `Basic ${basicAuth}` } }
          );
          const data = await resp.json();
          return { tipo, label: ep.label, data, ok: resp.ok };
        } catch (err) {
          console.warn(`Error fetching ${tipo}:`, err);
          return { tipo, label: ep.label, data: null, ok: false };
        }
      })
    );

    for (const r of results) {
      context += `\n--- ${r.label} ---\n`;
      if (!r.ok || !r.data || r.data.status !== "ok") {
        const msg = r.data?.mensagem || "Dados indisponíveis";
        const errorType = r.data?.tipo_do_erro || "";
        if (errorType === "credito_insuficiente") {
          context += `⚠️ CRÉDITOS INSUFICIENTES para esta consulta. O usuário precisa adicionar créditos em consultarplaca.com.br\n`;
        } else {
          context += `Indisponível: ${msg}\n`;
        }
        continue;
      }

      const d = r.data.dados;
      if (r.tipo === "basica" && d?.informacoes_veiculo) {
        const v = d.informacoes_veiculo.dados_veiculo || {};
        const t = d.informacoes_veiculo.dados_tecnicos || {};
        const c = d.informacoes_veiculo.dados_carga || {};
        context += `Marca: ${v.marca || "N/A"}\nModelo: ${v.modelo || "N/A"}\n`;
        context += `Ano Fabricação: ${v.ano_fabricacao || "N/A"}\nAno Modelo: ${v.ano_modelo || "N/A"}\n`;
        context += `Cor: ${v.cor || "N/A"}\nCombustível: ${v.combustivel || "N/A"}\n`;
        context += `Segmento: ${v.segmento || "N/A"}\nProcedência: ${v.procedencia || "N/A"}\n`;
        context += `Município: ${v.municipio || "N/A"} - ${v.uf_municipio || "N/A"}\n`;
        context += `Chassi: ${v.chassi || "N/A"}\n`;
        if (v.renavam) context += `RENAVAM: ${v.renavam}\n`;
        if (t.tipo_veiculo) context += `Tipo: ${t.tipo_veiculo}\n`;
        if (t.sub_segmento) context += `Sub-segmento: ${t.sub_segmento}\n`;
        if (t.potencia) context += `Potência: ${t.potencia} cv\n`;
        if (t.cilindradas) context += `Cilindradas: ${t.cilindradas} cc\n`;
        if (t.numero_motor) context += `Motor: ${t.numero_motor}\n`;
        if (c.capacidade_passageiro) context += `Passageiros: ${c.capacidade_passageiro}\n`;
      }

      if (r.tipo === "fipe" && d?.informacoes_veiculo?.preco_fipe) {
        const fipe = d.informacoes_veiculo.preco_fipe;
        context += `Referência: ${fipe.referencia || "N/A"}\n`;
        context += `Preço FIPE: ${fipe.preco || "N/A"}\n`;
        if (fipe.codigo_fipe) context += `Código FIPE: ${fipe.codigo_fipe}\n`;
      }

      if (r.tipo === "sinistro" && d?.registro_sinistro_com_perda_total) {
        const s = d.registro_sinistro_com_perda_total;
        context += `Possui registro: ${s.possui_registro}\n`;
        if (s.registro) context += `Detalhe: ${s.registro}\n`;
      }

      if (r.tipo === "roubo" && d?.historico_roubo_furto) {
        const rf = d.historico_roubo_furto.registros_roubo_furto;
        context += `Possui registro: ${rf?.possui_registro || "N/A"}\n`;
        if (rf?.registros?.length) {
          for (const reg of rf.registros) {
            context += `  - ${reg.tipo_ocorrencia} em ${reg.data_boletim_ocorrencia} (${reg.uf_ocorrencia})\n`;
          }
        }
      }

      if (r.tipo === "leilao" && d?.informacoes_sobre_leilao) {
        const l = d.informacoes_sobre_leilao;
        context += `Possui registro: ${l.possui_registro}\n`;
        if (l.registro_sobre_oferta) {
          const ro = l.registro_sobre_oferta;
          context += `Classificação: ${ro.classificacao || "N/A"}\n`;
          if (ro.leiloes?.length) {
            for (const lei of ro.leiloes) {
              context += `  - Leilão: ${lei.leiloeiro || "N/A"} | Lote: ${lei.lote || "N/A"} | Data: ${lei.data_leilao || "N/A"}\n`;
              context += `    Condição: ${lei.condicao_geral || "N/A"} | Comitente: ${lei.comitente || "N/A"}\n`;
            }
          }
        }
      }

      if (r.tipo === "gravame" && d?.gravame) {
        const g = d.gravame;
        context += `Possui gravame: ${g.possui_gravame}\n`;
        if (g.registro) {
          context += `Situação: ${g.registro.situacao || "N/A"}\n`;
          if (g.registro.agente_financeiro) {
            context += `Financeira: ${g.registro.agente_financeiro.nome || "N/A"}\n`;
          }
          if (g.registro.data_registro) context += `Data: ${g.registro.data_registro}\n`;
        }
      }

      if (r.tipo === "infracoes" && d?.registro_debitos_por_infracoes_renainf) {
        const inf = d.registro_debitos_por_infracoes_renainf.infracoes_renainf;
        context += `Possui infrações: ${inf?.possui_infracoes || "N/A"}\n`;
        if (inf?.infracoes?.length) {
          for (const i of inf.infracoes) {
            const di = i.dados_infracao || {};
            context += `  - ${di.infracao || "N/A"} | Valor: R$ ${di.valor_aplicado || "N/A"} | ${di.orgao_autuador || ""}\n`;
          }
        }
      }
    }

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
    const { messages, googleAdsCustomerId, selectedCampaign, vehicleConsultTypes } = await req.json();
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
6) Quando receber dados de veículo, apresente de forma organizada e bonita usando markdown com emojis.`;

    // Vehicle plate detection logic
    const detectedPlate = extractPlate(messages);
    const plateFromHistory = extractPlateFromHistory(messages);
    const lastUserMsg = [...messages].reverse().find((m: {role:string}) => m.role === "user");
    const lastUserText = lastUserMsg?.content || "";

    // Check if user is responding with consultation type choices (plate was in previous messages)
    const userConsultTypes = detectConsultTypes(lastUserText);
    
    // Explicit types passed from frontend (future use)
    const explicitTypes: string[] = Array.isArray(vehicleConsultTypes) ? vehicleConsultTypes : [];

    if (detectedPlate && (userConsultTypes.length > 0 || explicitTypes.length > 0)) {
      // User mentioned a plate AND specified what they want → fetch data
      const typesToFetch = explicitTypes.length > 0 ? explicitTypes : userConsultTypes;
      console.log("Fetching vehicle data for plate:", detectedPlate, "types:", typesToFetch);
      const vehicleData = await fetchVehicleData(detectedPlate, typesToFetch);
      if (vehicleData) {
        systemContent += `\n\nO usuário consultou a placa ${detectedPlate} com as seguintes consultas: ${typesToFetch.join(", ")}.
Apresente TODOS os dados de forma organizada e bonita com emojis e markdown.
Para cada tipo de consulta, crie uma seção com header.
Dê uma análise completa e um score geral (1-10) no final.
Se alguma consulta retornou "créditos insuficientes", informe o usuário que precisa adicionar créditos em consultarplaca.com.br.
${vehicleData}`;
      } else {
        systemContent += `\n\nO usuário tentou consultar a placa "${detectedPlate}" mas não foi possível obter os dados. Informe que houve um problema e peça para verificar se a placa está correta.`;
      }
    } else if (!detectedPlate && plateFromHistory && userConsultTypes.length > 0) {
      // User is responding with choices, plate is in history
      console.log("User choosing consult types for plate in history:", plateFromHistory, "types:", userConsultTypes);
      const vehicleData = await fetchVehicleData(plateFromHistory, userConsultTypes);
      if (vehicleData) {
        systemContent += `\n\nO usuário escolheu consultar: ${userConsultTypes.join(", ")} para a placa ${plateFromHistory}.
Apresente TODOS os dados de forma organizada e bonita com emojis e markdown.
Para cada tipo de consulta, crie uma seção com header.
Dê uma análise completa e um score geral (1-10) no final.
Se alguma consulta retornou "créditos insuficientes", informe o usuário que precisa adicionar créditos em consultarplaca.com.br.
${vehicleData}`;
      } else {
        systemContent += `\n\nNão foi possível obter os dados para a placa "${plateFromHistory}". Informe o problema ao usuário.`;
      }
    } else if (detectedPlate) {
      // Plate detected but no consultation type → frontend shows visual menu
      console.log("Plate detected, frontend will show menu:", detectedPlate);
      
      systemContent += `\n\nO usuário mencionou a placa "${detectedPlate}". NÃO faça a consulta ainda!
Responda APENAS com uma frase curta e amigável como: "Identifiquei a placa ${detectedPlate}! Selecione as consultas que deseja no painel ao lado e clique em Consultar."
NÃO liste as opções de consulta no texto — o menu visual já está sendo exibido no frontend automaticamente.
Seja breve, máximo 2 frases.`;
    }

    // Lead prospecting detection
    if (isLeadProspectingQuestion(messages)) {
      console.log("Lead prospecting question detected");
      systemContent += `\n\n[MODO PROSPECÇÃO DE LEADS ATIVADO]
Você agora é uma ESPECIALISTA em prospecção de leads B2B.

ANALISE o prompt do usuário:
- Se ele especificar um serviço (ex: "desenvolvimento web"), mostre leads diretos desse nicho
- Se ele NÃO especificar, mostre uma LISTA DE NICHOS para ele escolher

INSTRUÇÕES CRÍTICAS DE FORMATO:
Você DEVE incluir no início da sua resposta um bloco JSON entre as tags [LEADS_JSON] e [/LEADS_JSON].
Depois do bloco JSON, escreva uma análise conversacional curta (2-3 frases).

Se o usuário especificou o serviço, use este formato:
[LEADS_JSON]
{
  "leads": [
    {
      "name": "Nome da pessoa ou empresa",
      "company": "Nome da empresa",
      "country": "País",
      "city": "Cidade",
      "sector": "Nicho de atuação",
      "service_needed": "Serviço que busca",
      "website": "https://...",
      "linkedin": "https://linkedin.com/in/...",
      "instagram": "https://instagram.com/...",
      "whatsapp": "+1 (555) 123-4567",
      "phone": "+1 (555) 123-4567",
      "email": "contato@empresa.com",
      "score": 9,
      "search_query": "Exatamente o que a pessoa pesquisou no Google NO IDIOMA ORIGINAL (ex: 'web developer for small business near me')",
      "search_query_pt": "Tradução da pesquisa para português (ex: 'desenvolvedor web para pequena empresa perto de mim')",
      "recent_activity": "Abril 2026 - pesquisou por agência de marketing digital",
      "problem": "Descrição detalhada do problema que a empresa/pessoa enfrenta",
      "solution": "Como você pode resolver o problema dela com seu serviço",
      "outreach_message": "Mensagem pronta para enviar no WhatsApp/email para esta pessoa, personalizada e profissional",
      "fair_price": "USD $3,000 - $8,000 (~R$ 15.000 - R$ 40.000) - SEMPRE coloque o valor na moeda local do país do lead E a conversão em reais"
    }
  ],
  "strategies": [
    "Estratégia específica de prospecção 1",
    "Estratégia específica de prospecção 2"
  ]
}
[/LEADS_JSON]

Se o usuário NÃO especificou o serviço, use nichos:
[LEADS_JSON]
{
  "niches": [
    {
      "niche": "Desenvolvimento Web e Aplicativos",
      "leads": [
        { ... mesmo formato acima ... }
      ]
    },
    {
      "niche": "Tráfego Pago e Marketing Digital",
      "leads": [...]
    }
  ],
  "strategies": [...]
}
[/LEADS_JSON]

REGRAS:
1) Gere pelo menos 5-10 leads realistas por nicho baseados em tendências reais do mercado
2) Organize por score (maior primeiro) e atividade mais recente
3) OBRIGATÓRIO: inclua contato (whatsapp, telefone, email) - mesmo que estimados com base no perfil
4) OBRIGATÓRIO: search_query deve mostrar EXATAMENTE o que a pessoa pesquisou no Google NO IDIOMA ORIGINAL dela
5) OBRIGATÓRIO: search_query_pt deve ser a TRADUÇÃO para português da pesquisa
6) OBRIGATÓRIO: problem deve descrever o problema real que a empresa enfrenta
7) OBRIGATÓRIO: solution deve mostrar como resolver com o serviço oferecido
8) OBRIGATÓRIO: outreach_message deve ser uma mensagem pronta, personalizada, profissional para copiar e enviar
9) OBRIGATÓRIO: fair_price deve ter o valor NA MOEDA LOCAL do país do lead (USD, EUR, CAD) E a conversão em reais (R$)
9) recent_activity deve ter data estimada (mais recente possível) e o que buscou
10) Score de 1-10 baseado no potencial e urgência
11) Se o prompt não especificar serviço, crie pelo menos 5 nichos diferentes
12) As strategies devem ser acionáveis e específicas
13) APÓS o JSON, escreva APENAS 1 frase curta e direta como "Encontrei X leads no nicho Y. Os dados estão no painel." NÃO escreva parágrafos, NÃO repita dados do JSON, NÃO faça análise longa.
14) Seja honesto que os dados são baseados em tendências e análise de mercado`;
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
