import { Building2, MapPin, Globe, Star, Briefcase, Users, ExternalLink, TrendingUp, Search, Phone, Mail, MessageCircle, DollarSign, AlertTriangle, CheckCircle, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface LeadData {
  name: string;
  company?: string;
  country: string;
  city?: string;
  sector: string;
  service_needed: string;
  website?: string;
  linkedin?: string;
  instagram?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  search_query_pt?: string;
  score: number;
  recent_activity?: string;
  search_query?: string;
  problem?: string;
  solution?: string;
  outreach_message?: string;
  fair_price?: string;
}

export interface NicheGroup {
  niche: string;
  leads: LeadData[];
}

interface LeadResultsPanelProps {
  leads: LeadData[];
  niches?: NicheGroup[];
  strategies?: string[];
}

const ScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 8 ? "text-green-400 bg-green-400/10 border-green-400/20"
    : score >= 5 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
    : "text-red-400 bg-red-400/10 border-red-400/20";

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${color}`}>
      <Star className="w-3 h-3" />
      {score}/10
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
      title="Copiar"
    >
      {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

const LeadCard = ({ lead }: { lead: LeadData }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 rounded-xl bg-secondary/40 border border-border/30 space-y-2 hover:bg-secondary/60 hover:border-primary/30 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
            {lead.company && <p className="text-[10px] text-muted-foreground truncate">{lead.company}</p>}
          </div>
        </div>
        <ScoreBadge score={lead.score} />
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{lead.city ? `${lead.city}, ${lead.country}` : lead.country}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Briefcase className="w-3 h-3 shrink-0" />
          <span className="truncate">{lead.sector}</span>
        </div>
      </div>

      {/* What they searched */}
      {lead.search_query && (
        <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Pesquisou por:</p>
          <p className="text-[11px] text-primary font-medium">"{lead.search_query}"</p>
          {lead.recent_activity && (
            <p className="text-[9px] text-muted-foreground mt-0.5">{lead.recent_activity}</p>
          )}
        </div>
      )}

      {/* Service needed */}
      <div className="flex items-center gap-1 text-[10px] text-primary">
        <TrendingUp className="w-3 h-3 shrink-0" />
        <span className="truncate">{lead.service_needed}</span>
      </div>

      {/* Contacts - show data directly with copy */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/20">
        {lead.whatsapp && (
          <div className="flex items-center gap-0.5 text-[10px] text-green-400">
            <MessageCircle className="w-3 h-3" />
            <span>{lead.whatsapp}</span>
            <CopyButton text={lead.whatsapp} />
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{lead.phone}</span>
            <CopyButton text={lead.phone} />
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Mail className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{lead.email}</span>
            <CopyButton text={lead.email} />
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Globe className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{lead.website}</span>
            <CopyButton text={lead.website} />
          </div>
        )}
        {lead.linkedin && (
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <ExternalLink className="w-3 h-3" />
            <span className="truncate max-w-[100px]">LinkedIn</span>
            <CopyButton text={lead.linkedin} />
          </div>
        )}
        {lead.instagram && (
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <ExternalLink className="w-3 h-3" />
            <span className="truncate max-w-[100px]">Instagram</span>
            <CopyButton text={lead.instagram} />
          </div>
        )}
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground pt-1 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Menos detalhes" : "Problema, solução, mensagem e preço"}
      </button>

      {expanded && (
        <div className="space-y-2 pt-1 animate-[float-up_0.3s_ease-out_forwards]">
          {/* Problem */}
          {lead.problem && (
            <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-semibold text-red-400">Problema</span>
              </div>
              <p className="text-[11px] text-foreground/80 leading-relaxed">{lead.problem}</p>
            </div>
          )}

          {/* Solution */}
          {lead.solution && (
            <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-semibold text-green-400">Solução</span>
              </div>
              <p className="text-[11px] text-foreground/80 leading-relaxed">{lead.solution}</p>
            </div>
          )}

          {/* Fair price */}
          {lead.fair_price && (
            <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold text-primary">Valor justo de mercado</span>
              </div>
              <p className="text-[11px] text-foreground font-semibold">{lead.fair_price}</p>
            </div>
          )}

          {/* Outreach message */}
          {lead.outreach_message && (
            <div className="p-2 rounded-lg bg-secondary/60 border border-border/30">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-semibold text-primary">Mensagem sugerida</span>
                </div>
                <CopyButton text={lead.outreach_message} />
              </div>
              <p className="text-[11px] text-foreground/80 leading-relaxed italic">"{lead.outreach_message}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NicheCard = ({ niche, onSelect, selected }: { niche: NicheGroup; onSelect: () => void; selected: boolean }) => (
  <button
    onClick={onSelect}
    className={`p-3 rounded-xl border text-left transition-all duration-200 ${
      selected
        ? "bg-primary/10 border-primary/30 shadow-md shadow-primary/5"
        : "bg-secondary/40 border-border/30 hover:bg-secondary/60 hover:border-primary/20"
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selected ? "bg-primary/20" : "bg-primary/10"}`}>
          <Briefcase className={`w-3.5 h-3.5 ${selected ? "text-primary" : "text-primary/70"}`} />
        </div>
        <span className="text-xs font-semibold text-foreground">{niche.niche}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{niche.leads.length} lead{niche.leads.length !== 1 ? "s" : ""}</span>
    </div>
  </button>
);

const StrategyCard = ({ strategy }: { strategy: string }) => (
  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-2">
    <Search className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
    <span className="text-[11px] text-foreground leading-relaxed">{strategy}</span>
  </div>
);

const LeadResultsPanel = ({ leads, niches, strategies }: LeadResultsPanelProps) => {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);

  const hasNiches = niches && niches.length > 0;
  const displayLeads = hasNiches && selectedNiche
    ? niches.find(n => n.niche === selectedNiche)?.leads || []
    : leads;

  return (
    <div className="w-full animate-[float-up_0.4s_ease-out_forwards] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            {hasNiches && !selectedNiche ? "Nichos Encontrados" : "Leads Encontrados"}
          </span>
        </div>
        {selectedNiche && (
          <button onClick={() => setSelectedNiche(null)} className="text-[10px] text-primary hover:underline">
            ← Voltar aos nichos
          </button>
        )}
        {!hasNiches && (
          <span className="text-[10px] text-muted-foreground">{leads.length} resultado{leads.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Niche selection */}
      {hasNiches && !selectedNiche && (
        <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          {niches.map((n, i) => (
            <NicheCard key={i} niche={n} onSelect={() => setSelectedNiche(n.niche)} selected={false} />
          ))}
        </div>
      )}

      {/* Lead cards */}
      {(!hasNiches || selectedNiche) && (
        <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          {displayLeads.map((lead, i) => (
            <LeadCard key={i} lead={lead} />
          ))}
        </div>
      )}

      {strategies && strategies.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-foreground">Estratégias de Prospecção</span>
          </div>
          {strategies.map((s, i) => (
            <StrategyCard key={i} strategy={s} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadResultsPanel;
