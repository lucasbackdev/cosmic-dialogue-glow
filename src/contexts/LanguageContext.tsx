import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Language = "pt-BR" | "en";

const translations = {
  "pt-BR": {
    newConversation: "Nova conversa",
    noConversations: "Nenhuma conversa ainda",
    settings: "Configurações",
    signOut: "Sair",
    typeQuestion: "Digite sua pergunta...",
    hideChat: "Ocultar chat",
    showChat: "Mostrar chat",
    orionAI: "Orion AI",
    // Settings
    googleAds: "Google Ads",
    googleAdsDesc: "Insira o ID da conta Google Ads (formato: 123-456-7890) para buscar métricas e campanhas.",
    currentAccount: "Conta atual",
    sendLinkRequest: "Salvar conta",
    sendingRequest: "Salvando...",
    afterSending: "",
    language: "Idioma",
    languageLabel: "Idioma do app",
    portuguese: "Português (BR)",
    english: "English",
    // Dashboard
    dashboardTitle: "Dashboard — Últimos 30 dias",
    notConnected: "Conta Google Ads não conectada. Vá em Configurações na barra lateral e insira o ID da sua conta para ver dados reais.",
    impressions: "Impressões",
    clicks: "Cliques",
    ctr: "CTR",
    avgCpc: "CPC Médio",
    conversions: "Conversões",
    totalCost: "Custo Total",
    // Metric analysis
    healthyVolume: "Volume saudável. Bom alcance de público.",
    lowVolume: "Volume baixo. Expanda o público-alvo.",
    monitorQuality: "Monitore a qualidade do tráfego.",
    increaseBudget: "Aumente orçamento diário em 20%.",
    goodClicks: "Bom volume. Anúncios atraindo interesse.",
    lowClicks: "Abaixo do esperado. Otimize os anúncios.",
    testNewTexts: "Teste novos textos para aumentar CTR.",
    reviewTitles: "Revise títulos e descrições.",
    excellentCtr: "Excelente! Anúncios muito relevantes.",
    averageCtr: "Na média. Há espaço para melhorar.",
    lowCtr: "Baixo. Anúncios sem interesse suficiente.",
    expandAudiences: "Expanda para públicos semelhantes.",
    addExtensions: "Adicione extensões e teste A/B.",
    competitiveCpc: "Competitivo. Valor justo por clique.",
    highCpc: "Elevado. Palavras-chave caras.",
    focusConversion: "Foque em melhorar conversão.",
    removeLowPerf: "Remova palavras-chave de baixo desempenho.",
    goodConversions: "Bom volume. Campanhas gerando resultados.",
    lowConversions: "Baixas. Ajuste o funil de vendas.",
    increaseBudgetBest: "Aumente orçamento nas melhores campanhas.",
    simplifyLanding: "Simplifique a página de destino.",
    healthyRoi: "ROI saudável.",
    optimizeReduce: "Otimize para reduzir.",
    noConversionsYet: "Sem conversões. Custo sem retorno.",
    scaleBudget: "Escale gradualmente o orçamento.",
    pauseLowPerf: "Pause campanhas de baixo desempenho.",
    cpa: "CPA",
  },
  en: {
    newConversation: "New conversation",
    noConversations: "No conversations yet",
    settings: "Settings",
    signOut: "Sign out",
    typeQuestion: "Type your question...",
    hideChat: "Hide chat",
    showChat: "Show chat",
    orionAI: "Orion AI",
    // Settings
    googleAds: "Google Ads",
    googleAdsDesc: "Enter your Google Ads account ID (format: 123-456-7890) to fetch metrics and campaigns.",
    currentAccount: "Current account",
    sendLinkRequest: "Save account",
    sendingRequest: "Saving...",
    afterSending: "",
    language: "Language",
    languageLabel: "App language",
    portuguese: "Português (BR)",
    english: "English",
    // Dashboard
    dashboardTitle: "Dashboard — Last 30 days",
    notConnected: "Google Ads account not connected. Go to Settings in the sidebar and enter your account ID to see real data.",
    impressions: "Impressions",
    clicks: "Clicks",
    ctr: "CTR",
    avgCpc: "Avg CPC",
    conversions: "Conversions",
    totalCost: "Total Cost",
    // Metric analysis
    healthyVolume: "Healthy volume. Good audience reach.",
    lowVolume: "Low volume. Expand your target audience.",
    monitorQuality: "Monitor traffic quality.",
    increaseBudget: "Increase daily budget by 20%.",
    goodClicks: "Good volume. Ads attracting interest.",
    lowClicks: "Below expectations. Optimize your ads.",
    testNewTexts: "Test new copy to increase CTR.",
    reviewTitles: "Review titles and descriptions.",
    excellentCtr: "Excellent! Highly relevant ads.",
    averageCtr: "Average. Room for improvement.",
    lowCtr: "Low. Ads not generating enough interest.",
    expandAudiences: "Expand to similar audiences.",
    addExtensions: "Add extensions and A/B test.",
    competitiveCpc: "Competitive. Fair cost per click.",
    highCpc: "High. Expensive keywords.",
    focusConversion: "Focus on improving conversion.",
    removeLowPerf: "Remove low-performing keywords.",
    goodConversions: "Good volume. Campaigns generating results.",
    lowConversions: "Low. Adjust your sales funnel.",
    increaseBudgetBest: "Increase budget on top campaigns.",
    simplifyLanding: "Simplify your landing page.",
    healthyRoi: "Healthy ROI.",
    optimizeReduce: "Optimize to reduce.",
    noConversionsYet: "No conversions. Cost with no return.",
    scaleBudget: "Gradually scale your budget.",
    pauseLowPerf: "Pause low-performing campaigns.",
    cpa: "CPA",
  },
} as const;

type TranslationKey = keyof typeof translations["pt-BR"];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("app-language") as Language) || "pt-BR";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations["pt-BR"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
