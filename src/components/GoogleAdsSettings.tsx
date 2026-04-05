import { useState } from "react";
import { Settings, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GoogleAdsSettingsProps {
  customerId: string | null;
  onSave: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const GoogleAdsSettings = ({ customerId, onSave, loading, error }: GoogleAdsSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(customerId || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    setSaving(true);
    await onSave(inputValue.trim());
    setSaving(false);
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setInputValue(customerId || ""); }}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/50 text-sm transition-colors"
      >
        <Settings className="w-4 h-4" />
        Configurações
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-foreground font-medium text-sm">Google Ads</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-muted-foreground text-xs mb-3">
              Insira o ID da sua conta Google Ads (formato: 123-456-7890). Após salvar, uma solicitação de acesso será enviada para sua conta.
            </p>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="123-456-7890"
              className="mb-3 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground text-sm"
            />

            {customerId && (
              <p className="text-xs text-muted-foreground mb-3">
                Conta atual: <span className="text-foreground font-mono">{customerId}</span>
              </p>
            )}

            {error && (
              <p className="text-xs text-destructive mb-3">{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={!inputValue.trim() || saving || loading}
              className={cn(
                "w-full py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {saving || loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Conectando...
                </span>
              ) : (
                "Salvar e conectar"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAdsSettings;
