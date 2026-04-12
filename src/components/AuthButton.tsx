import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogIn, X } from "lucide-react";

export interface AuthButtonHandle {
  openSignUp: () => void;
}

const AuthButton = forwardRef<AuthButtonHandle>((_, ref) => {
  const { user, signIn, signUp } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    openSignUp: () => {
      setIsLogin(false);
      setOpen(true);
    },
  }));

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
        setOpen(false);
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
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Entrar
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {isLogin ? "Entrar" : "Criar conta"}
              </h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-muted-foreground text-xs mb-4">
              {isLogin ? "Acesse sua conta KahlChat" : "Comece a usar o KahlChat"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground text-sm"
              />
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
              </button>
            </form>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground w-full text-center"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
            </button>

            <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
              <a href="https://kahlchat.com/politicas-de-privacidade" target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">
                Políticas de Privacidade
              </a>
              <span>•</span>
              <a href="https://kahlchat.com/termos-de-uso" target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">
                Termos de Uso
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

AuthButton.displayName = "AuthButton";

export default AuthButton;
