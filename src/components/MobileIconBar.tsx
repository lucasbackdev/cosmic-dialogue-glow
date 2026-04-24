import { SquarePen, MessageCircle, LogOut, Settings, Trash2, User, Menu, X, ArrowLeft, Link2 } from "lucide-react";
import { useState, useEffect } from "react";
import logoBlack from "@/assets/logo-black.png";
import logoWhite from "@/assets/logo-white.png";
import googleAdsLogo from "@/assets/google-ads-logo.png";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { Globe, Moon, Sun } from "lucide-react";
import type { Conversation } from "@/hooks/useConversations";

interface MobileIconBarProps {
  onNewConversation: () => void;
  onOpenHistory: () => void;
  onOpenGoogleAds?: () => void;
  onOpenSidebar?: () => void;
  onSignOut?: () => void;
  onLogin?: () => void;
  expanded?: boolean;
  isAuthed?: boolean;
  userInitials?: string;
  conversations?: Conversation[];
  currentConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  googleAds?: {
    customerId: string | null;
    onSave: (id: string) => Promise<{ success: boolean; message: string } | undefined>;
    loading: boolean;
    error: string | null;
  };
}

const MobileIconBar = ({
  onNewConversation,
  onOpenHistory,
  onOpenGoogleAds,
  onOpenSidebar,
  onSignOut,
  onLogin,
  expanded = false,
  isAuthed = false,
  userInitials = "",
  conversations = [],
  currentConversationId = null,
  onSelectConversation,
  onDeleteConversation,
  googleAds,
}: MobileIconBarProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adsIdInput, setAdsIdInput] = useState(googleAds?.customerId || "");
  const { t, language, setLanguage } = useLanguage();
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    setAdsIdInput(googleAds?.customerId || "");
  }, [googleAds?.customerId]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleLinkAccount = () => {
    // Show paywall regardless — linking real account requires subscription
    setShowPaywall(true);
  };

  const openSidebar = () => onOpenSidebar?.();

  const IconButton = ({
    label,
    onClick,
    children,
    ariaLabel,
    className,
  }: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
    ariaLabel: string;
    className?: string;
  }) => {
    const button = (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          "h-10 rounded-lg flex items-center text-foreground transition-colors",
          expanded
            ? "w-full px-2.5 gap-3 justify-start hover:bg-muted/60"
            : "w-10 justify-center hover:bg-muted/60",
          className
        )}
      >
        <span className="shrink-0 flex items-center justify-center w-5 h-5">
          {children}
        </span>
        {expanded && <span className="text-sm whitespace-nowrap">{label}</span>}
      </button>
    );

    if (expanded) return button;

    return (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      {/* Mobile-only hamburger when bar is hidden */}
      {!expanded && (
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Abrir barra lateral"
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card/60 backdrop-blur-md hover:bg-card/80 transition-colors text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* "KahlChat" wordmark outside the bar — desktop only when collapsed */}
      {!expanded && (
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Abrir barra lateral"
          className="hidden md:block fixed top-4 left-[4.25rem] z-30 text-foreground text-lg font-semibold tracking-tight cursor-pointer select-none hover:opacity-80 transition-opacity bg-transparent border-0 p-0"
        >
          KahlChat
        </button>
      )}

      {/* Mobile overlay backdrop when expanded */}
      {expanded && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-background/40 backdrop-blur-sm"
          onClick={openSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-40 bg-card/80 backdrop-blur-xl border-r border-border/50 flex-col py-3 transition-[width,transform] duration-200",
          // Desktop: always visible, width changes
          "md:flex",
          (expanded || settingsOpen) ? "md:w-64 md:items-stretch md:px-2" : "md:w-14 md:items-center md:translate-x-0",
          // Mobile: slides in/out
          (expanded || settingsOpen)
            ? "flex w-64 items-stretch px-2 translate-x-0"
            : "flex w-14 items-center -translate-x-full md:translate-x-0"
        )}
        aria-label="Barra de navegação"
      >
        {/* Logo / close (mobile) */}
        <div className={cn("mb-4", expanded ? "px-2.5 flex items-center gap-2 justify-between" : "")}>
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={openSidebar}
                aria-label="Alternar barra lateral"
                className="cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-0 p-0 flex items-center gap-2"
              >
                <img
                  src={logoBlack}
                  alt="KahlChat"
                  className="w-7 h-7 object-contain block dark:hidden"
                />
                <img
                  src={logoWhite}
                  alt="KahlChat"
                  className="w-7 h-7 object-contain hidden dark:block"
                />
                {expanded && (
                  <span className="text-foreground text-base font-semibold tracking-tight">
                    KahlChat
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right" sideOffset={8}>
                Abrir barra lateral
              </TooltipContent>
            )}
          </Tooltip>
          {expanded && (
            <button
              type="button"
              onClick={openSidebar}
              aria-label="Fechar barra"
              className="md:hidden p-1 rounded-md hover:bg-muted/60 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {!settingsOpen && (<>
        <div className={cn("flex flex-col", expanded ? "gap-1" : "items-center gap-2")}>
          <IconButton
            label="Nova conversa"
            ariaLabel="Nova conversa"
            onClick={onNewConversation}
            className={!expanded ? "bg-muted/60" : ""}
          >
            <SquarePen className="w-5 h-5" strokeWidth={2} />
          </IconButton>

          <IconButton
            label="Google Ads"
            ariaLabel="Google Ads"
            onClick={() => onOpenGoogleAds?.()}
          >
            <img
              src={googleAdsLogo}
              alt="Google Ads"
              className="w-5 h-5 object-contain"
            />
          </IconButton>

          {!expanded && (
            <IconButton
              label="Recentes"
              ariaLabel="Recentes"
              onClick={onOpenHistory}
            >
              <MessageCircle className="w-5 h-5" strokeWidth={2} />
            </IconButton>
          )}
        </div>

        {/* Recentes list when expanded */}
        {expanded && (
          <div className="mt-4 flex-1 min-h-0 flex flex-col">
            <div className="px-2.5 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recentes
            </div>
            <div
              className="flex-1 overflow-y-auto space-y-0.5 pr-0.5"
              style={{ scrollbarWidth: "thin" }}
            >
              {!isAuthed && (
                <p className="text-muted-foreground text-xs px-2.5 py-2">
                  Entre para ver suas conversas.
                </p>
              )}
              {isAuthed && conversations.length === 0 && (
                <p className="text-muted-foreground text-xs px-2.5 py-2">
                  Nenhuma conversa ainda.
                </p>
              )}
              {conversations.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => onSelectConversation?.(convo.id)}
                  className={cn(
                    "group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                    currentConversationId === convo.id
                      ? "bg-muted/70 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <span className="truncate flex-1">{convo.title}</span>
                  {onDeleteConversation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(convo.id);
                      }}
                      aria-label="Excluir conversa"
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings button */}
        <div className={cn(expanded ? "mt-2 px-0" : "mt-auto mb-2 flex justify-center")}>
          <IconButton
            label="Configurações"
            ariaLabel="Configurações"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-5 h-5" strokeWidth={2} />
          </IconButton>
        </div>

        {/* Account: avatar (authed) or person icon (unauth) */}
        <div className={cn(expanded ? "px-1 mt-1" : "flex justify-center")}>
          {isAuthed ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Perfil"
                  className={cn(
                    "flex items-center gap-3 rounded-full transition-opacity hover:opacity-90",
                    expanded ? "w-full p-1.5 rounded-lg hover:bg-muted/60" : ""
                  )}
                >
                  <span className="w-9 h-9 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                    {(userInitials || "U").slice(0, 2)}
                  </span>
                  {expanded && (
                    <span className="text-sm text-foreground truncate">Conta</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="end" sideOffset={8} className="w-56 p-1">
                <button
                  type="button"
                  onClick={() => onSignOut?.()}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da conta
                </button>
              </PopoverContent>
            </Popover>
          ) : expanded ? (
            <button
              type="button"
              onClick={() => onLogin?.()}
              aria-label="Entrar"
              className="w-full flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </span>
              <span className="text-sm text-foreground">Entrar</span>
            </button>
          ) : (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onLogin?.()}
                  aria-label="Entrar"
                  className="w-9 h-9 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <User className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Entrar
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        </>)}

        {/* Settings panel — replaces sidebar content */}
        {settingsOpen && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 px-2.5 mb-4">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label={language === "pt-BR" ? "Voltar" : "Back"}
                className="p-1.5 rounded-md hover:bg-muted/60 text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-foreground">
                {t("settings")}
              </span>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label={language === "pt-BR" ? "Fechar" : "Close"}
                className="ml-auto p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2.5 space-y-5" style={{ scrollbarWidth: "thin" }}>
              {/* Language */}
              <div className="pb-4 border-b border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{t("languageLabel")}</span>
                </div>
                <div className="flex gap-2">
                  {(["pt-BR", "en"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border",
                        language === lang
                          ? "bg-primary/20 border-primary/40 text-foreground"
                          : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      {lang === "pt-BR" ? t("portuguese") : t("english")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark mode */}
              <div className="pb-4 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {darkMode ? (
                      <Moon className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium text-foreground">
                      {language === "pt-BR" ? "Modo escuro" : "Dark mode"}
                    </span>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-colors",
                      darkMode ? "bg-primary" : "bg-border"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform",
                        darkMode && "translate-x-5"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Google Ads */}
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <img src={googleAdsLogo} alt="Google Ads" className="w-3.5 h-3.5 object-contain" />
                  <span className="text-xs font-medium text-foreground">{t("googleAds")}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                  {t("googleAdsDesc")}
                </p>
                <Input
                  value={adsIdInput}
                  onChange={(e) => setAdsIdInput(e.target.value)}
                  placeholder="123-456-7890"
                  className="mb-2 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground text-sm h-9"
                />
                <button
                  type="button"
                  onClick={handleLinkAccount}
                  disabled={!adsIdInput.trim()}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {language === "pt-BR" ? "Vincular conta" : "Link account"}
                </button>
                {googleAds?.customerId && (
                  <div className="mt-2 flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30 border border-border/30">
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {t("currentAccount")}
                      </p>
                      <p className="text-xs text-foreground font-mono truncate">
                        {googleAds.customerId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdsIdInput("")}
                      className="text-[11px] px-2 py-1 rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition-colors shrink-0"
                    >
                      {language === "pt-BR" ? "Substituir" : "Replace"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Paywall modal — shown when linking Google Ads account */}
      {showPaywall && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setShowPaywall(false)}
        >
          <div
            className="relative w-full max-w-sm bg-card/90 backdrop-blur-xl border border-border/30 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowPaywall(false)}
              aria-label="Fechar"
              className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Crown className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {language === "pt-BR" ? "Vincular conta Google Ads" : "Link Google Ads account"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === "pt-BR"
                  ? "Para vincular sua conta Google Ads e acessar todas as funcionalidades, assine o plano essencial."
                  : "To link your Google Ads account and unlock all features, subscribe to the essential plan."}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">R$ 99</span>
                <span className="text-sm text-muted-foreground">/{language === "pt-BR" ? "mês" : "month"}</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1.5 text-left w-full">
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> {language === "pt-BR" ? "Integração com Google Ads" : "Google Ads integration"}</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> {language === "pt-BR" ? "Métricas reais em tempo real" : "Real-time metrics"}</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> {language === "pt-BR" ? "IA para gerenciar campanhas" : "AI to manage campaigns"}</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> {language === "pt-BR" ? "Suporte prioritário" : "Priority support"}</li>
              </ul>
              <a
                href={KIWIFY_CHECKOUT}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                {language === "pt-BR" ? "Assinar agora" : "Subscribe now"}
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setShowPaywall(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {language === "pt-BR" ? "Voltar" : "Back"}
              </button>
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
};

export default MobileIconBar;
