import { useEffect, useRef, useState } from "react";
import { Check, MessageCircle, Sparkles, Zap, BarChart3, Bot, ShieldCheck, Rocket, ArrowRight } from "lucide-react";
import logoBlack from "@/assets/logo-black.png";
import logoWhite from "@/assets/logo-white.png";

const WHATSAPP = "5521975560574";

const wppLink = (plano: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Olá! Quero contratar o plano ${plano} da IA de gestão de campanhas KahlChat.`
  )}`;

const plans = [
  {
    name: "Starter",
    price: "100",
    highlight: false,
    desc: "Para quem está começando a anunciar no Google Ads.",
    features: [
      "1 conta Google Ads conectada",
      "100.000 tokens de IA / mês",
      "Criação e otimização automática",
      "Relatórios semanais por IA",
      "Suporte por e-mail",
    ],
  },
  {
    name: "Pro",
    price: "239",
    highlight: true,
    desc: "Para profissionais e pequenas agências que querem escalar.",
    features: [
      "Até 5 contas Google Ads",
      "500.000 tokens de IA / mês",
      "Otimização contínua 24/7",
      "Alertas inteligentes de performance",
      "Sugestões de palavras-chave por IA",
      "Suporte prioritário no WhatsApp",
    ],
  },
  {
    name: "Agency",
    price: "489",
    highlight: false,
    desc: "Para agências que gerenciam vários clientes.",
    features: [
      "Contas ilimitadas",
      "2.000.000 tokens de IA / mês",
      "Multi-usuário e permissões",
      "Dashboard white-label",
      "Onboarding 1:1 dedicado",
      "Suporte VIP no WhatsApp em até 1h",
    ],
  },
];

const demoSequence = [
  { role: "user", text: "Crie uma campanha de Search para minha clínica de estética em SP, R$50/dia." },
  {
    role: "ai",
    text:
      "Perfeito! Estruturando: 1 campanha Search • 3 grupos de anúncios • 24 palavras-chave (frase + exata) • 6 anúncios responsivos. Lances tCPA. Confirmar?",
  },
  { role: "user", text: "Confirmar." },
  {
    role: "ai",
    text:
      "✅ Campanha publicada. CTR previsto: 6,2% • CPL estimado: R$18,40. Já estou monitorando em tempo real e otimizo lances a cada 15min.",
  },
  { role: "user", text: "Como está hoje?" },
  {
    role: "ai",
    text:
      "Hoje: 142 cliques • 11 leads • CPL real R$15,90 (-13% vs estimado). Pausei 3 keywords ruins e aumentei lance nas 5 que mais convertem.",
  },
];

const DemoChat = () => {
  const [visible, setVisible] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible >= demoSequence.length) {
      const t = setTimeout(() => setVisible(0), 4000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), visible === 0 ? 600 : 1600);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [visible]);

  return (
    <div className="w-full max-w-md mx-auto bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">KahlChat IA</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> gerenciando suas campanhas
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-muted-foreground" />
      </div>
      <div ref={ref} className="h-80 overflow-y-auto p-4 space-y-3 bg-background">
        {demoSequence.slice(0, visible).map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            style={{ animation: "float-up 0.4s ease-out" }}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-foreground text-background rounded-br-sm"
                  : "bg-secondary text-foreground rounded-bl-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {visible < demoSequence.length && visible > 0 && demoSequence[visible - 1].role === "user" && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const features = [
  { icon: Bot, title: "IA que pensa por você", desc: "Cria, otimiza e pausa campanhas automaticamente baseado em performance real." },
  { icon: Zap, title: "Otimização 24/7", desc: "Ajustes de lances e palavras-chave a cada 15 minutos, sem você levantar um dedo." },
  { icon: BarChart3, title: "Relatórios em linguagem natural", desc: "Pergunte 'como foi minha semana?' e receba análise completa em segundos." },
  { icon: ShieldCheck, title: "Aprovação Google Ads", desc: "Integração oficial via API homologada pelo Google. Seus dados seguros." },
];

const faqs = [
  { q: "Preciso saber de Google Ads?", a: "Não. A IA cria, configura e otimiza tudo. Você só diz o que quer vender e quanto pode investir." },
  { q: "Como funciona a cobrança?", a: "Mensalidade fixa do plano + seu orçamento de mídia pago direto ao Google. Sem fidelidade." },
  { q: "Posso trocar de plano?", a: "Sim, a qualquer momento. Upgrade imediato, downgrade no próximo ciclo." },
  { q: "E o suporte?", a: "Todos os planos têm suporte. Pro e Agency têm WhatsApp prioritário com resposta em poucas horas." },
];

const Vendas = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoBlack} alt="KahlChat" className="w-7 h-7 dark:hidden" />
            <img src={logoWhite} alt="KahlChat" className="w-7 h-7 hidden dark:block" />
            <span className="font-semibold tracking-tight">KahlChat</span>
          </div>
          <a
            href={wppLink("Pro")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 h-9 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition"
          >
            <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-medium border border-border">
              <Sparkles className="w-3 h-3" /> IA que gerencia seu Google Ads
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Sua agência de Google Ads<br />
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                em uma única IA.
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              A KahlChat cria, otimiza e monitora suas campanhas no Google Ads 24/7. Sem agência, sem complicação, sem desperdício de verba.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <a
                href={wppLink("Pro")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition"
              >
                <MessageCircle className="w-4 h-4" /> Começar pelo WhatsApp
              </a>
              <a
                href="#planos"
                className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full border border-border font-semibold hover:bg-secondary transition"
              >
                Ver planos <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-6 flex items-center gap-4 justify-center lg:justify-start text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><Check className="w-3 h-3" /> Sem fidelidade</div>
              <div className="flex items-center gap-1"><Check className="w-3 h-3" /> API oficial Google</div>
              <div className="flex items-center gap-1"><Check className="w-3 h-3" /> Setup em minutos</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 bg-foreground/5 blur-3xl rounded-full pointer-events-none" />
            <div className="relative">
              <DemoChat />
              <p className="text-center text-xs text-muted-foreground mt-3">
                ↑ Demonstração ao vivo da IA gerenciando uma campanha real
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Por que a KahlChat?</h2>
          <p className="mt-3 text-muted-foreground">
            Substitui um gestor de tráfego pago por uma IA que nunca dorme, nunca esquece e nunca cobra hora extra.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-border bg-card hover:bg-secondary/50 transition">
              <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-medium border border-border">
            <Rocket className="w-3 h-3" /> Planos
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Escolha seu plano</h2>
          <p className="mt-3 text-muted-foreground">
            Mensalidade fixa. Sem fidelidade. Cancele quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative p-6 sm:p-8 rounded-3xl border flex flex-col ${
                p.highlight
                  ? "border-foreground bg-foreground text-background shadow-2xl md:scale-105"
                  : "border-border bg-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background text-foreground text-xs font-semibold border border-border">
                  Mais popular
                </span>
              )}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className={`text-sm mt-1 ${p.highlight ? "text-background/70" : "text-muted-foreground"}`}>
                {p.desc}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-sm">R$</span>
                <span className="text-5xl font-bold tracking-tight">{p.price}</span>
                <span className={`text-sm ${p.highlight ? "text-background/70" : "text-muted-foreground"}`}>/mês</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.highlight ? "text-background" : "text-foreground"}`} />
                    <span className={p.highlight ? "text-background/90" : "text-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={wppLink(p.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 inline-flex items-center justify-center gap-2 h-12 rounded-full font-semibold transition ${
                  p.highlight
                    ? "bg-background text-foreground hover:opacity-90"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                <MessageCircle className="w-4 h-4" /> Contratar pelo WhatsApp
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-10">Perguntas frequentes</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group p-5 rounded-2xl border border-border bg-card open:bg-secondary/40">
              <summary className="cursor-pointer font-semibold flex items-center justify-between list-none">
                {f.q}
                <span className="ml-4 text-muted-foreground group-open:rotate-45 transition">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-3xl bg-foreground text-background p-8 sm:p-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Pronto para parar de queimar verba?</h2>
          <p className="mt-3 text-background/70 max-w-xl mx-auto">
            Fale agora com nosso time no WhatsApp e veja a IA criar sua primeira campanha em minutos.
          </p>
          <a
            href={wppLink("Pro")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 px-7 h-12 rounded-full bg-background text-foreground font-semibold hover:opacity-90 transition"
          >
            <MessageCircle className="w-5 h-5" /> Falar no WhatsApp agora
          </a>
        </div>
      </section>

      {/* Floating WhatsApp */}
      <a
        href={wppLink("Pro")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-green-500 text-white shadow-2xl flex items-center justify-center hover:scale-105 transition"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} KahlChat • Todos os direitos reservados
      </footer>
    </div>
  );
};

export default Vendas;
