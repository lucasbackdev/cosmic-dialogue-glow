import { Crown, ExternalLink } from "lucide-react";

const KIWIFY_CHECKOUT = "https://pay.kiwify.com.br/GJOxhro";

interface PaywallCardProps {
  onClose?: () => void;
}

const PaywallCard = ({ onClose }: PaywallCardProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-sm bg-card/90 backdrop-blur-xl border border-border/30 rounded-2xl p-6 shadow-2xl">
        {/* Glow effect */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center gap-4 text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Crown className="w-7 h-7 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground">
            Assine o KahlChat
          </h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para usar a IA e todas as funcionalidades, assine o plano essencial.
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">R$ 39</span>
            <span className="text-lg text-muted-foreground">,90</span>
            <span className="text-sm text-muted-foreground">/mês</span>
          </div>

          {/* Features */}
          <ul className="text-sm text-muted-foreground space-y-1.5 text-left w-full">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> IA para criar e gerenciar campanhas
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Monitoramento em tempo real
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Prospecção de leads
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Consulta veicular
            </li>
          </ul>

          {/* CTA Button */}
          <a
            href={KIWIFY_CHECKOUT}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            Assinar agora
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              Voltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaywallCard;
