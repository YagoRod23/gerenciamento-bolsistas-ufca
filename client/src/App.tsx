import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Projetos from "./pages/Projetos";
import Bolsistas from "./pages/Bolsistas";
import Documentos from "./pages/Documentos";
import Pagamentos from "./pages/Pagamentos";
import Relatorios from "./pages/Relatorios";
import Horarios from "./pages/Horarios";
import RelatorioOcupacao from "./pages/RelatorioOcupacao";
import CronogramaVisual from "./pages/CronogramaVisual";
import LoginPage from "./pages/LoginPage";
import GerenciadorCoordenadores from "./pages/GerenciadorCoordenadores";
import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      {/* Rota de login */}
      <Route path="/login" component={() => <LoginPage />} />

      {/* Rota inicial: Cronograma pública (sem autenticação) */}
      <Route path="/" component={CronogramaVisual} />
      <Route path="/cronograma" component={CronogramaVisual} />

      {/* Rotas protegidas (com autenticação obrigatória) */}
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/projetos">
        {() => (
          <ProtectedRoute>
            <Projetos />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/bolsistas">
        {() => (
          <ProtectedRoute>
            <Bolsistas />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/documentos">
        {() => (
          <ProtectedRoute>
            <Documentos />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/pagamentos">
        {() => (
          <ProtectedRoute>
            <Pagamentos />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/relatorios">
        {() => (
          <ProtectedRoute>
            <Relatorios />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/horarios">
        {() => (
          <ProtectedRoute>
            <Horarios />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/relatorio-ocupacao">
        {() => (
          <ProtectedRoute>
            <RelatorioOcupacao />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/coordenadores">
        {() => (
          <ProtectedRoute>
            <GerenciadorCoordenadores />
          </ProtectedRoute>
        )}
      </Route>

      {/* Rotas de fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
