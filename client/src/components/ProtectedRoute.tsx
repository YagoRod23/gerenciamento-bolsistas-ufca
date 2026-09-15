import { useAuth } from "@/_core/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";
import Login from "@/pages/Login";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege rotas administrativas com autenticação obrigatória.
 *
 * Comportamento:
 * - Se loading === true: exibe skeleton
 * - Se !isAuthenticated: exibe tela de login
 * - Caso contrário: renderiza o conteúdo protegido
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  // Enquanto carrega, exibe skeleton
  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Se não está autenticado, exibe tela de login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Se está autenticado, renderiza o conteúdo
  return <>{children}</>;
}
