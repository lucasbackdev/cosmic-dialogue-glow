import { Plus, Trash2, MessageSquare, LogOut, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/hooks/useConversations";
import GoogleAdsSettings from "./GoogleAdsSettings";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConversationsSidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSignOut: () => void;
  open: boolean;
  onToggle: () => void;
  credits?: { total_credits: number; used_credits: number; remaining: number } | null;
  googleAds?: {
    customerId: string | null;
    onSave: (id: string) => Promise<{ success: boolean; message: string } | undefined>;
    loading: boolean;
    error: string | null;
  };
}

const ConversationsSidebar = ({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onSignOut,
  open,
  onToggle,
  googleAds,
}: ConversationsSidebarProps) => {
  const { t } = useLanguage();

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card/60 backdrop-blur-md border border-border hover:bg-card/80 transition-colors"
      >
        <MessageSquare className="w-5 h-5 text-foreground" />
      </button>

      <div
        className={cn(
          "fixed top-0 left-0 h-full w-72 z-40 transition-transform duration-300 ease-in-out",
          "bg-card/30 backdrop-blur-xl border-r border-border/50",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full pt-16 pb-4 px-3">
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-foreground text-sm transition-colors mb-3"
          >
            <Plus className="w-4 h-4" />
            {t("newConversation")}
          </button>

          <div className="flex-1 overflow-y-auto space-y-1" style={{ scrollbarWidth: "none" }}>
            {conversations.map((convo) => (
              <div
                key={convo.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors",
                  currentId === convo.id
                    ? "bg-primary/20 text-foreground"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                )}
                onClick={() => onSelect(convo.id)}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1">{convo.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(convo.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-muted-foreground text-xs text-center mt-8">
                {t("noConversations")}
              </p>
            )}
          </div>

          {googleAds && (
            <GoogleAdsSettings
              customerId={googleAds.customerId}
              onSave={googleAds.onSave}
              loading={googleAds.loading}
              error={googleAds.error}
            />
          )}

          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/50 text-sm transition-colors mt-2"
          >
            <LogOut className="w-4 h-4" />
            {t("signOut")}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/40 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default ConversationsSidebar;
