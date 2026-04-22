import { SquarePen, Search, MessageCircle, LogOut, Settings, Trash2 } from "lucide-react";
import { useState } from "react";
import logoBlack from "@/assets/logo-black.png";
import logoWhite from "@/assets/logo-white.png";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import GoogleAdsSettings from "./GoogleAdsSettings";
import type { Conversation } from "@/hooks/useConversations";

interface MobileIconBarProps {
  onNewConversation: () => void;
  onOpenHistory: () => void;
  onOpenSearch?: () => void;
  onOpenSidebar?: () => void;
  onSignOut?: () => void;
  expanded?: boolean;
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
  onOpenSearch,
  onOpenSidebar,
  onSignOut,
  expanded = false,
  userInitials = "LC",
  conversations = [],
  currentConversationId = null,
  onSelectConversation,
  onDeleteConversation,
  googleAds,
}: MobileIconBarProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSidebar = () => onOpenSidebar?.();

  // Wrap an icon button with a tooltip (collapsed) or inline label (expanded)
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
        {expanded && (
          <span className="text-sm whitespace-nowrap">{label}</span>
        )}
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
      {/* "KahlChat" wordmark outside the bar — only when collapsed */}
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

      <aside
        className={cn(
          "hidden md:flex fixed top-0 left-0 h-full z-40 bg-card/80 backdrop-blur-xl border-r border-border/50 flex-col py-3 transition-[width] duration-200",
          expanded ? "w-64 items-stretch px-2" : "w-14 items-center"
        )}
        aria-label="Barra de navegação"
      >
        {/* Logo — clicking it toggles the sidebar */}
        <div className={cn("mb-4", expanded ? "px-2.5 flex items-center gap-2" : "")}>
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={openSidebar}
                aria-label="Abrir barra lateral"
                className="cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-0 p-0 flex items-center"
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
              </button>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right" sideOffset={8}>
                Abrir barra lateral
              </TooltipContent>
            )}
          </Tooltip>
          {expanded && (
            <span className="text-foreground text-base font-semibold tracking-tight">
              KahlChat
            </span>
          )}
        </div>

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
            label="Buscar"
            ariaLabel="Buscar"
            onClick={onOpenSearch ?? onOpenHistory}
          >
            <Search className="w-5 h-5" strokeWidth={2} />
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

        {/* Recentes: list of conversations (only when expanded) */}
        {expanded && (
          <div className="mt-4 flex-1 min-h-0 flex flex-col">
            <div className="px-2.5 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recentes
            </div>
            <div
              className="flex-1 overflow-y-auto space-y-0.5 pr-0.5"
              style={{ scrollbarWidth: "thin" }}
            >
              {conversations.length === 0 && (
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

        {/* Settings button — above avatar */}
        <div className={cn(expanded ? "mt-2 px-0" : "mt-auto mb-2 flex justify-center")}>
          <IconButton
            label="Configurações"
            ariaLabel="Configurações"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-5 h-5" strokeWidth={2} />
          </IconButton>
        </div>

        {/* Avatar at bottom — popover with sign out */}
        <div className={cn(expanded ? "px-1 mt-1" : "flex justify-center")}>
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
                  {userInitials.slice(0, 2)}
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
        </div>
      </aside>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
          </DialogHeader>
          {googleAds ? (
            <GoogleAdsSettings
              customerId={googleAds.customerId}
              onSave={googleAds.onSave}
              loading={googleAds.loading}
              error={googleAds.error}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma configuração disponível.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default MobileIconBar;
