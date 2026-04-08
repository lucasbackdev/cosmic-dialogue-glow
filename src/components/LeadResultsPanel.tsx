import { Building2, MapPin, Globe, Star, Calendar, Briefcase, Users, ExternalLink, TrendingUp, Search } from "lucide-react";

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
  score: number;
  recent_activity?: string;
}

interface LeadResultsPanelProps {
  leads: LeadData[];
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

const LeadCard = ({ lead }: { lead: LeadData }) => (
  <div className="p-3 rounded-xl bg-secondary/40 border border-border/30 space-y-2 hover:bg-secondary/60 hover:border-primary/30 transition-all duration-200">
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

    <div className="flex items-center gap-1 text-[10px] text-primary">
      <TrendingUp className="w-3 h-3 shrink-0" />
      <span className="truncate">{lead.service_needed}</span>
    </div>

    {lead.recent_activity && (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Calendar className="w-3 h-3 shrink-0" />
        <span className="truncate">{lead.recent_activity}</span>
      </div>
    )}

    <div className="flex items-center gap-2 pt-1 border-t border-border/20">
      {lead.website && (
        <a href={lead.website} target="_blank" rel="noopener" className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <Globe className="w-3 h-3" /> Site
        </a>
      )}
      {lead.linkedin && (
        <a href={lead.linkedin} target="_blank" rel="noopener" className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <ExternalLink className="w-3 h-3" /> LinkedIn
        </a>
      )}
      {lead.instagram && (
        <a href={lead.instagram} target="_blank" rel="noopener" className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <ExternalLink className="w-3 h-3" /> Instagram
        </a>
      )}
    </div>
  </div>
);

const StrategyCard = ({ strategy }: { strategy: string }) => (
  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-2">
    <Search className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
    <span className="text-[11px] text-foreground leading-relaxed">{strategy}</span>
  </div>
);

const LeadResultsPanel = ({ leads, strategies }: LeadResultsPanelProps) => {
  return (
    <div className="w-full animate-[float-up_0.4s_ease-out_forwards] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Leads Encontrados</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{leads.length} resultado{leads.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {leads.map((lead, i) => (
          <LeadCard key={i} lead={lead} />
        ))}
      </div>

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
