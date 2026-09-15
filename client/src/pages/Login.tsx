import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function Login() {
  const [, setLocation] = useLocation();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const utils = trpc.useUtils();
  const loginMutation = trpc.coordenadores.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario.trim() || !senha.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      await loginMutation.mutateAsync({ usuario, senha });

      // O login já cria o cookie de sessão httpOnly no server;
      // só precisamos revalidar o auth.me para refletir o novo estado.
      await utils.auth.me.invalidate();

      toast.success("Login realizado com sucesso!");
      setLocation("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          {APP_LOGO && (
            <div className="flex justify-center">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12" />
            </div>
          )}
          <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
          <CardDescription>
            Sistema de Gerenciamento de Bolsistas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="usuario" className="text-sm font-medium">
                Usuário
              </label>
              <Input
                id="usuario"
                type="text"
                placeholder="Digite seu usuário"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>Contate o administrador para criar sua conta</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

