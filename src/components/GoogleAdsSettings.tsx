import { useState, useEffect } from "react";
import { Settings, X, Loader2, CheckCircle, AlertCircle, Globe, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

interface GoogleAdsSettingsProps {
  customerId: string | null;
  onSave: (id: string) => Promise<{ success: boolean; message: string } | undefined>;
  loading: boolean;
  error: string | null;
}

const GoogleAdsSettings = ({ customerId, onSave, loading, error }: GoogleAdsSettingsProps) => {
  const { t, language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(customerId || "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

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
        {t("settings")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-foreground font-medium text-sm">{t("settings")}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language selector */}
            <div className="mb-5 pb-4 border-b border-border/30">
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

            {/* Google Ads section */}
            <h3 className="text-foreground font-medium text-xs mb-2">{t("googleAds")}</h3>
            <p className="text-muted-foreground text-xs mb-3">{t("googleAdsDesc")}</p>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="123-456-7890"
              className="mb-3 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground text-sm"
            />

            {customerId && !result && (
              <p className="text-xs text-muted-foreground mb-3">
                {t("currentAccount")}: <span className="text-foreground font-mono">{customerId}</span>
              </p>
            )}

            {result && (
              <div className={cn(
                "flex items-start gap-2 p-3 rounded-lg mb-3 text-xs",
                result.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
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
                  {t("sendingRequest")}
                </span>
              ) : (
                t("sendLinkRequest")
              )}
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAdsSettings;
