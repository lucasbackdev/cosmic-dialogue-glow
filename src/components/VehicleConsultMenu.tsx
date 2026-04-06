import { useState } from "react";
import { Car, DollarSign, AlertTriangle, Shield, Gavel, Building2, FileText, CheckCircle2, Loader2 } from "lucide-react";

export interface VehicleConsultOption {
  key: string;
  label: string;
  description: string;
  price: string;
  icon: React.ReactNode;
}

const CONSULT_OPTIONS: VehicleConsultOption[] = [
  { key: "basica", label: "Dados Básicos", description: "Marca, modelo, ano, cor, chassi, motor", price: "R$ 0,25", icon: <Car className="w-5 h-5" /> },
  { key: "fipe", label: "Preço FIPE", description: "Valor de mercado atualizado", price: "R$ 0,79", icon: <DollarSign className="w-5 h-5" /> },
  { key: "sinistro", label: "Sinistro / PT", description: "Perda total, batida, indenização", price: "R$ 3,60", icon: <AlertTriangle className="w-5 h-5" /> },
  { key: "roubo", label: "Roubo e Furto", description: "Histórico de roubo e furto", price: "R$ 5,52", icon: <Shield className="w-5 h-5" /> },
  { key: "leilao", label: "Leilão", description: "Registro de ofertas e classificação", price: "R$ 13,52", icon: <Gavel className="w-5 h-5" /> },
  { key: "gravame", label: "Gravame", description: "Financiamento, alienação fiduciária", price: "R$ 3,68", icon: <Building2 className="w-5 h-5" /> },
  { key: "infracoes", label: "Infrações", description: "Multas e débitos (RENAINF)", price: "R$ 3,60", icon: <FileText className="w-5 h-5" /> },
];

interface VehicleConsultMenuProps {
  plate: string;
  onConsult: (types: string[]) => void;
  loading?: boolean;
}

const VehicleConsultMenu = ({ plate, onConsult, loading }: VehicleConsultMenuProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOption = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === CONSULT_OPTIONS.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(CONSULT_OPTIONS.map(o => o.key)));
    }
  };

  const totalPrice = CONSULT_OPTIONS
    .filter(o => selected.has(o.key))
    .reduce((sum, o) => sum + parseFloat(o.price.replace("R$ ", "").replace(",", ".")), 0);

  const allSelected = selected.size === CONSULT_OPTIONS.length;

  return (
    <div className="w-full max-h-[calc(100vh-10rem)] rounded-xl border border-border/30 bg-card/60 backdrop-blur-md overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Consulta Veicular</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              Placa: <span className="text-primary">{plate}</span>
            </p>
          </div>
          <button
            onClick={selectAll}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              allSelected
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-secondary/50 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50"
            }`}
          >
            {allSelected ? "Desmarcar" : "Selecionar Tudo"}
          </button>
        </div>
      </div>

      {/* Options Grid */}
      <div className="p-3 grid grid-cols-2 gap-2">
        {CONSULT_OPTIONS.map((option) => {
          const isSelected = selected.has(option.key);
          return (
            <button
              key={option.key}
              onClick={() => toggleOption(option.key)}
              disabled={loading}
              className={`relative flex flex-col items-start p-3 rounded-lg border transition-all text-left ${
                isSelected
                  ? "bg-primary/10 border-primary/40 shadow-sm shadow-primary/10"
                  : "bg-secondary/30 border-border/20 hover:bg-secondary/50 hover:border-border/40"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={`p-1.5 rounded-md mb-2 ${isSelected ? "bg-primary/20 text-primary" : "bg-secondary/60 text-muted-foreground"}`}>
                {option.icon}
              </div>
              <p className={`text-xs font-medium leading-tight ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                {option.label}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">
                {option.description}
              </p>
              <p className={`text-[10px] font-semibold mt-1.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                {option.price}
              </p>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/20 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {selected.size > 0 ? (
            <>
              <span className="text-foreground font-medium">{selected.size}</span> selecionada{selected.size > 1 ? "s" : ""}
              <span className="mx-1.5 text-border">·</span>
              <span className="text-primary font-semibold">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
            </>
          ) : (
            "Selecione as consultas"
          )}
        </div>
        <button
          onClick={() => onConsult(Array.from(selected))}
          disabled={selected.size === 0 || loading}
          className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Consultando...
            </>
          ) : (
            "Consultar"
          )}
        </button>
      </div>
    </div>
  );
};

export default VehicleConsultMenu;
