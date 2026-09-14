import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { BarChart3, Users, FileText, DollarSign, FolderOpen, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { data: projetos } = trpc.projetos.list.useQuery();
  const { data: bolsistas } = trpc.bolsistas.list.useQuery();
  const { data: documentos } = trpc.documentos.list.useQuery();

  // Filtrar dados por ano
  const projetosFiltrados = projetos?.filter(p => p.ano === selectedYear) || [];
  const bolsistasFiltrados = bolsistas?.filter(b => {
    const projeto = projetos?.find(p => p.id === b.projetoId);
    return projeto?.ano === selectedYear;
  }) || [];
  const documentosFiltrados = documentos?.filter(d => {
    const bolsista = bolsistas?.find(b => b.id === d.bolsistaId);
    const projeto = projetos?.find(p => p.id === bolsista?.projetoId);
    return projeto?.ano === selectedYear;
  }) || [];

  // Dados para gráfico de documentos por status
  const docsPorStatus = [
    { name: 'Pendentes', value: documentosFiltrados.filter(d => d.status === 'PENDENTE').length, color: '#f59e0b' },
    { name: 'Aprovados', value: documentosFiltrados.filter(d => d.status === 'APROVADO').length, color: '#10b981' },
    { name: 'Reprovados', value: documentosFiltrados.filter(d => d.status === 'REPROVADO').length, color: '#ef4444' },
  ];

  // Dados para gráfico de bolsistas por projeto
  const bolsistasPorProjeto = projetosFiltrados.map(projeto => ({
    name: projeto.nome.length > 20 ? projeto.nome.substring(0, 20) + '...' : projeto.nome,
    bolsistas: bolsistasFiltrados.filter(b => b.projetoId === projeto.id).length,
  }));

  // Dados para gráfico de carga horária por projeto (horas trabalhadas)
  const cargaHorariaPorProjeto = projetosFiltrados.map(projeto => {
    // Buscar todos os bolsistas do projeto
    const bolsistasProj = bolsistasFiltrados.filter(b => b.projetoId === projeto.id);
    // Somar carga horária de todas as frequências aprovadas dos bolsistas
    const horasTrabalhadas = bolsistasProj.reduce((total, bolsista) => {
      const docsAprovados = documentos?.filter(
        d => d.bolsistaId === bolsista.id && 
             d.tipo === 'FREQUENCIA' && 
             d.status === 'APROVADO'
      ) || [];
      const horasBolsista = docsAprovados.reduce((sum, doc) => sum + (doc.cargaHorariaTotal || 0), 0);
      return total + horasBolsista;
    }, 0);
    
    return {
      name: projeto.nome.length > 15 ? projeto.nome.substring(0, 15) + '...' : projeto.nome,
      horas: horasTrabalhadas,
    };
  });

  // Dados para gráfico de evolução mensal (últimos 6 meses)
  const mesesPassados = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { mes: d.getMonth() + 1, ano: d.getFullYear(), nome: d.toLocaleDateString('pt-BR', { month: 'short' }) };
  });

  const evolucaoMensal = mesesPassados.map(m => ({
    mes: m.nome,
    documentos: documentos?.filter(d => {
      const data = new Date(d.createdAt);
      return data.getMonth() + 1 === m.mes && data.getFullYear() === m.ano;
    }).length || 0,
  }));

  // Cores para gráficos
  const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Estatísticas do ano selecionado
  const statsAno = {
    totalProjetos: projetosFiltrados.length,
    totalBolsistas: bolsistasFiltrados.length,
    docsPendentes: documentosFiltrados.filter(d => d.status === 'PENDENTE').length,
    docsAprovados: documentosFiltrados.filter(d => d.status === 'APROVADO').length,
    taxaAprovacao: documentosFiltrados.length > 0 
      ? Math.round((documentosFiltrados.filter(d => d.status === 'APROVADO').length / documentosFiltrados.length) * 100)
      : 0,
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard - Sistema de Gerenciamento de Bolsistas</h1>
        <div className="flex items-center gap-2">
          <Label>Ano:</Label>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map(ano => (
                <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsAno.totalProjetos}</div>
            <p className="text-xs text-muted-foreground">Projetos cadastrados em {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Bolsistas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsAno.totalBolsistas}</div>
            <p className="text-xs text-muted-foreground">Bolsistas ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsAno.docsPendentes}</div>
            <p className="text-xs text-muted-foreground">Aguardando validação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsAno.taxaAprovacao}%</div>
            <p className="text-xs text-muted-foreground">{statsAno.docsAprovados} documentos aprovados</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Gráfico de Documentos por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={docsPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {docsPorStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Bolsistas por Projeto */}
        <Card>
          <CardHeader>
            <CardTitle>Bolsistas por Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bolsistasPorProjeto}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bolsistas" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Documentos (Últimos 6 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="documentos" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Carga Horária por Projeto */}
        <Card>
          <CardHeader>
            <CardTitle>Carga Horária por Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cargaHorariaPorProjeto}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="horas" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <p className="text-sm text-muted-foreground">Acesse as principais funcionalidades</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/projetos">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <FolderOpen className="h-5 w-5" />
                <div>
                  <div className="font-medium">Gerenciar Projetos</div>
                  <div className="text-sm text-muted-foreground">Cadastrar e editar projetos</div>
                </div>
              </div>
            </Link>

            <Link href="/bolsistas">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <Users className="h-5 w-5" />
                <div>
                  <div className="font-medium">Gerenciar Bolsistas</div>
                  <div className="text-sm text-muted-foreground">Cadastrar e editar bolsistas</div>
                </div>
              </div>
            </Link>

            <Link href="/documentos">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <FileText className="h-5 w-5" />
                <div>
                  <div className="font-medium">Validar Documentos</div>
                  <div className="text-sm text-muted-foreground">Aprovar ou reprovar documentos</div>
                </div>
              </div>
            </Link>

            <Link href="/pagamentos">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <DollarSign className="h-5 w-5" />
                <div>
                  <div className="font-medium">Controle de Pagamentos</div>
                  <div className="text-sm text-muted-foreground">Gerenciar solicitações de pagamento</div>
                </div>
              </div>
            </Link>

            <Link href="/relatorios">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <BarChart3 className="h-5 w-5" />
                <div>
                  <div className="font-medium">Relatórios e Estatísticas</div>
                  <div className="text-sm text-muted-foreground">Visualizar gráficos e exportar dados</div>
                </div>
              </div>
            </Link>

            <Link href="/cronograma">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <Calendar className="h-5 w-5" />
                <div>
                  <div className="font-medium">Cronograma Visual</div>
                  <div className="text-sm text-muted-foreground">Visualizar e exportar cronograma</div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <p className="text-sm text-muted-foreground">Itens que precisam de atenção</p>
          </CardHeader>
          <CardContent>
            {statsAno.docsPendentes > 0 ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-900 dark:text-yellow-100">
                    {statsAno.docsPendentes} documento{statsAno.docsPendentes > 1 ? 's' : ''} pendente{statsAno.docsPendentes > 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Há documentos aguardando validação
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <div className="font-medium text-green-900 dark:text-green-100">Tudo em dia!</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Nenhuma pendência no momento</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

