import { useState } from "react";
import {
  Stethoscope, Scissors, Dumbbell, Heart, Smile, Apple,
  UtensilsCrossed, Pizza, Coffee, Beer, Cake, Truck,
  ShoppingBag, ShoppingCart, PawPrint, Pill, Glasses, Gem,
  Building2, Landmark, Home, Wrench, Zap, HardHat,
  Scale, Calculator, GraduationCap, BookOpen, Brain, Users,
  Package, Ship, TruckIcon, Warehouse,
  Monitor, Megaphone, Rocket, Code,
  Camera, Palette, Music, Shirt, Sparkles, MapPin, Leaf, Baby,
  Search
} from "lucide-react";

export interface NicheCategory {
  category: string;
  emoji: string;
  niches: { name: string; icon: string }[];
}

interface NicheSelectorDashboardProps {
  categories: NicheCategory[];
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
  "Profissionais & Escritórios": "from-purple-500/20 to-violet-500/20 border-purple-500/30",
  "Logística & Indústria": "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
  "Tecnologia": "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
  "Educação & Treinamento": "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
  "Entretenimento & Lifestyle": "from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30",
  "Pet & Animais": "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
  "Automotivo": "from-slate-500/20 to-gray-500/20 border-slate-500/30",
  "Imobiliário": "from-teal-500/20 to-emerald-500/20 border-teal-500/30",
};

const NicheSelectorDashboard = ({ categories, onSelect }: NicheSelectorDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredNiche, setHoveredNiche] = useState<string | null>(null);

  const filteredCategories = searchTerm
    ? categories.map(cat => ({
        ...cat,
        niches: cat.niches.filter(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()))
      })).filter(cat => cat.niches.length > 0)
    : categories;

  return (
    <div className="w-full animate-[float-up_0.4s_ease-out_forwards] space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-foreground">Escolha o Nicho para Prospectar</span>
      </div>

      <p className="text-[10px] text-muted-foreground">
        🇧🇷 Brasil • 🇺🇸 EUA • 🇨🇦 Canadá • 🇪🇺 Europa — Apenas brasileiros
      </p>

      {/* Search */}
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

      {/* Categories grid */}
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
