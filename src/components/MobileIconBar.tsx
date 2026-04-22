import { SquarePen, Search, MessageCircle, LogOut } from "lucide-react";
import logoBlack from "@/assets/logo-black.png";
import logoWhite from "@/assets/logo-white.png";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MobileIconBarProps {
  onNewConversation: () => void;
  onOpenHistory: () => void;
  onOpenSearch?: () => void;
  onOpenSidebar?: () => void;
  onSignOut?: () => void;
  expanded?: boolean;
  userInitials?: string;
}

const MobileIconBar = ({
  onNewConversation,
  onOpenHistory,
  onOpenSearch,
  onOpenSidebar,
  onSignOut,
  expanded = false,
  userInitials = "LC",
}: MobileIconBarProps) => {
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
          expanded ? "w-56 items-stretch px-2" : "w-14 items-center"
        )}
        aria-label="Barra de navegação"
      >
        {/* Logo — clicking it opens the sidebar */}
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

          <IconButton
            label="Histórico de conversas"
            ariaLabel="Histórico de conversas"
            onClick={onOpenHistory}
          >
            <MessageCircle className="w-5 h-5" strokeWidth={2} />
          </IconButton>
        </div>

        {/* Avatar at bottom — popover with sign out */}
        <div className={cn("mt-auto", expanded ? "px-1" : "flex justify-center")}>
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
    </TooltipProvider>
  );
};

export default MobileIconBar;
