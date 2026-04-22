import { SquarePen, Search, MessageCircle } from "lucide-react";
import logoBlack from "@/assets/logo-black.png";
import logoWhite from "@/assets/logo-white.png";

interface MobileIconBarProps {
  onNewConversation: () => void;
  onOpenHistory: () => void;
  onOpenSearch?: () => void;
  userInitials?: string;
}

const MobileIconBar = ({
  onNewConversation,
  onOpenHistory,
  onOpenSearch,
  userInitials = "LC",
}: MobileIconBarProps) => {
  return (
    <aside
      className="md:hidden fixed top-0 left-0 h-full w-14 z-40 bg-card/80 backdrop-blur-xl border-r border-border/50 flex flex-col items-center py-3"
      aria-label="Barra de navegação"
    >
      {/* Logo */}
      <div className="mb-4">
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
      </div>

      {/* New conversation */}
      <button
        onClick={onNewConversation}
        aria-label="Nova conversa"
        className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/60 hover:bg-muted text-foreground transition-colors mb-2"
      >
        <SquarePen className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Search */}
      <button
        onClick={onOpenSearch ?? onOpenHistory}
        aria-label="Buscar"
        className="w-10 h-10 rounded-lg flex items-center justify-center text-foreground hover:bg-muted/60 transition-colors mb-2"
      >
        <Search className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Conversations history */}
      <button
        onClick={onOpenHistory}
        aria-label="Histórico de conversas"
        className="w-10 h-10 rounded-lg flex items-center justify-center text-foreground hover:bg-muted/60 transition-colors"
      >
        <MessageCircle className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Avatar at bottom */}
      <div className="mt-auto">
        <div
          className="w-9 h-9 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-semibold uppercase"
          aria-label="Perfil"
        >
          {userInitials.slice(0, 2)}
        </div>
      </div>
    </aside>
  );
};

export default MobileIconBar;
