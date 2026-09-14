import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Relatorios() {
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  
  const { data: projetos } = trpc.projetos.list.useQuery();
  const { data: bolsistas } = trpc.bolsistas.list.useQuery();
  const { data: documentos } = trpc.documentos.list.useQuery();
  
  // Filtrar projetos, bolsistas e documentos pelo ano selecionado
  const projetosFiltrados = projetos?.filter(p => p.ano === anoSelecionado) || [];
  const bolsistasFiltrados = bolsistas?.filter(b => {
    const projeto = projetos?.find(p => p.id === b.projetoId);
    return projeto?.ano === anoSelecionado;
  }) || [];
  const documentosFiltrados = documentos?.filter(d => {
    const bolsista = bolsistas?.find(b => b.id === d.bolsistaId);
    const projeto = projetos?.find(p => p.id === bolsista?.projetoId);
    return projeto?.ano === anoSelecionado;
  }) || [];
  
  // Anos disponíveis
  const anosDisponiveis = Array.from(new Set(projetos?.map(p => p.ano) || [])).sort((a, b) => b - a);

  const exportToExcel = () => {
    if (!bolsistasFiltrados || !documentosFiltrados) {
      toast.error("Dados não carregados");
      return;
    }

    // Criar dados para o relatório
    const data = bolsistasFiltrados.map(bolsista => {
      const docsFrequencia = documentosFiltrados.filter(
        d => d.bolsistaId === bolsista.id && d.tipo === "FREQUENCIA"
      );
      const docsRelatorio = documentosFiltrados.filter(
        d => d.bolsistaId === bolsista.id && d.tipo === "RELATORIO_FINAL"
      );

      return {
        Nome: bolsista.nome,
        CPF: bolsista.cpf,
        Email: bolsista.email || "-",
        Projeto: projetosFiltrados?.find(p => p.id === bolsista.projetoId)?.nome || "-",
        "Frequências Entregues": docsFrequencia.length,
        "Frequências Aprovadas": docsFrequencia.filter(d => d.status === "APROVADO").length,
        "Relatório Final": docsRelatorio.length > 0 ? "Sim" : "Não",
        "Status Relatório": docsRelatorio[0]?.status || "-",
      };
    });

    // Converter para CSV
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(","))
    ].join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-conformidade-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success("Relatório exportado para Excel!");
  };

  const exportToPDF = async () => {
    if (!bolsistasFiltrados || !documentosFiltrados || !projetosFiltrados) {
      toast.error("Dados não carregados");
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();

      // Cabeçalho
      doc.setFontSize(18);
      doc.text("Relatório de Conformidade", 14, 20);
      doc.setFontSize(11);
      doc.text("Sistema de Gerenciamento de Bolsistas", 14, 28);
      doc.setFontSize(9);
      doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 34);

      // Estatísticas gerais
      doc.setFontSize(12);
      doc.text("Estatísticas Gerais", 14, 44);
      doc.setFontSize(9);
      doc.text(`Ano: ${anoSelecionado}`, 14, 50);
      doc.text(`Total de Bolsistas: ${bolsistasFiltrados.length}`, 14, 55);
      doc.text(`Total de Documentos: ${documentosFiltrados.length}`, 14, 60);
      doc.text(`Documentos Aprovados: ${documentosFiltrados.filter(d => d.status === "APROVADO").length}`, 14, 65);
      doc.text(`Documentos Pendentes: ${documentosFiltrados.filter(d => d.status === "PENDENTE").length}`, 14, 70);
      doc.text(`Documentos Reprovados: ${documentosFiltrados.filter(d => d.status === "REPROVADO").length}`, 14, 75);

      // Tabela de conformidade
      const tableData = bolsistasFiltrados.map(bolsista => {
        const docs = documentosFiltrados.filter(d => d.bolsistaId === bolsista.id);
        const aprovados = docs.filter(d => d.status === "APROVADO").length;
        const pendentes = docs.filter(d => d.status === "PENDENTE").length;
        const reprovados = docs.filter(d => d.status === "REPROVADO").length;
        const percentual = docs.length > 0 ? Math.round((aprovados / docs.length) * 100) : 0;

        return [
          bolsista.nome,
          bolsista.cpf,
          projetosFiltrados.find(p => p.id === bolsista.projetoId)?.nome || "-",
          docs.length.toString(),
          aprovados.toString(),
          pendentes.toString(),
          reprovados.toString(),
          `${percentual}%`,
        ];
      });

      autoTable(doc, {
        startY: 83,
        head: [["Nome", "CPF", "Projeto", "Total", "Aprovados", "Pendentes", "Reprovados", "Conformidade"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Salvar PDF
      doc.save(`relatorio-conformidade-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  // Estatísticas
  const totalBolsistas = bolsistasFiltrados?.length || 0;
  const totalDocumentos = documentosFiltrados?.length || 0;
  const documentosAprovados = documentosFiltrados?.filter(d => d.status === "APROVADO").length || 0;
  const documentosPendentes = documentosFiltrados?.filter(d => d.status === "PENDENTE").length || 0;
  const documentosReprovados = documentosFiltrados?.filter(d => d.status === "REPROVADO").length || 0;

  // Conformidade por bolsista
  const conformidade = bolsistasFiltrados?.map(bolsista => {
    const docs = documentosFiltrados?.filter(d => d.bolsistaId === bolsista.id) || [];
    const aprovados = docs.filter(d => d.status === "APROVADO").length;
    const total = docs.length;
    const percentual = total > 0 ? Math.round((aprovados / total) * 100) : 0;

    return {
      bolsista,
      total,
      aprovados,
      pendentes: docs.filter(d => d.status === "PENDENTE").length,
      reprovados: docs.filter(d => d.status === "REPROVADO").length,
      percentual,
    };
  }) || [];

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Relatórios e Estatísticas</h1>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Ano:</span>
            <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anosDisponiveis.map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocumentos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{documentosAprovados}</div>
            <p className="text-xs text-muted-foreground">
              {totalDocumentos > 0 ? Math.round((documentosAprovados / totalDocumentos) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{documentosPendentes}</div>
            <p className="text-xs text-muted-foreground">
              {totalDocumentos > 0 ? Math.round((documentosPendentes / totalDocumentos) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{documentosReprovados}</div>
            <p className="text-xs text-muted-foreground">
              {totalDocumentos > 0 ? Math.round((documentosReprovados / totalDocumentos) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Conformidade */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Conformidade por Bolsista</CardTitle>
          <CardDescription>Percentual de documentos aprovados por bolsista</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conformidade.map(({ bolsista, total, aprovados, percentual }) => (
              <div key={bolsista.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{bolsista.nome}</span>
                  <span className="text-sm text-muted-foreground">
                    {aprovados}/{total} aprovados ({percentual}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-green-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${percentual}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {conformidade.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado disponível
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada de Conformidade */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório Detalhado de Conformidade</CardTitle>
          <CardDescription>Status completo de documentos por bolsista</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bolsista</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead className="text-center">Total Docs</TableHead>
                <TableHead className="text-center">Aprovados</TableHead>
                <TableHead className="text-center">Pendentes</TableHead>
                <TableHead className="text-center">Reprovados</TableHead>
                <TableHead className="text-center">Conformidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conformidade.map(({ bolsista, total, aprovados, pendentes, reprovados, percentual }) => (
                <TableRow key={bolsista.id}>
                  <TableCell className="font-medium">{bolsista.nome}</TableCell>
                  <TableCell>{bolsista.cpf}</TableCell>
                  <TableCell>
                    {projetos?.find(p => p.id === bolsista.projetoId)?.nome || "-"}
                  </TableCell>
                  <TableCell className="text-center">{total}</TableCell>
                  <TableCell className="text-center text-green-600">{aprovados}</TableCell>
                  <TableCell className="text-center text-yellow-600">{pendentes}</TableCell>
                  <TableCell className="text-center text-red-600">{reprovados}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={percentual === 100 ? "default" : percentual >= 50 ? "secondary" : "destructive"}>
                      {percentual}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {conformidade.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum bolsista cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

