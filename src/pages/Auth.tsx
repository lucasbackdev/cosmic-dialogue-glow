import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MessageCircle, Zap, Shield, BarChart3, Globe, Check } from "lucide-react";

const PLANS = [
  {
    name: "Basic",
    price: "R$ 39,90",
    period: "/mês",
    features: [
      "500 pontos/mês",
      "Chat IA com limite",
      "Prospecção de leads básica",
      "1 conta Google Ads",
      "Suporte por email",
    ],
    popular: false,
  },
  {
    name: "Starter",
    price: "R$ 97",
    period: "/mês",
    features: [
      "2.000 pontos/mês",
      "Chat IA avançado",
      "Prospecção de leads completa",
      "1 conta Google Ads",
      "Suporte por email",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "R$ 197",
    period: "/mês",
    features: [
      "5.000 pontos/mês",
      "Leads com contatos completos",
      "Consulta veicular completa",
      "Compliance Google Ads",
      "3 contas Google Ads",
      "Suporte prioritário",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "R$ 497",
    period: "/mês",
    features: [
      "15.000 pontos/mês",
      "API dedicada",
      "Contas Google Ads ilimitadas",
      "Consultoria estratégica IA",
      "Relatórios avançados",
      "Suporte 24/7",
    ],
    popular: false,
  },
  {
    name: "Unlimited",
    price: "R$ 997",
    period: "/mês",
    features: [
      "Pontos ILIMITADOS",
      "Acesso total a todos os recursos",
      "Contas Google Ads ilimitadas",
      "Consultoria estratégica IA",
      "API dedicada + Relatórios",
      "Suporte 24/7 com gerente dedicado",
    ],
    popular: false,
  },
];

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Chat IA Inteligente",
    desc: "Consultoria em tempo real com IA especialista em tráfego pago e marketing digital.",
  },
  {
    icon: Zap,
    title: "Prospecção de Leads",
    desc: "Encontre clientes ideais no mundo todo com dados de contato completos.",
  },
  {
    icon: Shield,
    title: "Compliance Google Ads",
    desc: "Análise automática de políticas do Google Ads para evitar suspensões.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Google Ads",
    desc: "Métricas, campanhas e otimizações direto no chat.",
  },
  {
    icon: Globe,
    title: "Leads Globais",
    desc: "Prospecção em qualquer país — EUA, Canadá, Europa e mais.",
  },
];

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
      } else {
        await signUp(email, password);
        toast.success("Conta criada! Verifique seu email.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">KahlChat</span>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="rounded-full text-sm"
              onClick={() => { setShowAuth(true); setIsLogin(true); }}
            >
              Entrar
            </Button>
            <Button
              className="rounded-full text-sm"
              onClick={() => { setShowAuth(true); setIsLogin(false); }}
            >
              Começar grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Sua IA de gestão de tráfego e prospecção
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            KahlChat é o assistente que domina Google Ads, encontra leads qualificados e garante que seus anúncios estejam em compliance.
          </p>
          <Button
            size="lg"
            className="rounded-full text-base px-8 h-12"
            onClick={() => { setShowAuth(true); setIsLogin(false); }}
          >
            Começar agora
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-card">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Tudo que você precisa</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-background border border-border">
                <f.icon className="w-8 h-8 mb-4 text-foreground" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6" id="pricing">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Planos e preços</h2>
          <p className="text-muted-foreground text-center mb-12">Escolha o plano ideal para o seu negócio</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border ${
                  plan.popular
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background text-foreground text-xs font-semibold px-3 py-1 rounded-full border border-border">
                    Mais popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? "text-background/60" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-background/80" : "text-foreground"}`} />
                      <span className={plan.popular ? "text-background/90" : ""}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-full ${
                    plan.popular
                      ? "bg-background text-foreground hover:bg-background/90"
                      : ""
                  }`}
                  variant={plan.popular ? "secondary" : "default"}
                  onClick={() => { setShowAuth(true); setIsLogin(false); }}
                >
                  Assinar {plan.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold">KahlChat</span>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} KahlChat. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setShowAuth(false)}>
          <div className="w-full max-w-sm p-8 rounded-2xl bg-background border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-center mb-2">KahlChat</h2>
            <p className="text-muted-foreground text-center text-sm mb-6">
              {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-full"
              />
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-full"
              />
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
              </Button>
            </form>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full text-center"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
