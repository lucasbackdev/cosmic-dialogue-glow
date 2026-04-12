import { Settings, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface GoogleAdsOnboardingProps {
  onOpenSettings: () => void;
  showResumeButton?: boolean;
  onResume?: () => void;
}

const GoogleAdsOnboarding = ({ onOpenSettings, showResumeButton, onResume }: GoogleAdsOnboardingProps) => {
  const { language } = useLanguage();
  const isPt = language === "pt-BR";

  return (
    <div className="mt-3 p-4 rounded-lg bg-card/40 backdrop-blur-sm border border-border/30 max-w-md">
      <h3 className="text-sm font-semibold text-foreground mb-2">
        {isPt ? "Conecte sua conta Google Ads" : "Connect your Google Ads account"}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        {isPt
          ? "Para ver suas métricas reais, registre o ID da sua conta Google Ads nas configurações. Veja na imagem abaixo onde encontrar o ID:"
          : "To see your real metrics, register your Google Ads account ID in settings. See the image below to find your ID:"}
      </p>

      <div className="rounded-lg overflow-hidden border border-border/20 mb-3">
        <img
          src="/images/google-ads-id-guide.png"
          alt={isPt ? "Onde encontrar o ID da conta Google Ads" : "Where to find Google Ads account ID"}
          className="w-full h-auto"
        />
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {isPt
          ? "O ID fica no canto superior direito da sua conta Google Ads (formato: 123-456-7890)."
          : "The ID is in the top right corner of your Google Ads account (format: 123-456-7890)."}
      </p>

      <button
        onClick={onOpenSettings}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/20 text-foreground text-sm font-medium hover:bg-primary/30 transition-colors border border-primary/30 mb-2"
      >
        <Settings className="w-4 h-4" />
        {isPt ? "Registrar ID nas Configurações" : "Register ID in Settings"}
      </button>

      {showResumeButton && onResume && (
        <button
          onClick={onResume}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {isPt ? "Vamos lá" : "Let's go"}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default GoogleAdsOnboarding;
