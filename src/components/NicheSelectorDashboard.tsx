import { useState } from "react";
import {
  Stethoscope, Scissors, Dumbbell, Heart, Smile, Apple,
  UtensilsCrossed, Pizza, Coffee, Beer, Cake, Truck,
  ShoppingBag, ShoppingCart, PawPrint, Pill, Glasses, Gem,
  Building2, Landmark, Home, Wrench, Zap, HardHat,
  Scale, Calculator, GraduationCap, BookOpen, Brain, Users,
  Package, Ship, Warehouse,
  Monitor, Megaphone, Rocket, Code,
  Camera, Palette, Music, Shirt, Sparkles, MapPin, Leaf, Baby,
  Search
} from "lucide-react";

interface NicheItem {
  name: string;
  icon: string;
}

interface NicheCategory {
  category: string;
  emoji: string;
  niches: NicheItem[];
}

interface NicheSelectorDashboardProps {
  onSelect: (niche: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  stethoscope: Stethoscope, scissors: Scissors, dumbbell: Dumbbell, heart: Heart,
  smile: Smile, apple: Apple, utensils: UtensilsCrossed, pizza: Pizza,
  coffee: Coffee, beer: Beer, cake: Cake, truck: Truck,
  "shopping-bag": ShoppingBag, "shopping-cart": ShoppingCart, paw: PawPrint,
  pill: Pill, glasses: Glasses, gem: Gem, building: Building2,
  landmark: Landmark, home: Home, wrench: Wrench, zap: Zap, hardhat: HardHat,
  scale: Scale, calculator: Calculator, graduation: GraduationCap,
  book: BookOpen, brain: Brain, users: Users, package: Package,
  ship: Ship, warehouse: Warehouse, monitor: Monitor, megaphone: Megaphone,
  rocket: Rocket, code: Code, camera: Camera, palette: Palette,
  music: Music, shirt: Shirt, sparkles: Sparkles, map: MapPin,
  leaf: Leaf, baby: Baby, search: Search,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Saúde & Beleza": "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  "Alimentação": "from-orange-500/20 to-amber-500/20 border-orange-500/30",
  "Comércio & Varejo": "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  "Serviços & Construção": "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
  "Imobiliário": "from-teal-500/20 to-emerald-500/20 border-teal-500/30",
  "Profissionais & Escritórios": "from-purple-500/20 to-violet-500/20 border-purple-500/30",
  "Educação & Treinamento": "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
  "Logística & Indústria": "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
  "Tecnologia": "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
  "Entretenimento & Lifestyle": "from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30",
  "Automotivo": "from-slate-500/20 to-gray-500/20 border-slate-500/30",
  "Pet & Animais": "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
};

const DEFAULT_CATEGORIES: NicheCategory[] = [
  {
    category: "Saúde & Beleza", emoji: "🏥",
    niches: [
      { name: "Clínica de Estética", icon: "sparkles" },
      { name: "Consultório Médico", icon: "stethoscope" },
      { name: "Dentista / Odontologia", icon: "smile" },
      { name: "Academia / CrossFit", icon: "dumbbell" },
      { name: "Salão de Beleza", icon: "scissors" },
      { name: "Barbearia", icon: "scissors" },
      { name: "Nutricionista", icon: "apple" },
      { name: "Psicologia / Terapia", icon: "brain" },
      { name: "Farmácia", icon: "pill" },
      { name: "Spa / Massagem", icon: "heart" },
      { name: "Ótica", icon: "glasses" },
    ],
  },
  {
    category: "Alimentação", emoji: "🍔",
    niches: [
      { name: "Restaurante", icon: "utensils" },
      { name: "Pizzaria", icon: "pizza" },
      { name: "Hamburgueria", icon: "utensils" },
      { name: "Food Truck", icon: "truck" },
      { name: "Padaria / Confeitaria", icon: "cake" },
      { name: "Cafeteria", icon: "coffee" },
      { name: "Bar / Pub", icon: "beer" },
      { name: "Açaíteria", icon: "leaf" },
      { name: "Sorveteria", icon: "sparkles" },
      { name: "Marmitaria / Delivery", icon: "package" },
    ],
  },
  {
    category: "Comércio & Varejo", emoji: "🏪",
    niches: [
      { name: "Loja de Roupas", icon: "shirt" },
      { name: "E-commerce", icon: "shopping-cart" },
      { name: "Pet Shop", icon: "paw" },
      { name: "Joalheria / Acessórios", icon: "gem" },
      { name: "Loja de Cosméticos", icon: "sparkles" },
      { name: "Supermercado / Mercearia", icon: "shopping-cart" },
      { name: "Papelaria", icon: "book" },
      { name: "Loja de Celulares", icon: "monitor" },
      { name: "Floricultura", icon: "leaf" },
      { name: "Sex Shop", icon: "heart" },
      { name: "Loja Infantil", icon: "baby" },
    ],
  },
  {
    category: "Serviços & Construção", emoji: "🏗️",
    niches: [
      { name: "Construtora", icon: "hardhat" },
      { name: "Arquitetura / Design Interior", icon: "home" },
      { name: "Oficina Mecânica", icon: "wrench" },
      { name: "Lavanderia", icon: "sparkles" },
      { name: "Energia Solar", icon: "zap" },
      { name: "Segurança / Monitoramento", icon: "monitor" },
      { name: "Dedetizadora", icon: "sparkles" },
      { name: "Marido de Aluguel", icon: "wrench" },
      { name: "Serralheria / Vidraçaria", icon: "hardhat" },
      { name: "Elétrica / Hidráulica", icon: "zap" },
    ],
  },
  {
    category: "Imobiliário", emoji: "🏠",
    niches: [
      { name: "Imobiliária", icon: "home" },
      { name: "Corretor de Imóveis", icon: "landmark" },
      { name: "Administradora de Condomínio", icon: "building" },
      { name: "Airbnb / Aluguel por Temporada", icon: "home" },
      { name: "Hotel / Pousada", icon: "building" },
    ],
  },
  {
    category: "Profissionais & Escritórios", emoji: "💼",
    niches: [
      { name: "Advocacia / Escritório Jurídico", icon: "scale" },
      { name: "Contabilidade", icon: "calculator" },
      { name: "Consultoria Empresarial", icon: "users" },
      { name: "Coaching / Mentoria", icon: "brain" },
      { name: "Despachante", icon: "book" },
      { name: "Recursos Humanos", icon: "users" },
      { name: "Seguros", icon: "landmark" },
    ],
  },
  {
    category: "Educação & Treinamento", emoji: "🎓",
    niches: [
      { name: "Escola / Colégio", icon: "graduation" },
      { name: "Curso de Idiomas", icon: "book" },
      { name: "Escola de Música", icon: "music" },
      { name: "Autoescola / CFC", icon: "map" },
      { name: "Curso Online / EAD", icon: "monitor" },
      { name: "Escola Infantil / Creche", icon: "baby" },
      { name: "Curso Técnico / Profissionalizante", icon: "graduation" },
    ],
  },
  {
    category: "Logística & Indústria", emoji: "📦",
    niches: [
      { name: "Distribuidora", icon: "warehouse" },
      { name: "Importação / Exportação", icon: "ship" },
      { name: "Transportadora / Frete", icon: "truck" },
      { name: "Atacado", icon: "package" },
      { name: "Fábrica / Indústria", icon: "building" },
      { name: "Gráfica", icon: "palette" },
    ],
  },
  {
    category: "Tecnologia", emoji: "💻",
    niches: [
      { name: "Agência de Marketing Digital", icon: "megaphone" },
      { name: "Software House", icon: "code" },
      { name: "Startup", icon: "rocket" },
      { name: "Assistência Técnica", icon: "monitor" },
      { name: "Provedor de Internet", icon: "zap" },
      { name: "Agência de Design", icon: "palette" },
    ],
  },
  {
    category: "Entretenimento & Lifestyle", emoji: "🎉",
    niches: [
      { name: "Fotografia / Vídeo", icon: "camera" },
      { name: "Estúdio de Tatuagem", icon: "palette" },
      { name: "Casa de Festas / Buffet", icon: "cake" },
      { name: "Espaço de Eventos", icon: "sparkles" },
      { name: "Loja de Games", icon: "monitor" },
      { name: "Studio de Pilates / Yoga", icon: "heart" },
    ],
  },
  {
    category: "Automotivo", emoji: "🚗",
    niches: [
      { name: "Concessionária / Revenda", icon: "building" },
      { name: "Lava-Jato / Estética Automotiva", icon: "sparkles" },
      { name: "Autopeças", icon: "wrench" },
      { name: "Funilaria / Pintura", icon: "palette" },
      { name: "Locadora de Veículos", icon: "truck" },
    ],
  },
  {
    category: "Pet & Animais", emoji: "🐾",
    niches: [
      { name: "Pet Shop", icon: "paw" },
      { name: "Clínica Veterinária", icon: "stethoscope" },
      { name: "Hotel / Creche para Pets", icon: "home" },
      { name: "Banho & Tosa", icon: "scissors" },
      { name: "Adestramento", icon: "paw" },
    ],
  },
];

const NicheSelectorDashboard = ({ onSelect }: NicheSelectorDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredNiche, setHoveredNiche] = useState<string | null>(null);

  const filteredCategories = searchTerm
    ? DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        niches: cat.niches.filter(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()))
      })).filter(cat => cat.niches.length > 0)
    : DEFAULT_CATEGORIES;

  return (
    <div className="w-full animate-[float-up_0.4s_ease-out_forwards] space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-foreground">Escolha o Nicho para Prospectar</span>
      </div>

      <p className="text-[10px] text-muted-foreground">
        🇧🇷 Brasil • 🇺🇸 EUA • 🇨🇦 Canadá • 🇪🇺 Europa — Apenas brasileiros
      </p>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar nicho..."
          className="w-full pl-8 pr-3 py-2 text-[11px] rounded-lg bg-secondary/40 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3" style={{ scrollbarWidth: "thin" }}>
        {filteredCategories.map((cat) => {
          const colorClass = CATEGORY_COLORS[cat.category] || "from-primary/20 to-primary/10 border-primary/30";
          return (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{cat.emoji}</span>
                <span className="text-[11px] font-bold text-foreground">{cat.category}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {cat.niches.map((niche) => {
                  const IconComp = ICON_MAP[niche.icon] || Building2;
                  const isHovered = hoveredNiche === niche.name;
                  return (
                    <button
                      key={niche.name}
                      onClick={() => onSelect(niche.name)}
                      onMouseEnter={() => setHoveredNiche(niche.name)}
                      onMouseLeave={() => setHoveredNiche(null)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-200 bg-gradient-to-br ${colorClass} ${
                        isHovered ? "scale-[1.02] shadow-lg shadow-primary/10 border-primary/50" : "hover:border-primary/40"
                      }`}
                    >
                      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isHovered ? "bg-primary/30" : "bg-background/30"
                      }`}>
                        <IconComp className={`w-3.5 h-3.5 transition-colors ${isHovered ? "text-primary" : "text-foreground/70"}`} />
                      </div>
                      <span className={`text-[11px] font-medium leading-tight transition-colors ${
                        isHovered ? "text-primary" : "text-foreground/90"
                      }`}>
                        {niche.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NicheSelectorDashboard;
