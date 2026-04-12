import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import StarOrb from "@/components/StarOrb";
import ChatBubble from "@/components/ChatBubble";
import CampaignMetricsInline from "@/components/CampaignMetricsInline";
import CampaignSelector, { type Campaign } from "@/components/CampaignSelector";
import ConversationsSidebar from "@/components/ConversationsSidebar";
import VehicleConsultMenu from "@/components/VehicleConsultMenu";
import LeadResultsPanel, { type LeadData, type NicheGroup } from "@/components/LeadResultsPanel";
import NicheSelectorDashboard from "@/components/NicheSelectorDashboard";
import PaywallCard from "@/components/PaywallCard";
import WorkSimulation from "@/components/WorkSimulation";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useGoogleAds } from "@/hooks/useGoogleAds";
import { useSubscription } from "@/hooks/useSubscription";
import { useCredits } from "@/hooks/useCredits";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Send, Eye, EyeOff, Mic, Square, Keyboard } from "lucide-react";

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const CRM_KEYWORDS = ["campanha", "campanhas", "google ads", "impressões", "ctr", "cpc", "conversões", "orçamento", "anúncio", "anúncios"];
const LEAD_KEYWORDS = ["lead", "leads", "prospecção", "prospectar", "encontrar clientes", "brasileiros", "tráfego pago", "trafego pago", "desenvolvedor web", "empreendedores", "empresas nos eua", "empresas no canadá", "empresas na europa", "brasileiros no exterior", "empresas que buscam", "pessoas que buscam", "quem precisa de", "serviço de", "desenvolvimento web", "aplicativo", "marketing digital", "design", "consultoria", "contabilidade", "advocacia", "freelancer", "agência", "clientes potenciais", "nicho", "nichos", "mostre empresas", "mostre pessoas"];
const PLATE_REGEX = /\b([A-Za-z]{3}[-\s]?\d[A-Za-z0-9]\d{2})\b/;

function parseLeadData(text: string): { leads: LeadData[]; niches?: NicheGroup[]; strategies: string[] } | null {
  const match = text.match(/\[LEADS_JSON\]([\s\S]*?)\[\/LEADS_JSON\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (parsed.leads && Array.isArray(parsed.leads)) {
      return { leads: parsed.leads, niches: parsed.niches || undefined, strategies: parsed.strategies || [] };
    }
    if (parsed.niches && Array.isArray(parsed.niches)) {
      const allLeads = parsed.niches.flatMap((n: NicheGroup) => n.leads);
      return { leads: allLeads, niches: parsed.niches, strategies: parsed.strategies || [] };
    }
  } catch { /* ignore */ }
  return null;
}


const Index = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    messages,
    createConversation,
    addMessage,
    updateLastAssistantMessage,
    finalizeAssistantMessage,
    deleteConversation,
  } = useConversations(user?.id);

  const { customerId, data: adsData, saveCustomerId, period, changePeriod } = useGoogleAds(user?.id);
  const { isActive: hasSubscription, loading: subLoading } = useSubscription(user?.id);
  const { credits } = useCredits(user?.id);

  const [state, setState] = useState<"idle" | "listening" | "speaking">("idle");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showInput, setShowInput] = useState(true);
  const [textInput, setTextInput] = useState("");
  const [showMetricsInChat, setShowMetricsInChat] = useState(false);
  const [selectedCampaignIndex, setSelectedCampaignIndex] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [pendingPlate, setPendingPlate] = useState<string | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [freeUserInput, setFreeUserInput] = useState<string | null>(null);
  const audioLevelInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const sentViaVoiceRef = useRef(false);

  // Preload voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);


  // Re-check CRM triggers when messages load (e.g. switching conversations)
  useEffect(() => {
    if (messages.length === 0) return;
    const hasCRM = messages.some(m => {
      const lower = m.content.toLowerCase();
      return CRM_KEYWORDS.some(kw => lower.includes(kw));
    });
    setShowMetricsInChat(hasCRM);
    setSelectedCampaignIndex(null);
  }, [messages]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, showMetricsInChat]);

  const checkCRMTrigger = useCallback((text: string) => {
    const lower = text.toLowerCase();
    const triggered = CRM_KEYWORDS.some(kw => lower.includes(kw));
    if (triggered) {
      setShowMetricsInChat(true);
    }
  }, []);

  // Detect plate in user messages to show visual menu
  const detectedPlate = useMemo(() => {
    // Find last user message with a plate
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        const match = messages[i].content.match(PLATE_REGEX);
        if (match) return match[1].replace(/[-\s]/g, "").toUpperCase();
      }
    }
    return null;
  }, [messages]);

  // Show menu when AI responded with the menu (plate detected, last assistant message contains "menu" or consultation options)
  const showVehicleMenu = useMemo(() => {
    if (!detectedPlate) return false;
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistant) return false;
    const lower = lastAssistant.content.toLowerCase();
    // Match the new short response OR the old menu format
    return (lower.includes("selecione as consultas") || lower.includes("painel ao lado") ||
           ((lower.includes("dados básicos") || lower.includes("dados basicos")) && 
            (lower.includes("fipe") || lower.includes("sinistro"))));
  }, [messages, detectedPlate]);

  // Parse lead data from assistant messages
  const parsedLeads = useMemo(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistant) return null;
    return parseLeadData(lastAssistant.content);
  }, [messages]);

  // Detect if AI is asking user to choose a niche (show hardcoded dashboard)
  const showNicheDashboard = useMemo(() => {
    if (parsedLeads) return false; // Don't show if leads are already displayed
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistant) return false;
    const lower = lastAssistant.content.toLowerCase();
    // Detect niche question patterns
    return (
      (lower.includes("nicho") && (lower.includes("escolha") || lower.includes("escolher") || lower.includes("prospectar") || lower.includes("painel"))) ||
      lower.includes("[niche_select]") ||
      (lower.includes("qual nicho") || lower.includes("qual setor"))
    );
  }, [messages, parsedLeads]);

  const sendMessage = useCallback(async (text: string, selectedCampaignName?: string) => {
    if (!hasSubscription) {
      setFreeUserInput(text);
      setShowChat(true);
      setShowSimulation(true);
      return;
    }
    setShowChat(true); // Always show chat when sending
    let convoId = currentConversationId;
    if (!convoId) {
      convoId = await createConversation(text.slice(0, 60));
      if (!convoId) return;
    }

    await addMessage(convoId, "user", text);
    checkCRMTrigger(text);
    setState("speaking");

    const allMessages = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text },
    ];

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, googleAdsCustomerId: customerId || undefined, selectedCampaign: selectedCampaignName || undefined, userId: user?.id }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        if (errorData.error === "credits_exhausted") {
          await addMessage(convoId!, "assistant", `⚠️ Seus pontos acabaram! Você usou todos os 1.500 pontos deste mês. Seus pontos renovam automaticamente no próximo ciclo da assinatura.\n\nPontos restantes: **${errorData.remaining || 0}**`);
          setState("idle");
          return;
        }
        throw new Error(errorData.error || "Erro ao conectar com a IA");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              updateLastAssistantMessage(convoId!, assistantSoFar);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              updateLastAssistantMessage(convoId!, assistantSoFar);
            }
          } catch { /* ignore */ }
        }
      }

      if (assistantSoFar) {
        await finalizeAssistantMessage(convoId!, assistantSoFar);
        // Don't trigger CRM on assistant responses
      }

      if (assistantSoFar && sentViaVoiceRef.current && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        // Strip markdown formatting so TTS reads clean text
        const cleanText = assistantSoFar
          .replace(/#{1,6}\s?/g, "")
          .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
          .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
          .replace(/~~([^~]+)~~/g, "$1")
          .replace(/`{1,3}[^`]*`{1,3}/g, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/^[-*+]\s/gm, "")
          .replace(/^\d+\.\s/gm, "")
          .replace(/^>\s?/gm, "")
          .replace(/---+/g, "")
          .replace(/\n{2,}/g, ". ")
          .replace(/\n/g, " ")
          .trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "pt-BR";
        utterance.rate = 1.3;
        utterance.pitch = 1.1;
        utterance.volume = 1;
        const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
        // Prefer the feminine non-local pt-BR voice (skip Google voice which is male)
        const ptVoice = voices.find(v => v.lang === "pt-BR" && !v.localService && !v.name.toLowerCase().includes("google"))
          || voices.find(v => v.lang === "pt-BR" && !v.localService)
          || voices.find(v => v.lang === "pt-BR");
        if (ptVoice) utterance.voice = ptVoice;
        utterance.onstart = () => {
          // Simulate voice-reactive audio levels
          audioLevelInterval.current = setInterval(() => {
            setAudioLevel(0.3 + Math.random() * 0.7);
          }, 80);
        };
        utterance.onend = () => {
          if (audioLevelInterval.current) clearInterval(audioLevelInterval.current);
          setAudioLevel(0);
          setState("idle");
        };
        utterance.onerror = () => {
          if (audioLevelInterval.current) clearInterval(audioLevelInterval.current);
          setAudioLevel(0);
          setState("idle");
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setState("idle");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("AI error:", err);
      await addMessage(convoId!, "assistant", "Desculpe, ocorreu um erro. Tente novamente.");
      setState("idle");
    }
  }, [messages, currentConversationId, createConversation, addMessage, updateLastAssistantMessage, finalizeAssistantMessage, checkCRMTrigger, adsData]);

  const handleVehicleConsult = useCallback(async (types: string[]) => {
    if (!detectedPlate || types.length === 0) return;
    setVehicleLoading(true);
    const typeLabels: Record<string, string> = {
      basica: "dados básicos", fipe: "preço FIPE", sinistro: "sinistro",
      roubo: "roubo e furto", leilao: "leilão", gravame: "gravame", infracoes: "infrações"
    };
    const labelList = types.map(t => typeLabels[t] || t).join(", ");
    const allTypes = types.length === 7;
    const text = allTypes 
      ? `Quero consulta completa (tudo) da placa ${detectedPlate}`
      : `Quero consultar ${labelList} da placa ${detectedPlate}`;
    await sendMessage(text);
    setPendingPlate(null);
    setVehicleLoading(false);
  }, [detectedPlate, sendMessage]);

  const handleOrbClick = useCallback(() => {
    if (state === "speaking") return;
    if (state === "listening") {
      recognitionRef.current?.stop();
      setState("idle");
      return;
    }
    if (!SpeechRecognition) {
      const text = prompt("Digite sua pergunta:");
      if (text) sendMessage(text);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sentViaVoiceRef.current = true;
      sendMessage(transcript);
    };
    recognition.onerror = () => setState("idle");
    recognition.onend = () => setState((s) => (s === "listening" ? "idle" : s));
    recognitionRef.current = recognition;
    recognition.start();
    setState("listening");
  }, [state, sendMessage]);

  // Spacebar to activate mic (only when not focused on input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        if (state === "idle") handleOrbClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, handleOrbClick]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || state === "speaking") return;
    sentViaVoiceRef.current = false;
    sendMessage(textInput.trim());
    setTextInput("");
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Conversations sidebar */}
      <ConversationsSidebar
        conversations={conversations}
        currentId={currentConversationId}
        onSelect={(id) => { setCurrentConversationId(id); setShowChat(true); }}
        onNew={() => { setCurrentConversationId(null); setShowMetricsInChat(false); }}
        onDelete={deleteConversation}
        onSignOut={signOut}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        credits={credits}
        googleAds={{
          customerId,
          onSave: saveCustomerId,
          loading: !!adsData && !adsData.summary,
          error: null,
        }}
      />

      {/* Toggle buttons */}
      <div className="fixed top-4 right-4 z-30 flex gap-2">
        <button
          onClick={() => setShowInput(!showInput)}
          className="p-2 rounded-lg bg-card/30 backdrop-blur-sm border border-border/20 text-muted-foreground hover:text-foreground transition-colors"
          title={showInput ? "Ocultar campo de texto" : "Mostrar campo de texto"}
        >
          <Keyboard className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className="p-2 rounded-lg bg-card/30 backdrop-blur-sm border border-border/20 text-muted-foreground hover:text-foreground transition-colors"
          title={showChat ? t("hideChat") : t("showChat")}
        >
          {showChat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Unified chat */}
      {showChat && (
        <div
          ref={chatRef}
          className="fixed left-1/2 -translate-x-1/2 top-16 bottom-24 w-[92%] max-w-lg md:max-w-none md:w-auto md:left-4 md:right-4 md:translate-x-0 overflow-y-auto flex flex-col gap-3 px-2 pb-6 z-10"
          style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}
        >
          {messages.map((msg, i) => (
            <ChatBubble key={msg.id || i} role={msg.role} content={msg.content} />
          ))}
          {freeUserInput && showSimulation && (
            <>
              <ChatBubble role="user" content={freeUserInput} />
              <WorkSimulation
                onComplete={() => {
                  setShowSimulation(false);
                  setShowPaywall(true);
                }}
              />
            </>
          )}
          {showMetricsInChat && adsData?.campaigns && adsData.campaigns.length > 0 && (
            <CampaignSelector
              campaigns={adsData.campaigns as Campaign[]}
              selectedIndex={selectedCampaignIndex}
              onSelect={(i) => {
                setSelectedCampaignIndex(i);
                const campaign = (adsData!.campaigns as Campaign[])[i];
                if (campaign) {
                  sendMessage(`Analise a campanha "${campaign.name}" em detalhes`, campaign.name);
                }
              }}
              period={period}
              onPeriodChange={changePeriod}
            />
          )}
          {showMetricsInChat && selectedCampaignIndex !== null && adsData?.campaigns?.[selectedCampaignIndex] && (
            <CampaignMetricsInline
              summary={{
                impressions: (adsData.campaigns[selectedCampaignIndex] as any).impressions,
                clicks: (adsData.campaigns[selectedCampaignIndex] as any).clicks,
                ctr: (adsData.campaigns[selectedCampaignIndex] as any).ctr * 100,
                averageCpc: (adsData.campaigns[selectedCampaignIndex] as any).averageCpc,
                conversions: (adsData.campaigns[selectedCampaignIndex] as any).conversions,
                totalCost: (adsData.campaigns[selectedCampaignIndex] as any).cost,
              }}
              connected={!!customerId}
            />
          )}
          {showMetricsInChat && (selectedCampaignIndex === null || !adsData?.campaigns?.length) && !adsData?.campaigns?.length && (
            <CampaignMetricsInline
              summary={adsData?.summary || {
                impressions: 0,
                clicks: 0,
                ctr: 0,
                averageCpc: 0,
                conversions: 0,
                totalCost: 0,
              }}
              connected={!!customerId && !!adsData?.summary}
            />
          )}
          {showVehicleMenu && detectedPlate && (
            <VehicleConsultMenu
              plate={detectedPlate}
              onConsult={handleVehicleConsult}
              loading={vehicleLoading}
            />
          )}
          {showNicheDashboard && (
            <NicheSelectorDashboard
              onSelect={(niche) => sendMessage(`Buscar leads de ${niche}`)}
            />
          )}
          {parsedLeads && (
            <LeadResultsPanel
              leads={parsedLeads.leads}
              niches={parsedLeads.niches}
              strategies={parsedLeads.strategies}
            />
          )}
        </div>
      )}

      {/* Centered orb - always visible */}
      <StarOrb state={state} onClick={handleOrbClick} audioLevel={audioLevel} />

      {/* Text input */}
      {showInput && (
        <form onSubmit={handleTextSubmit} className="absolute bottom-14 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-10">
          <div className="relative flex items-center gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={state === "listening" ? "Ouvindo..." : t("typeQuestion")}
              className="pr-10 bg-card/40 backdrop-blur-md border-border/50 text-foreground placeholder:text-muted-foreground"
              disabled={state === "speaking" || state === "listening"}
            />
            <button
              type="submit"
              disabled={!textInput.trim() || state === "speaking" || state === "listening"}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
            {state === "speaking" ? (
              <button
                type="button"
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setState("idle");
                }}
                className="shrink-0 p-2.5 rounded-full bg-card/40 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all animate-pulse"
                title="Parar de falar"
              >
                <Square className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleOrbClick(); }}
                className={`shrink-0 p-2.5 rounded-full transition-all ${
                  state === "listening"
                    ? "bg-primary text-primary-foreground animate-pulse"
                    : "bg-card/40 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/60"
                }`}
                title="Segurar espaço para falar"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      )}

      {/* Title */}
      <h1 className="absolute bottom-3 text-muted-foreground text-xs tracking-widest uppercase z-10">
        {t("orionAI")}
      </h1>
      {/* Paywall */}
      {showPaywall && (
        <PaywallCard onClose={() => setShowPaywall(false)} />
      )}
    </div>
  );
};

export default Index;
