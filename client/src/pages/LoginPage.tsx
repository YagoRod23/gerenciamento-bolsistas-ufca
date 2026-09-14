import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { getLoginUrl } from "@/const";

interface LoginPageProps {
  returnTo?: string;
}

/**
 * Página de login com design similar ao Manus
 * - Layout limpo e minimalista
 * - Card centralizado
 * - Opções de login social (Facebook, Google, Microsoft, Apple)
 * - Opção de email/senha
 * - Identidade visual UFCA (cores marrom/amarelo)
 */
export default function LoginPage({ returnTo = "/dashboard" }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const loginUrl = getLoginUrl();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Digite seu email");
      return;
    }

    setLoading(true);
    try {
      // Redirecionar para Manus OAuth
      window.location.href = loginUrl;
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    // Redirecionar para Manus OAuth
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-sm">
        {/* Card Principal */}
        <Card className="border-primary/10 shadow-2xl">
          <CardHeader className="space-y-6 pt-8">
            {/* Logo/Título */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-xl font-bold text-primary-foreground">UFCA</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Sign in to Sistema de Gerenciamento de Bolsistas
                </h1>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* Opções de Login Social */}
            <div className="space-y-3">
              {/* Facebook */}
              <Button
                onClick={() => handleOAuthLogin("facebook")}
                disabled={loading}
                variant="outline"
                className="w-full justify-start gap-3 h-11 border-border hover:bg-accent/5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="flex-1 text-center">Continue with Facebook</span>
              </Button>

              {/* Google */}
              <Button
                onClick={() => handleOAuthLogin("google")}
                disabled={loading}
                variant="outline"
                className="w-full justify-start gap-3 h-11 border-border hover:bg-accent/5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="flex-1 text-center">Continue with Google</span>
              </Button>

              {/* Microsoft */}
              <Button
                onClick={() => handleOAuthLogin("microsoft")}
                disabled={loading}
                variant="outline"
                className="w-full justify-start gap-3 h-11 border-border hover:bg-accent/5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                </svg>
                <span className="flex-1 text-center">Continue with Microsoft</span>
              </Button>

              {/* Apple */}
              <Button
                onClick={() => handleOAuthLogin("apple")}
                disabled={loading}
                variant="outline"
                className="w-full justify-start gap-3 h-11 border-border hover:bg-accent/5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 13.5c-.91 2.18-.39 4.18 1.64 6.29.48.51.84 1.01.84 1.43 0 .41-.41.82-.82.82-1.31 0-2.21-.96-3.42-2.09-.99.20-2.16.32-3.29.32-1.13 0-2.3-.12-3.29-.32C7.38 21.35 6.48 22.31 5.17 22.31c-.41 0-.82-.41-.82-.82 0-.42.36-.92.84-1.43 2.03-2.11 2.55-4.11 1.64-6.29-.78-1.63-2.58-2.86-2.58-2.86 0 0 1.02-.51 2.31-1.16C7.79 8.69 9.40 8.5 12 8.5s4.21.19 5.44.78c1.29.65 2.31 1.16 2.31 1.16s-1.80 1.23-2.58 2.86z" />
                </svg>
                <span className="flex-1 text-center">Continue with Apple</span>
              </Button>
            </div>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Email Input */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 border-border focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-foreground hover:bg-foreground/90 text-background font-medium"
              >
                {loading ? "Entrando..." : "Continue"}
              </Button>
            </form>

            {/* Footer */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Powered by Manus
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Links de Rodapé */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground transition">Terms of service</a>
          <a href="#" className="hover:text-foreground transition">Privacy policy</a>
        </div>
      </div>
    </div>
  );
}
