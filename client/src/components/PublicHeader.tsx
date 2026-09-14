import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

/**
 * Header público para a página de cronograma
 * - Logo/nome do sistema à esquerda: "UFCA · Bolsistas"
 * - Botão "Área Administrativa" à direita que redireciona para o login
 * - Identidade visual UFCA: cor primária marrom #532B1D, destaque amarelo #F5BE56
 */
export default function PublicHeader() {
  const loginUrl = getLoginUrl();

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="container py-4 flex items-center justify-between">
        {/* Logo/Nome à esquerda */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-accent-foreground">UFCA</span>
          </div>
          <h1 className="text-xl font-bold">
            UFCA <span className="text-accent">·</span> Bolsistas
          </h1>
        </div>

        {/* Botão "Área Administrativa" à direita */}
        <Button
          onClick={() => window.location.href = loginUrl}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
        >
          Área Administrativa
        </Button>
      </div>
    </header>
  );
}
