import { useState } from "react";
import { Settings, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GoogleAdsSettingsProps {
  customerId: string | null;
  onSave: (id: string) => Promise<{ success: boolean; message: string } | undefined>;
  loading: boolean;
  error: string | null;
}

const GoogleAdsSettings = ({ customerId, onSave, loading, error }: GoogleAdsSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(customerId || "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    setSaving(true);
    setResult(null);
    const res = await onSave(inputValue.trim());
    if (res) setResult(res);
    setSaving(false);
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setInputValue(customerId || ""); setResult(null); }}
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
              Insira o ID da conta Google Ads (formato: 123-456-7890). Uma solicitação de vinculação será enviada para o proprietário da conta aceitar.
            </p>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="123-456-7890"
              className="mb-3 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground text-sm"
            />

            {customerId && !result && (
              <p className="text-xs text-muted-foreground mb-3">
                Conta atual: <span className="text-foreground font-mono">{customerId}</span>
              </p>
            )}

            {result && (
              <div className={cn(
                "flex items-start gap-2 p-3 rounded-lg mb-3 text-xs",
                result.success ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"
              )}>
                {result.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{result.message}</span>
              </div>
            )}

            {error && !result && (
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
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Enviando solicitação...
                </span>
              ) : (
                "Enviar solicitação de vinculação"
              )}
            </button>

            {!result?.success && (
              <p className="text-muted-foreground text-[10px] mt-2 text-center">
                Após enviar, o proprietário da conta precisará aceitar o convite no Google Ads.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAdsSettings;
