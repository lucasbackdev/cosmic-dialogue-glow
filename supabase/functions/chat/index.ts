import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

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

const LEAD_NICHE_KEYWORDS = [
  "clínica", "clinica", "estética", "estetica", "distribuidora", "restaurante",
  "loja", "e-commerce", "ecommerce", "imobiliária", "imobiliaria", "contabilidade",
  "advocacia", "escritório", "escritorio", "consultório", "consultorio", "academia",
  "salão", "salao", "barbearia", "padaria", "pizzaria", "hamburgueria",
  "pet shop", "petshop", "oficina", "mecânica", "mecanica", "construtora",
  "arquitetura", "dentista", "odontologia", "psicologia", "nutrição", "nutricao",
  "fotografia", "marketing", "agência", "agencia", "farmácia", "farmacia",
  "escola", "curso", "treinamento", "coaching", "consultoria", "saúde", "saude",
  "beleza", "moda", "roupa", "calçado", "calcado", "joalheria", "ótica", "otica",
  "supermercado", "mercado", "atacado", "varejo", "importação", "importacao",
  "exportação", "exportacao", "logística", "logistica", "transporte", "frete",
  "tecnologia", "software", "app", "aplicativo", "site", "web", "automação", "automacao",
  "food truck", "cafeteria", "bar", "pub", "hotel", "pousada", "airbnb",
  "lavanderia", "limpeza", "segurança", "seguranca", "energia solar",
  "desenvolvimento", "developer", "web developer",
];

const LEAD_SERVICE_KEYWORDS = [
  "site", "website", "landing page", "lp", "aplicativo", "app", "automação", "automacao",
  "sistema", "crm", "chatbot", "e-commerce", "ecommerce", "integração", "integracao",
  "tráfego", "trafego", "google ads", "design", "marketing", "software",
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

const PORTAL_HOSTS = [
  "upwork.com",
  "freelancer.com",
  "workana.com",
  "99freelas.com.br",
  "fiverr.com",
  "toptal.com",
];

type ContactDetails = {
  website: string;
  linkedin: string;
  instagram: string;
  whatsapp: string;
  phone: string;
  email: string;
};

type LeadSearchResult = {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
  sourceType?: string;
  contactDetails?: ContactDetails;
};

type LeadRegion = "BR" | "US" | "CA" | "EU";

type SearchPlan = {
  region: LeadRegion;
  query: string;
  country?: string;
  lang?: string;
};

type SearchCandidate = LeadSearchResult & {
  region: LeadRegion;
  query: string;
};

type GeneratedLead = {
  name: string;
  company: string;
  country: string;
  city: string;
  sector: string;
  service_needed: string;
  website: string;
  linkedin: string;
  instagram: string;
  whatsapp: string;
  phone: string;
  email: string;
  search_query_pt: string;
  score: number;
  recent_activity: string;
  search_query: string;
  problem: string;
  solution: string;
  outreach_message: string;
  fair_price: string;
};

type RankedLead = {
  region: LeadRegion;
  lead: GeneratedLead;
  rank: number;
};

const LEAD_REGION_LABELS: Record<LeadRegion, string> = {
  BR: "🇧🇷 Brasil",
  US: "🇺🇸 Estados Unidos",
  CA: "🇨🇦 Canadá",
  EU: "🇪🇺 Europa",
};

function emptyContactDetails(): ContactDetails {
  return {
    website: "",
    linkedin: "",
    instagram: "",
    whatsapp: "",
    phone: "",
    email: "",
  };
}

function getHostname(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isPortalUrl(url?: string): boolean {
  const host = getHostname(url);
  return PORTAL_HOSTS.some((portalHost) => host === portalHost || host.endsWith(`.${portalHost}`));
}

function isSocialUrl(url?: string): boolean {
  const host = getHostname(url);
  return ["linkedin.com", "instagram.com", "facebook.com", "wa.me", "whatsapp.com", "t.me"]
    .some((socialHost) => host === socialHost || host.endsWith(`.${socialHost}`));
}

function toAbsoluteUrl(rawUrl: string, baseUrl?: string): string | null {
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractUrlsFromText(text: string, baseUrl?: string): string[] {
  const directMatches = text.match(/https?:\/\/[^\s<>"')\]]+/gi) || [];
  const markdownMatches = Array.from(text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/gi), (match) => match[1]);
  const wwwMatches = (text.match(/\bwww\.[^\s<>"')\]]+/gi) || []).map((value) => `https://${value}`);

  return Array.from(
    new Set(
      [...directMatches, ...markdownMatches, ...wwwMatches]
        .map((value) => value.replace(/[),.;]+$/g, ""))
        .map((value) => toAbsoluteUrl(value, baseUrl))
        .filter((value): value is string => Boolean(value))
    )
  );
}

function normalizePhoneNumber(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function mergeContactDetails(base: ContactDetails, extra: Partial<ContactDetails>): ContactDetails {
  return {
    website: base.website || extra.website || "",
    linkedin: base.linkedin || extra.linkedin || "",
    instagram: base.instagram || extra.instagram || "",
    whatsapp: base.whatsapp || extra.whatsapp || "",
    phone: base.phone || extra.phone || "",
    email: base.email || extra.email || "",
  };
}

function hasPublicContact(details: ContactDetails): boolean {
  return Boolean(
    details.website || details.linkedin || details.instagram || details.whatsapp || details.phone || details.email
  );
}

function classifyLeadSource(result: LeadSearchResult): string {
  const combined = `${result.title || ""} ${result.description || ""}`.toLowerCase();

  if (isPortalUrl(result.url)) {
    try {
      const pathname = new URL(result.url!).pathname.toLowerCase();
      if (/(job-search|search|browse|category|categories|freelance-jobs)/.test(pathname)) {
        return "portal_listing";
      }
    } catch {
      return "unknown";
    }
    return "project_posting";
  }

  if (/(criação de sites|criacao de sites|desenvolvimento web|desenvolvimento de sites|marketing digital|agência digital|agencia digital|software house|landing page|tráfego pago|trafego pago)/.test(combined)) {
    return "service_provider";
  }

  return "company_or_other";
}

function extractContactDetailsFromText(text: string, baseUrl?: string): ContactDetails {
  let details = emptyContactDetails();

  const emailMatches = [
    ...(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []),
    ...Array.from(text.matchAll(/mailto:([^\s"')>]+)/gi), (match) => match[1]),
  ];
  if (emailMatches[0]) {
    details.email = emailMatches[0].replace(/^mailto:/i, "").trim();
  }

  const whatsappLink = text.match(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s<>"')\]]+/i);
  if (whatsappLink?.[0]) {
    details.whatsapp = whatsappLink[0];
  }

  const whatsappText = text.match(/whatsapp[:\s]*([+\d()\s.-]{8,})/i);
  if (!details.whatsapp && whatsappText?.[1]) {
    details.whatsapp = normalizePhoneNumber(whatsappText[1]);
  }

  const telLink = text.match(/tel:([+\d()\s.-]{8,})/i);
  if (telLink?.[1]) {
    details.phone = normalizePhoneNumber(telLink[1]);
  }

  const validPhones = Array.from(text.matchAll(/(?:\+?\d[\d\s().-]{7,}\d)/g), (match) => normalizePhoneNumber(match[0]))
    .filter((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 8 && digits.length <= 15;
    });
  if (!details.phone && validPhones[0]) {
    details.phone = validPhones[0];
  }

  for (const url of extractUrlsFromText(text, baseUrl)) {
    const host = getHostname(url);
    if (!details.linkedin && (host === "linkedin.com" || host.endsWith(".linkedin.com"))) {
      details.linkedin = url;
      continue;
    }
    if (!details.instagram && (host === "instagram.com" || host.endsWith(".instagram.com"))) {
      details.instagram = url;
      continue;
    }
    if (!details.whatsapp && (host === "wa.me" || host.endsWith(".wa.me") || host === "whatsapp.com" || host.endsWith(".whatsapp.com"))) {
      details.whatsapp = url;
      continue;
    }
    if (!details.website && !isPortalUrl(url) && !isSocialUrl(url)) {
      details.website = new URL(url).origin;
    }
  }

  if (baseUrl) {
    const host = getHostname(baseUrl);
    if (!details.linkedin && (host === "linkedin.com" || host.endsWith(".linkedin.com"))) {
      details.linkedin = baseUrl;
    }
    if (!details.instagram && (host === "instagram.com" || host.endsWith(".instagram.com"))) {
      details.instagram = baseUrl;
    }
    if (!details.whatsapp && (host === "wa.me" || host.endsWith(".wa.me") || host === "whatsapp.com" || host.endsWith(".whatsapp.com"))) {
      details.whatsapp = baseUrl;
    }
  }

  if (!details.website && baseUrl && !isPortalUrl(baseUrl) && !isSocialUrl(baseUrl)) {
    details.website = new URL(baseUrl).origin;
  }

  return details;
}

function buildContactPageUrls(url: string): string[] {
  try {
    const origin = new URL(url).origin;
    return Array.from(new Set([
      origin,
      `${origin}/contato`,
      `${origin}/contact`,
      `${origin}/fale-conosco`,
      `${origin}/sobre`,
      `${origin}/about`,
    ]));
  } catch {
    return [url];
  }
}

async function scrapeContactDetails(url: string, firecrawlApiKey: string): Promise<ContactDetails> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: false,
      }),
    });

    if (!resp.ok) {
      console.warn("Firecrawl scrape failed for url:", url, resp.status);
      return emptyContactDetails();
    }

    const data = await resp.json();
    const markdown = data?.data?.markdown || data?.markdown || "";
    const sourceUrl = data?.data?.metadata?.sourceURL || data?.metadata?.sourceURL || url;
    return extractContactDetailsFromText(markdown, sourceUrl);
  } catch (error) {
    console.warn("Error scraping contact details for url:", url, error);
    return emptyContactDetails();
  }
}

async function enrichLeadSource(result: LeadSearchResult, firecrawlApiKey: string): Promise<LeadSearchResult> {
  let contactDetails = extractContactDetailsFromText(
    [result.title, result.description, result.markdown].filter(Boolean).join("\n"),
    result.url
  );
  const candidateUrls = new Set<string>();

  if (result.url && !isPortalUrl(result.url) && !isSocialUrl(result.url)) {
    candidateUrls.add(result.url);
  }

  if (contactDetails.website) {
    for (const candidateUrl of buildContactPageUrls(contactDetails.website)) {
      candidateUrls.add(candidateUrl);
    }
  }

  for (const extractedUrl of extractUrlsFromText([result.title, result.description, result.markdown].filter(Boolean).join("\n"), result.url)) {
    if (!isPortalUrl(extractedUrl) && !isSocialUrl(extractedUrl)) {
      candidateUrls.add(extractedUrl);
    }
  }

  const urlsToScrape = Array.from(candidateUrls).slice(0, 3);
  const scrapedContacts = await Promise.all(urlsToScrape.map((candidateUrl) => scrapeContactDetails(candidateUrl, firecrawlApiKey)));

  for (const scrapedContact of scrapedContacts) {
    contactDetails = mergeContactDetails(contactDetails, scrapedContact);
  }

  return {
    ...result,
    sourceType: classifyLeadSource(result),
    contactDetails,
  };
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripLeadRequestPrefix(text: string): string {
  return normalizeWhitespace(
    text
      .replace(/^(buscar|busque|quero|preciso|mostre|me dê|me de|encontre)\s+leads?\s+(reais\s+)?(de|para)\s+/i, "")
      .replace(/^leads?\s+(reais\s+)?(de|para)\s+/i, "")
      .replace(/^buscar\s+leads?\s+/i, "")
      .replace(/^nicho[:\s-]*/i, "")
  );
}

function cleanServiceText(text: string): string {
  return normalizeWhitespace(
    text
      .replace(/^(quero|vou|pretendo|posso)\s+(oferecer|prestar|vender)\s+/i, "")
      .replace(/^(serviç[oa]s?|service)[:\s-]*/i, "")
      .replace(/^o que eu quero prestar[:\s-]*/i, "")
  );
}

function extractLeadNiche(messages: { role: string; content: string }[]): string {
  const userMessages = [...messages].reverse().filter((message) => message.role === "user");

  for (const message of userMessages) {
    const cleaned = stripLeadRequestPrefix(message.content);
    const lower = cleaned.toLowerCase();
    if (!cleaned || cleaned.length > 120) continue;
    if (LEAD_NICHE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      return cleaned;
    }
  }

  return "";
}

function extractLeadService(messages: { role: string; content: string }[]): string {
  const userMessages = [...messages].reverse().filter((message) => message.role === "user");

  for (const message of userMessages) {
    const lower = message.content.toLowerCase();
    if (LEAD_SERVICE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      return cleanServiceText(message.content);
    }
  }

  return "";
}

function extractServiceSearchSnippet(serviceText: string): string {
  const lower = serviceText.toLowerCase();
  const matchedKeywords = LEAD_SERVICE_KEYWORDS.filter((keyword) => lower.includes(keyword));
  const uniqueKeywords = Array.from(new Set(matchedKeywords)).slice(0, 4);
  const fallbackKeywords = ["site", "aplicativo", "automação"];
  return (uniqueKeywords.length > 0 ? uniqueKeywords : fallbackKeywords)
    .map((keyword) => `"${keyword}"`)
    .join(" OR ");
}

function buildLeadSearchPlans(nicheText: string, serviceText: string): SearchPlan[] {
  const niche = nicheText || "empresa";
  const serviceSnippet = extractServiceSearchSnippet(serviceText);

  return [
    {
      region: "BR",
      country: "BR",
      lang: "pt",
      query: `"${niche}" ("preciso de desenvolvedor" OR "procuro desenvolvedor" OR "orçamento para site" OR "orçamento para aplicativo" OR "preciso de automação") (${serviceSnippet}) (site:99freelas.com.br OR site:workana.com OR site:linkedin.com OR site:instagram.com)`,
    },
    {
      region: "US",
      country: "US",
      lang: "en",
      query: `"${niche}" ("looking for developer" OR "need a website" OR "need an app" OR "need automation" OR "procuro desenvolvedor") (${serviceSnippet}) ("Brazilian" OR "empresa brasileira" OR "brasileiro") ("United States" OR USA OR "Estados Unidos") (site:upwork.com OR site:freelancer.com OR site:linkedin.com OR site:instagram.com)`,
    },
    {
      region: "CA",
      country: "CA",
      lang: "en",
      query: `"${niche}" ("looking for developer" OR "need a website" OR "need an app" OR "need automation" OR "procuro desenvolvedor") (${serviceSnippet}) ("Brazilian" OR "empresa brasileira" OR "brasileiro") (Canada OR Canadá) (site:upwork.com OR site:freelancer.com OR site:linkedin.com OR site:instagram.com)`,
    },
    {
      region: "EU",
      lang: "en",
      query: `"${niche}" ("looking for developer" OR "need a website" OR "need an app" OR "need automation" OR "procuro desenvolvedor") (${serviceSnippet}) ("Brazilian" OR "empresa brasileira" OR "brasileiro") (Europa OR Europe OR Portugal OR Ireland OR UK OR "United Kingdom" OR Espanha OR Spain) (site:upwork.com OR site:freelancer.com OR site:linkedin.com OR site:instagram.com)`,
    },
  ];
}

function normalizeUrlForDedup(url?: string): string {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    parsed.hash = "";
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "source",
      "fbclid",
      "gclid",
    ].forEach((param) => parsed.searchParams.delete(param));
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function dedupeByUrl<T extends { url?: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = normalizeUrlForDedup(item.url) || normalizeWhitespace(JSON.stringify(item)).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSourceLabel(url?: string): string {
  const host = getHostname(url);
  if (!host) return "Web";
  if (host.includes("upwork.com")) return "Upwork";
  if (host.includes("freelancer.com")) return "Freelancer";
  if (host.includes("workana.com")) return "Workana";
  if (host.includes("99freelas.com.br")) return "99Freelas";
  if (host.includes("linkedin.com")) return "LinkedIn";
  if (host.includes("instagram.com")) return "Instagram";
  return host.replace(/^www\./, "");
}

function extractRootLabel(url?: string): string {
  const host = getHostname(url);
  if (!host) return "";
  const parts = host.split(".");
  if (parts.length >= 3 && parts.slice(-2).join(".") === "com.br") {
    return parts[parts.length - 3];
  }
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

function titleizeSlug(value: string): string {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function portalPathLooksLikeProject(url?: string): boolean {
  if (!url) return false;

  try {
    const host = getHostname(url);
    const path = new URL(url).pathname.toLowerCase();

    if (host.includes("upwork.com")) {
      return /\/jobs\/|\/freelance-jobs\/|\/nx\/search\/jobs\/details\//.test(path);
    }
    if (host.includes("freelancer.com")) {
      return /\/projects\//.test(path);
    }
    if (host.includes("workana.com")) {
      return /\/job\//.test(path) || /\/jobs\/[a-z0-9-]+/.test(path);
    }
    if (host.includes("99freelas.com.br")) {
      return /\/projeto\//.test(path);
    }

    return false;
  } catch {
    return false;
  }
}

function containsHiringIntent(text: string): boolean {
  return /(preciso de|precisamos de|procuro|busco|buscando|orçamento para|orcamento para|quero contratar|contratar desenvolvedor|desenvolvedor para|minha empresa precisa|looking for|need (?:a |an )?(?:developer|website|app|automation)|developer needed|seeking (?:a |an )?developer|hiring|request for proposal|rfp|quote for|web development needed|indica(?:ç|c)[aã]o de desenvolvedor|recomenda(?:ç|c)[aã]o de desenvolvedor)/i.test(text);
}

function containsFreelancerOffer(text: string): boolean {
  return /(hire me|available for work|i am a developer|eu sou desenvolvedor|sou desenvolvedor|nossa ag[eê]ncia|nossa agencia|our agency|we build|we create websites|servi[çc]os de desenvolvimento|ag[eê]ncia especializada|agency that offers|portf[oó]lio|portfolio|software house|especialistas em)/i.test(text);
}

function hasDirectContact(details: ContactDetails): boolean {
  return Boolean(details.email || details.phone || details.whatsapp || details.linkedin || details.instagram);
}

function countContactSignals(details: ContactDetails): number {
  return [details.email, details.phone, details.whatsapp, details.linkedin, details.instagram, details.website]
    .filter(Boolean)
    .length;
}

function looksLikeLeadCandidate(result: SearchCandidate): boolean {
  const combined = normalizeWhitespace([result.title, result.description, result.markdown].filter(Boolean).join(" "));
  if (!combined) return false;

  const lower = combined.toLowerCase();
  if (containsFreelancerOffer(lower) && !containsHiringIntent(lower)) return false;
  if (classifyLeadSource(result) === "portal_listing") return false;

  if (isPortalUrl(result.url)) {
    return portalPathLooksLikeProject(result.url) || containsHiringIntent(lower);
  }

  return containsHiringIntent(lower);
}

function hasBrazilianContext(result: SearchCandidate): boolean {
  const contactDetails = result.contactDetails || emptyContactDetails();
  const combined = normalizeWhitespace([
    result.title,
    result.description,
    result.markdown,
    result.url,
    contactDetails.website,
    contactDetails.linkedin,
    contactDetails.instagram,
  ].filter(Boolean).join(" ")).toLowerCase();

  return /(brasileir|brazilian|brasil|portugu[eê]s|portuguese|\.com\.br)/i.test(combined);
}

function extractLeadExcerpt(text: string, maxLength = 180): string {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return "";

  const lower = normalized.toLowerCase();
  const needles = [
    "preciso de",
    "procuro",
    "orçamento para",
    "looking for",
    "need a",
    "need an",
    "need developer",
    "developer needed",
    "hiring",
  ];

  const foundIndex = needles
    .map((needle) => lower.indexOf(needle))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (typeof foundIndex === "number") {
    const start = Math.max(0, foundIndex - 20);
    return normalized.slice(start, start + maxLength).trim();
  }

  return normalized.slice(0, maxLength).trim();
}

function extractDateSnippet(text: string): string {
  const normalized = normalizeWhitespace(text);
  const patterns = [
    /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/i,
    /\b\d{1,2}\s+(?:de\s+)?(?:janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december)\s+(?:de\s+)?\d{4}\b/i,
    /\b(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|feb|apr|aug|sep|oct|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i,
    /\b(?:posted|published|publicado|postado)\s+(?:on\s+)?[^.|\n]{0,40}/i,
    /\b(?:today|yesterday|hoje|ontem)\b/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[0]) return match[0];
  }

  return "";
}

function extractBudgetSnippet(text: string): string {
  const normalized = normalizeWhitespace(text);
  const patterns = [
    /(?:R\$|US\$|USD|CAD\$|C\$|€|EUR|\$)\s?\d[\d.,]*(?:\s?(?:-|a|to)\s?(?:R\$|US\$|USD|CAD\$|C\$|€|EUR|\$)?\s?\d[\d.,]*)?/i,
    /(?:budget|orçamento|orcamento|faixa)\s*[:\-]?\s*[^.|\n]{0,40}/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[0]) return match[0].trim();
  }

  return "";
}

function buildRecentActivity(text: string, url?: string): string {
  const dateSnippet = extractDateSnippet(text);
  const sourceLabel = getSourceLabel(url);

  if (dateSnippet && sourceLabel) return `${sourceLabel} · ${dateSnippet}`;
  if (dateSnippet) return dateSnippet;
  if (sourceLabel) return `Fonte: ${sourceLabel}`;
  return "";
}

function inferServiceNeeded(text: string, serviceText: string): string {
  const lower = text.toLowerCase();
  if (/(app|aplicativo|mobile)/i.test(lower)) return "Desenvolvimento de aplicativo";
  if (/(automação|automacao|automation|workflow|integraç|integrac|bot|chatbot)/i.test(lower)) return "Automação de processos";
  if (/(site|website|landing page|e-commerce|ecommerce|loja virtual)/i.test(lower)) return "Criação ou melhoria de site";
  return serviceText || "Criação de site, app ou automação";
}

function calculateLeadScore(text: string, details: ContactDetails, recentActivity: string, portal: boolean): number {
  let score = 4;
  if (details.email) score += 2;
  if (details.phone) score += 2;
  if (details.whatsapp) score += 2;
  if (details.linkedin || details.instagram) score += 1;
  if (details.website && !isPortalUrl(details.website)) score += 1;
  if (containsHiringIntent(text)) score += 1;
  if (recentActivity) score += 1;
  if (portal && !hasDirectContact(details)) score -= 1;
  return Math.max(1, Math.min(10, score));
}

function extractCompanyName(result: SearchCandidate, details: ContactDetails): string {
  const companyUrl = details.website && !isPortalUrl(details.website) && !isSocialUrl(details.website)
    ? details.website
    : (!isPortalUrl(result.url) && !isSocialUrl(result.url) ? result.url : "");

  if (companyUrl) {
    return titleizeSlug(extractRootLabel(companyUrl));
  }

  return "";
}

function extractLeadName(result: SearchCandidate, companyName: string): string {
  const rawTitle = normalizeWhitespace(result.title || "");
  const cleanedTitle = rawTitle.replace(/\s*[|\-–]\s*(Upwork|Freelancer|Workana|99Freelas|LinkedIn|Instagram).*$/i, "").trim();

  if (cleanedTitle) {
    return cleanedTitle.slice(0, 90);
  }

  if (companyName) return companyName;
  return getSourceLabel(result.url);
}

function buildOutreachMessage(name: string, serviceText: string, sourceLabel: string): string {
  const greeting = name ? `Oi, ${name}!` : "Oi!";
  const offer = serviceText || "site, aplicativo ou automação";
  return `${greeting} Vi seu pedido em ${sourceLabel} e posso ajudar com ${offer}. Se fizer sentido, te mando uma proposta rápida.`;
}

function buildLeadFromCandidate(result: SearchCandidate, nicheText: string, serviceText: string): GeneratedLead {
  const details = mergeContactDetails(emptyContactDetails(), result.contactDetails || emptyContactDetails());
  const combinedText = normalizeWhitespace([result.title, result.description, result.markdown].filter(Boolean).join(" "));
  const companyName = extractCompanyName(result, details);
  const name = extractLeadName(result, companyName);
  const searchQuery = extractLeadExcerpt(combinedText || result.title || result.description || "");
  const recentActivity = buildRecentActivity(combinedText, result.url);
  const budget = extractBudgetSnippet(combinedText);
  const score = calculateLeadScore(combinedText, details, recentActivity, isPortalUrl(result.url));
  const linkedin = details.linkedin || (result.url && getHostname(result.url).includes("linkedin.com") ? result.url : "");
  const instagram = details.instagram || (result.url && getHostname(result.url).includes("instagram.com") ? result.url : "");
  const website = details.website || (result.url && !isSocialUrl(result.url) ? result.url : "");
  const sourceLabel = getSourceLabel(result.url);

  return {
    name,
    company: companyName,
    country: LEAD_REGION_LABELS[result.region],
    city: "",
    sector: nicheText,
    service_needed: inferServiceNeeded(combinedText, serviceText),
    website,
    linkedin,
    instagram,
    whatsapp: details.whatsapp,
    phone: details.phone,
    email: details.email,
    search_query_pt: "",
    score,
    recent_activity: recentActivity,
    search_query: searchQuery,
    problem: searchQuery ? `Pedido real encontrado: ${searchQuery}` : "",
    solution: serviceText ? `Oferecer ${serviceText} com foco nesse nicho.` : "",
    outreach_message: buildOutreachMessage(companyName || name, serviceText, sourceLabel),
    fair_price: budget,
  };
}

function buildLeadStrategies(leads: GeneratedLead[], serviceText: string): string[] {
  const directContactCount = leads.filter((lead) => Boolean(lead.email || lead.phone || lead.whatsapp || lead.linkedin || lead.instagram)).length;
  const internationalCount = leads.filter((lead) => lead.country !== LEAD_REGION_LABELS.BR).length;

  return [
    directContactCount > 0
      ? `Comece pelos ${directContactCount} leads com contato direto público.`
      : "Comece pelos leads com site oficial e formulário ativo.",
    internationalCount > 0
      ? `Priorize os ${internationalCount} leads fora do Brasil destacando que você atende brasileiros no exterior remotamente.`
      : "Peça uma nova rodada focada em EUA, Canadá ou Europa para ampliar a prospecção.",
    serviceText
      ? `Abra a conversa oferecendo ${serviceText} com um exemplo curto do resultado que você entrega.`
      : "Defina no chat se quer vender site, app ou automação para qualificar melhor os próximos leads.",
  ].slice(0, 3);
}

function dedupeRankedLeads(items: RankedLead[]): RankedLead[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const lead = item.lead;
    const key = [
      lead.email,
      lead.phone,
      lead.whatsapp,
      lead.linkedin,
      lead.instagram,
      lead.website,
      `${lead.name}-${lead.country}`,
    ].find(Boolean) || `${lead.name}-${lead.country}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function selectBalancedLeads(items: RankedLead[], maxItems = 10): RankedLead[] {
  const grouped: Record<LeadRegion, RankedLead[]> = {
    BR: [],
    US: [],
    CA: [],
    EU: [],
  };

  items.forEach((item) => grouped[item.region].push(item));
  (Object.keys(grouped) as LeadRegion[]).forEach((region) => {
    grouped[region].sort((a, b) => b.rank - a.rank);
  });

  const selected: RankedLead[] = [];
  const usedKeys = new Set<string>();

  for (const region of Object.keys(grouped) as LeadRegion[]) {
    for (const item of grouped[region].slice(0, 2)) {
      const key = `${item.lead.name}-${item.lead.country}-${item.lead.website || item.lead.linkedin || item.lead.instagram || item.lead.email}`;
      if (usedKeys.has(key)) continue;
      usedKeys.add(key);
      selected.push(item);
    }
  }

  const remaining = items
    .slice()
    .sort((a, b) => b.rank - a.rank)
    .filter((item) => {
      const key = `${item.lead.name}-${item.lead.country}-${item.lead.website || item.lead.linkedin || item.lead.instagram || item.lead.email}`;
      return !usedKeys.has(key);
    });

  for (const item of remaining) {
    if (selected.length >= maxItems) break;
    selected.push(item);
  }

  return selected.slice(0, maxItems);
}

async function searchLeadCandidates(searchPlans: SearchPlan[], firecrawlApiKey: string): Promise<SearchCandidate[]> {
  const searchResults = await Promise.all(
    searchPlans.map(async (plan) => {
      try {
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: plan.query,
            limit: 10,
            lang: plan.lang,
            country: plan.country,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (!response.ok) {
          console.warn("Firecrawl search failed for region:", plan.region, response.status);
          return [] as SearchCandidate[];
        }

        const data = await response.json();
        const results = Array.isArray(data?.data) ? data.data : [];
        return results.map((result: LeadSearchResult) => ({
          ...result,
          region: plan.region,
          query: plan.query,
        }));
      } catch (error) {
        console.warn("Firecrawl search error for region:", plan.region, error);
        return [] as SearchCandidate[];
      }
    })
  );

  return dedupeByUrl(searchResults.flat());
}

function createSseTextResponse(content: string): Response {
  const created = Math.floor(Date.now() / 1000);
  const id = `lead-${crypto.randomUUID()}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const push = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      push({
        id,
        object: "chat.completion.chunk",
        created,
        model: "orion-leads",
        choices: [{ index: 0, delta: { role: "assistant", content }, finish_reason: null }],
      });
      push({
        id,
        object: "chat.completion.chunk",
        created,
        model: "orion-leads",
        choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: "stop", native_finish_reason: "STOP" }],
      });
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
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
    const { messages, googleAdsCustomerId, selectedCampaign, vehicleConsultTypes, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine action type and credit cost based on token consumption
    const lastUserText = ([...messages].reverse().find((m: {role:string}) => m.role === "user")?.content || "").toLowerCase();
    let actionType = "chat";
    let creditCost = 1; // default: simple chat (~800 tokens)

    const CREATE_KEYWORDS = ["criar campanha", "crie uma campanha", "nova campanha", "create campaign", "montar campanha", "criar do zero"];
    const EDIT_KEYWORDS = ["editar campanha", "alterar lance", "mudar orçamento", "ajustar lance", "pausar campanha", "ativar campanha", "alterar palavras", "mudar estratégia", "edit campaign"];
    const ANALYZE_KEYWORDS = ["analisar campanha", "análise", "analise", "como está", "performance", "desempenho", "relatório", "métricas"];
    const LIST_KEYWORDS = ["listar campanhas", "minhas campanhas", "mostrar campanhas", "quais campanhas", "list campaigns"];

    if (isLeadProspectingQuestion(messages)) {
      actionType = "lead_search"; creditCost = 15; // ~12k tokens + Firecrawl API
    } else if (extractPlate(messages)) {
      actionType = "vehicle_consult"; creditCost = 8; // ~3k tokens + external API
    } else if (CREATE_KEYWORDS.some(kw => lastUserText.includes(kw))) {
      actionType = "campaign_create"; creditCost = 10; // ~8k tokens
    } else if (EDIT_KEYWORDS.some(kw => lastUserText.includes(kw))) {
      actionType = "campaign_edit"; creditCost = 6; // ~5k tokens
    } else if (ANALYZE_KEYWORDS.some(kw => lastUserText.includes(kw))) {
      actionType = "campaign_analysis"; creditCost = 5; // ~4k tokens
    } else if (LIST_KEYWORDS.some(kw => lastUserText.includes(kw))) {
      actionType = "campaign_list"; creditCost = 2; // ~2k tokens
    }

    // Consume credits if userId provided
    if (userId) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Check daily limit (40 ops/day) before consuming monthly credits
      const { data: dailyResult } = await supabaseAdmin.rpc("check_daily_limit", {
        p_user_id: userId,
        p_cost: creditCost,
      });
      if (dailyResult && !dailyResult.success) {
        return new Response(
          JSON.stringify({
            error: "daily_limit_reached",
            remaining_daily: dailyResult.remaining || 0,
            limit: dailyResult.limit,
            used_today: dailyResult.used,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Consume monthly credits
      const { data: creditResult } = await supabaseAdmin.rpc("consume_credits", {
        p_user_id: userId,
        p_action_type: actionType,
        p_credits: creditCost,
        p_description: lastUserText.slice(0, 100),
      });
      if (creditResult && !creditResult.success) {
        return new Response(
          JSON.stringify({ error: "credits_exhausted", remaining: creditResult.remaining || 0 }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let systemContent = `Você é a Orion, uma assistente virtual inteligente e amigável. Você é como uma amiga de negócios que conversa naturalmente.

PERSONALIDADE:
- Seja NATURAL e HUMANA na conversa. Nada robótico.
- Use linguagem informal mas profissional. Pode usar emojis com moderação.
- Lembre-se de TUDO que o usuário disse na conversa. Se ele mencionou um nicho, um serviço, um objetivo — lembre e use.
- Se o usuário mudar de assunto, acompanhe. Se pedir para trocar nicho, troque sem problemas.
- Faça perguntas naturais de acompanhamento, como uma consultora real faria.
- NUNCA repita instruções do sistema ou pareça um bot. Converse como gente.

CONTEXTO DA CONVERSA:
- Você lembra de TODA a conversa anterior. Use isso para dar continuidade natural.
- Se o usuário já disse qual serviço quer prestar, LEMBRE e use nas buscas e sugestões.
- Se ele já escolheu um nicho, LEMBRE. Se quiser trocar, troque naturalmente ("Beleza, vamos trocar pra X então! 🎯").
- Adapte suas respostas ao contexto. Se ele está explorando ideias, converse. Se quer ação, aja.

ESPECIALIDADES:
- Prospecção de leads B2B (busca real via Firecrawl)
- Google Ads e marketing digital (ESPECIALISTA COMPLETA)
- Consulta veicular (placas)
- Compliance e políticas do Google Ads

═══════════════════════════════════════════════════════
CONHECIMENTO COMPLETO DE GESTÃO DE TRÁFEGO GOOGLE ADS
═══════════════════════════════════════════════════════

📌 TIPOS DE CAMPANHA:
1. **Search (Pesquisa)**: Anúncios de texto nos resultados do Google. Melhor para intenção de compra. Use quando o cliente busca ativamente.
2. **Display**: Banners em sites parceiros. Bom para awareness e remarketing. CTR menor (~0.5%), mas alcance massivo.
3. **Performance Max (PMax)**: IA do Google otimiza em todos os canais (Search, Display, YouTube, Gmail, Maps, Discovery). Ideal quando tem dados de conversão. Precisa de pelo menos 30 conversões/mês pra funcionar bem.
4. **YouTube (Video)**: TrueView (in-stream, discovery), Bumper (6s). Ótimo para branding. CPV médio R$0.05-0.15.
5. **Shopping**: Para e-commerce. Precisa de Google Merchant Center. Mostra foto, preço, loja.
6. **Demand Gen**: Substituto do Discovery. Anúncios visuais no YouTube, Gmail, Discover.
7. **App Campaigns**: Promoção de apps. CPI (custo por instalação).

📌 ESTRATÉGIAS DE LANCE:
- **Maximize Conversions**: Melhor pra quem tem orçamento definido e quer volume. Pode gastar todo orçamento diário.
- **Target CPA (tCPA)**: Define quanto quer pagar por conversão. Precisa de histórico (30+ conversões). Comece 20% acima do CPA real e vá reduzindo.
- **Target ROAS (tROAS)**: Para e-commerce. Define retorno desejado (ex: 400% = R$4 de receita por R$1 gasto).
- **Maximize Clicks**: Fase de aprendizado ou quando precisa de tráfego. NÃO use longo prazo.
- **Manual CPC**: Controle total. Bom para contas pequenas ou nichos específicos. Use Enhanced CPC com cautela.
- **Maximize Conversion Value**: Prioriza conversões de maior valor. Ideal para e-commerce com produtos de preços variados.

📌 ESTRUTURA DE CONTA IDEAL:
- 1 conta = 1 negócio
- Campanhas separadas por: objetivo (vendas/leads/awareness), tipo (search/display/pmax), região, idioma
- Grupos de anúncios: 10-20 palavras-chave por grupo, tematicamente agrupadas
- SKAGs (Single Keyword Ad Groups) = ultrapassado. Prefira grupos temáticos com 5-15 keywords.

📌 PALAVRAS-CHAVE:
- **Broad Match**: Alcance máximo, menos controle. Funciona bem com Smart Bidding.
- **Phrase Match**: Equilíbrio. Captura variações que mantêm a intenção.
- **Exact Match**: Controle máximo. Use para termos de alta conversão.
- **Negativas**: ESSENCIAL. Revise o relatório de termos de pesquisa semanalmente. Adicione irrelevantes como negativas.
- **Quality Score (QS)**: Nota 1-10. Componentes: CTR esperado, relevância do anúncio, experiência da landing page. QS > 7 = bom. QS < 5 = otimize urgentemente.
- **Custo real = Lance × (QS do concorrente / seu QS) + R$0.01**. QS alto = paga menos.

📌 OTIMIZAÇÃO DE ANÚNCIOS:
- **RSA (Responsive Search Ads)**: Mínimo 8-10 títulos, 3-4 descrições. Use "pin" com cautela.
- **Extensões obrigatórias**: Sitelinks (4+), Callouts (4+), Snippets estruturados, Extensão de chamada, Local.
- **Teste A/B**: Sempre tenha 2-3 anúncios por grupo. Rotação "Optimize" para IA escolher.
- **CTAs fortes**: "Solicite Orçamento", "Agende Grátis", "Teste 7 Dias", "Compre Agora com 20% OFF".

📌 FUNIL DE CONVERSÃO:
- **TOFU (Topo)**: Awareness. Display, YouTube, Demand Gen. Keywords amplas. CPC baixo.
- **MOFU (Meio)**: Consideração. Search com phrase match. Remarketing de visitantes. Conteúdo educativo.
- **BOFU (Fundo)**: Conversão. Search exact match. Remarketing de carrinho. Ofertas diretas. CPA mais alto mas maior conversão.

📌 REMARKETING & AUDIÊNCIAS:
- **Remarketing Padrão**: Visitantes do site nos últimos 30-90 dias.
- **RLSA (Remarketing Lists for Search Ads)**: Ajuste lances para quem já visitou.
- **Similar/Lookalike**: Google cria audiência similar aos seus convertidores.
- **In-Market**: Pessoas ativamente pesquisando produtos/serviços do seu nicho.
- **Custom Intent**: Crie audiência baseada em URLs e keywords que seu público pesquisa.
- **Customer Match**: Upload de lista de emails/telefones. Mínimo 1000 contatos.

📌 OTIMIZAÇÃO DE ORÇAMENTO:
- **Regra 80/20**: 80% do orçamento nas campanhas que convertem, 20% em testes.
- **Day Parting**: Analise horários de conversão. Aumente lances em horários pico, reduza de madrugada.
- **Geo Targeting**: Ajuste lances por região. Ex: +20% em SP, -30% em regiões com baixo ROI.
- **Device Bidding**: Mobile vs Desktop. Analise taxas de conversão por dispositivo.
- **Orçamento compartilhado**: Use com cautela. Pode fazer uma campanha "roubar" orçamento de outra.
- **Impression Share**: Se IS < 80% por orçamento, aumente. Se IS < 80% por ranking, melhore QS/lances.

📌 LANDING PAGES:
- Velocidade: < 3 segundos de carregamento. Use PageSpeed Insights.
- Mobile-first: 60%+ do tráfego é mobile.
- Headline = deve espelhar o anúncio.
- CTA acima da dobra. Formulário curto (nome, email, telefone).
- Prova social: depoimentos, logos de clientes, números.
- Sem menu de navegação (evite saídas).

📌 MÉTRICAS E BENCHMARKS POR NICHO:
- **E-commerce**: CTR 2-3%, CPC R$0.50-2.00, Taxa conv. 2-4%, ROAS ideal 400%+
- **Serviços locais**: CTR 4-6%, CPC R$2-8, Taxa conv. 5-10%
- **SaaS/Software**: CTR 2-4%, CPC R$5-15, Taxa conv. 2-5%
- **Saúde/Estética**: CTR 3-5%, CPC R$1-4, Taxa conv. 3-7%
- **Educação**: CTR 3-5%, CPC R$1-3, Taxa conv. 3-8%
- **Imobiliário**: CTR 2-4%, CPC R$3-10, Taxa conv. 1-3%
- **Advocacia**: CTR 2-4%, CPC R$5-20, Taxa conv. 3-7%

📌 ALERTAS DE PERFORMANCE:
- CTR < 2% em Search = anúncios ou keywords ruins
- CPA subindo > 20% semana a semana = investigar
- Quality Score < 5 = landing page ou relevância ruim
- Impression Share < 50% = orçamento muito baixo ou lances ruins
- Taxa de rejeição LP > 70% = landing page precisa melhorar
- Conversões caindo com mesmo gasto = fadiga de anúncio ou sazonalidade

═══════════════════════════════════════════════════════
POLÍTICAS DO GOOGLE ADS — COMPLIANCE E DETECÇÃO DE VIOLAÇÕES
═══════════════════════════════════════════════════════

⚠️ VOCÊ DEVE ANALISAR PROATIVAMENTE se o que o usuário descreve (anúncio, landing page, produto, serviço) pode violar políticas do Google. Se detectar risco, AVISE IMEDIATAMENTE com:
- Qual política está em risco
- Consequência (reprovação, suspensão, banimento)
- Como corrigir

📛 CONTEÚDO PROIBIDO (BANIMENTO IMEDIATO):
1. **Produtos falsificados**: Réplicas, imitações de marca. Tolerância ZERO.
2. **Produtos perigosos**: Drogas recreativas, armas, munição, explosivos, tabaco, cigarros eletrônicos (em muitos países).
3. **Facilitação de desonestidade**: Hackers, documentos falsos, manipulação acadêmica, tráfego falso.
4. **Conteúdo inapropriado**: Bullying, discriminação, violência gráfica, exploração sexual, temas sensíveis sem contexto.
5. **Software malicioso**: Malware, phishing, coleta não autorizada de dados.

📛 CONTEÚDO RESTRITO (REGRAS ESPECÍFICAS):
1. **Conteúdo sexual/adulto**: Proibido na maioria dos formatos. Permitido em sites adultos com restrições (sem menores, sem tráfego acidental).
2. **Álcool**: Permitido em alguns países com restrições (não pode direcionar a menores, não promover consumo excessivo).
3. **Jogos de azar e apostas**: Precisa de certificação do Google. Proibido sem licença.
4. **Saúde e medicamentos**: Farmácias precisam de certificação. Proibido: medicamentos sem receita que exigem receita, curas milagrosas.
5. **Serviços financeiros**: Precisa de certificação. Regras rígidas para empréstimos (APR, taxas visíveis).
6. **Marcas registradas**: Não use marcas de terceiros nos anúncios sem autorização. Pode usar em keywords.
7. **Criptomoedas**: Exchanges e carteiras precisam de certificação do Google.
8. **Suplementos**: Proibidos anúncios de anabolizantes, esteroides, efedrina. Suplementos comuns OK mas sem claims de saúde exagerados.

📛 POLÍTICAS EDITORIAIS (REPROVAÇÃO DE ANÚNCIOS):
1. **Clickbait**: "Você NÃO VAI ACREDITAR", sensacionalismo exagerado.
2. **CAIXA ALTA excessiva**: "COMPRE AGORA!!!" → reprovado.
3. **Pontuação excessiva**: "Oferta!!!" "Incrível???".
4. **Caracteres especiais**: ★★★, ♦♦♦, ➤➤➤ → reprovados.
5. **Número de telefone no texto do anúncio**: Use extensão de chamada, não coloque no título/descrição.
6. **Espaçamento irregular**: "C O M P R E   A G O R A".
7. **URL inválida ou não funcional**: Landing page com erro 404, redirecionamento excessivo.
8. **Conteúdo do anúncio ≠ Landing page**: Se o anúncio promete X, a LP deve entregar X.

📛 POLÍTICAS DE LANDING PAGE:
1. **Deve funcionar**: Sem erros 404, sem carregamento infinito.
2. **Navegável e transparente**: Informações claras sobre o negócio.
3. **Política de privacidade obrigatória**: TODA LP com formulário PRECISA de link para política de privacidade.
4. **Termos de serviço**: Recomendado, especialmente para serviços financeiros, saúde, e-commerce.
5. **Informações de contato visíveis**: Nome da empresa, endereço ou CNPJ, telefone/email.
6. **Pop-ups agressivos**: Proibido pop-ups que impeçam navegação. Pop-up de saída OK com moderação.
7. **Coleta de dados**: Se coleta dados pessoais (CPF, cartão), precisa de HTTPS obrigatório e política de privacidade detalhada.
8. **Comparação de preços**: Se mostra preço, deve ser real e atual. Proibido preços enganosos.

📛 POLÍTICAS DE PRIVACIDADE — CHECKLIST:
✅ Quais dados são coletados (nome, email, telefone, CPF, cookies)
✅ Como os dados são usados (marketing, contato, personalização)
✅ Com quem os dados são compartilhados (parceiros, Google, Facebook)
✅ Como o usuário pode solicitar remoção dos dados (LGPD/GDPR)
✅ Uso de cookies e pixels de rastreamento
✅ Responsável pelo tratamento de dados (DPO ou responsável)
✅ Base legal para o tratamento (consentimento, legítimo interesse)
✅ Prazo de retenção dos dados
✅ Link acessível na LP (rodapé ou header)

📛 LGPD (LEI GERAL DE PROTEÇÃO DE DADOS — BRASIL):
- Consentimento explícito obrigatório antes de coletar dados
- Botão de aceite de cookies visível
- Formulários: checkbox de aceite (não pode ser pré-marcado)
- Direito do titular: acesso, correção, exclusão, portabilidade
- Multa: até 2% do faturamento, limitado a R$ 50 milhões por infração

📛 GDPR (REGULAMENTO GERAL — EUROPA):
- Consentimento prévio obrigatório
- "Right to be forgotten" (direito ao esquecimento)
- Multa: até 4% do faturamento global ou €20 milhões
- Se anuncia para público europeu, DEVE cumprir GDPR mesmo sendo brasileiro

📛 CONSEQUÊNCIAS DE VIOLAÇÕES:
1. **Anúncio reprovado**: Mais comum. Corrija e reenvie.
2. **Conta sob aviso**: 3 reprovações em sequência pode gerar aviso.
3. **Suspensão de conta**: Violações graves ou reincidência. Pode apelar.
4. **Banimento permanente**: Fraude, produtos proibidos, evasão de políticas. SEM recurso.
5. **Banimento de rede**: Google bane TODOS os seus anúncios em todas as contas. Vinculado ao CPF/CNPJ e métodos de pagamento.

📛 DETECÇÃO PROATIVA — QUANDO ALERTAR O USUÁRIO:
Ao analisar anúncios, landing pages ou estratégias do usuário, VERIFIQUE:
- [ ] O produto/serviço é permitido no Google Ads?
- [ ] Os textos do anúncio seguem regras editoriais?
- [ ] A LP tem política de privacidade?
- [ ] A LP tem HTTPS?
- [ ] Claims de saúde, financeiros ou de resultado são realistas?
- [ ] Usa marcas registradas de terceiros?
- [ ] Coleta dados sensíveis com consentimento adequado?
- [ ] Se é remarketing, tem banner de cookies?

Se QUALQUER item falhar, NOTIFIQUE o usuário com:
"⚠️ **Alerta de Política Google Ads**: [explicação do risco]. Isso pode resultar em [consequência]. Para corrigir: [solução]."

REGRAS GERAIS:
1) Responda SEMPRE no mesmo idioma que o usuário usar.
2) Seja concisa — máximo 3-4 frases em respostas normais. Mais só quando analisando dados ou explicando políticas.
3) NUNCA liste métricas brutas — os dados já estão no dashboard visual.
4) Quando receber dados de veículo, apresente organizado com markdown e emojis.
5) Foque em ser uma PARCEIRA DE NEGÓCIOS, não um robô de respostas.
6) Quando o usuário descrever seu anúncio, landing page ou produto, ANALISE contra as políticas AUTOMATICAMENTE.
7) Se detectar risco de violação, ALERTE com emoji ⚠️ e explique claramente.`;


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

    // Lead prospecting detection - now with REAL data from Firecrawl
    if (isLeadProspectingQuestion(messages)) {
      console.log("Lead prospecting question detected");
      
      const userQuery = lastUserText.toLowerCase();
      const rememberedNiche = extractLeadNiche(messages);
      const userHasNiche = LEAD_NICHE_KEYWORDS.some((keyword) => userQuery.includes(keyword)) || Boolean(rememberedNiche);
      
      // Also check if this is a follow-up where user chose a niche from the previous AI message
      const previousAiMsg = [...messages].reverse().find((m: {role:string}) => m.role === "assistant");
      const isNicheFollowUp = previousAiMsg?.content?.includes("[NICHE_SELECT]") || previousAiMsg?.content?.includes("Qual nicho") || previousAiMsg?.content?.includes("qual nicho") || previousAiMsg?.content?.includes("escolha") || previousAiMsg?.content?.includes("Escolha");
      
      if (!userHasNiche && !isNicheFollowUp) {
        console.log("No niche specified - frontend will show niche dashboard");
        systemContent += `\n\nO usuário quer buscar leads mas ainda não disse qual nicho.
O painel de nichos já apareceu automaticamente do lado. Responda de forma natural e curta (1-2 frases), tipo:
"Show! Dá uma olhada no painel ali do lado e escolhe o nicho que te interessa 🎯 E me conta — qual serviço você quer oferecer? Criação de site, app, automação...?"
NÃO busque leads ainda. NÃO inclua [LEADS_JSON]. Apenas converse naturalmente.`;
      } else {
        console.log("Niche detected or remembered - running deterministic lead search");

        const nicheText = rememberedNiche || stripLeadRequestPrefix(lastUserText) || "";
        const serviceText = extractLeadService(messages) || "criação de sites, aplicativos e automação";
        const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

        if (!firecrawlApiKey) {
          return createSseTextResponse("A busca real de leads está indisponível no momento porque o conector Firecrawl não está configurado.");
        }

        try {
          const searchPlans = buildLeadSearchPlans(nicheText, serviceText);
          const rawCandidates = await searchLeadCandidates(searchPlans, firecrawlApiKey);
          const filteredCandidates = rawCandidates
            .filter(looksLikeLeadCandidate)
            .slice(0, 24);

          console.log("Lead candidates before enrichment:", filteredCandidates.length);

          const enrichedCandidates = (await Promise.all(
            filteredCandidates.map(async (candidate) => {
              const enriched = await enrichLeadSource(candidate, firecrawlApiKey);
              return {
                ...candidate,
                sourceType: enriched.sourceType,
                contactDetails: enriched.contactDetails,
              } as SearchCandidate;
            })
          ))
            .filter((candidate) => {
              const details = candidate.contactDetails || emptyContactDetails();
              const hasActionableContact = Boolean(details.website || details.linkedin || details.instagram || details.whatsapp || details.phone || details.email);
              if (!hasActionableContact) return false;
              if (candidate.region !== "BR" && !hasBrazilianContext(candidate)) return false;
              if (isPortalUrl(candidate.url) && !hasDirectContact(details) && (!details.website || isPortalUrl(details.website))) return false;
              return true;
            });

          const rankedLeads = dedupeRankedLeads(
            enrichedCandidates.map((candidate) => {
              const details = candidate.contactDetails || emptyContactDetails();
              const combinedText = normalizeWhitespace([candidate.title, candidate.description, candidate.markdown].filter(Boolean).join(" "));
              const lead = buildLeadFromCandidate(candidate, nicheText, serviceText);
              const rank =
                calculateLeadScore(combinedText, details, lead.recent_activity, isPortalUrl(candidate.url)) * 10 +
                countContactSignals(details) * 4 +
                (candidate.region !== "BR" ? 3 : 0);

              return {
                region: candidate.region,
                lead,
                rank,
              };
            })
          );

          const finalLeadItems = selectBalancedLeads(rankedLeads, 10);
          const finalLeads = finalLeadItems.map((item) => item.lead);
          const directContactCount = finalLeads.filter((lead) => Boolean(lead.email || lead.phone || lead.whatsapp || lead.linkedin || lead.instagram)).length;
          const outsideBrazilCount = finalLeads.filter((lead) => lead.country !== LEAD_REGION_LABELS.BR).length;
          const payload = {
            leads: finalLeads,
            strategies: buildLeadStrategies(finalLeads, serviceText),
          };

          console.log("Final real leads returned:", finalLeads.length, "outside BR:", outsideBrazilCount, "direct contacts:", directContactCount);

          if (finalLeads.length === 0) {
            const emptyPayload = {
              leads: [],
              strategies: [
                "Tente manter o nicho e especificar se quer vender site, app ou automação.",
                "Vale pedir uma nova rodada focada em uma região específica, como EUA ou Canadá.",
              ],
            };

            return createSseTextResponse(`[LEADS_JSON]\n${JSON.stringify(emptyPayload, null, 2)}\n[/LEADS_JSON]\n\nNão achei leads reais com contato público nessa rodada — me diga outro nicho ou serviço e eu amplio a busca.`);
          }

          return createSseTextResponse(`[LEADS_JSON]\n${JSON.stringify(payload, null, 2)}\n[/LEADS_JSON]\n\nEncontrei ${finalLeads.length} leads reais, sendo ${outsideBrazilCount} fora do Brasil e ${directContactCount} com contato direto público.`);
        } catch (error) {
          console.error("Deterministic lead search error:", error);
          return createSseTextResponse("Tive um problema ao montar os leads reais agora — tenta de novo que eu refaço a busca com outro recorte.");
        }
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
