import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="KahlChat" className="h-10 object-contain" />
        </div>

        <div className="p-8 rounded-2xl bg-card border border-border shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-1">
            {isLogin ? "Entrar" : "Criar conta"}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            {isLogin ? "Acesse sua conta KahlChat" : "Comece a usar o KahlChat"}
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

        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <a
            href="https://kahlchat.com/politicas-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline"
          >
            Políticas de Privacidade
          </a>
          <span>•</span>
          <a
            href="https://kahlchat.com/termos-de-uso"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline"
          >
            Termos de Uso
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
