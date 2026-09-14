import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import jsPDF from "jspdf";
import "jspdf-autotable";

const COLORS = ["#532B1D", "#F5BE56", "#8B4513", "#CD853F", "#D2691E", "#A0522D", "#6B4423"];

const diasSemana = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
];

const diasSemanaLabel: Record<string, string> = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
  domingo: "Domingo",
};

export default function RelatorioOcupacao() {
  const { data: ocupacao = {}, isLoading } = trpc.horarios.ocupacao.useQuery();

  // Processar dados para gráficos
  const locaisList = Object.keys(ocupacao);
  
  // Dados para gráfico de barras (ocupação por local)
  const ocupacaoData = locaisList.map((local) => {
    const horarios = (ocupacao as any)[local] || [];
    const totalBolsistas = horarios.reduce((sum: number, h: any) => sum + h.bolsistas, 0);
    return {
      local: local || "Não especificado",
      bolsistas: totalBolsistas,
    };
  });

  // Dados para gráfico de pizza (distribuição por local)
  const distribuicaoData = ocupacaoData.filter(d => d.bolsistas > 0);

  // Dados para tabela detalhada
  const tabelaData: Array<{
    local: string;
    dia: string;
    horaInicio: string;
    horaFim: string;
    bolsistas: number;
  }> = [];

  locaisList.forEach((local) => {
    const horarios = (ocupacao as any)[local] || [];
    horarios.forEach((h: any) => {
      tabelaData.push({
        local: local || "Não especificado",
        dia: diasSemanaLabel[h.dia] || h.dia,
        horaInicio: h.horaInicio,
        horaFim: h.horaFim,
        bolsistas: h.bolsistas,
      });
    });
  });

  // Ordenar tabela por local e dia
  tabelaData.sort((a, b) => {
    if (a.local !== b.local) return a.local.localeCompare(b.local);
    return diasSemana.indexOf(a.dia.toLowerCase()) - diasSemana.indexOf(b.dia.toLowerCase());
  });

  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Título
      doc.setFontSize(16);
      doc.text("Relatório de Ocupação de Locais", pageWidth / 2, 15, { align: "center" });

      // Data
      doc.setFontSize(10);
      doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 25);

      // Tabela de ocupação
      const tableData: any[] = [
        ["Local", "Dia", "Horário", "Bolsistas"],
      ];

      tabelaData.forEach((row) => {
        tableData.push([
          row.local,
          row.dia,
          `${row.horaInicio} - ${row.horaFim}`,
          row.bolsistas.toString(),
        ]);
      });

      (doc as any).autoTable({
        head: [tableData[0]],
        body: tableData.slice(1),
        startY: 35,
        margin: { left: 10, right: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [83, 43, 29], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 190, 86, 0.1] },
      });

      // Resumo por local
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      doc.setFontSize(12);
      doc.text("Resumo por Local", 14, finalY + 15);

      const resumoData: any[] = [["Local", "Total de Bolsistas"]];
      ocupacaoData.forEach((row) => {
        resumoData.push([row.local, row.bolsistas.toString()]);
      });

      (doc as any).autoTable({
        head: [resumoData[0]],
        body: resumoData.slice(1),
        startY: finalY + 20,
        margin: { left: 10, right: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [83, 43, 29], textColor: [255, 255, 255] },
      });

      // Rodapé
      const finalY2 = (doc as any).lastAutoTable.finalY || 200;
      doc.setFontSize(8);
      doc.text("Sistema de Gerenciamento de Bolsistas - UFCA", pageWidth / 2, pageHeight - 10, { align: "center" });

      doc.save(`relatorio-ocupacao-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost">← Voltar ao Dashboard</Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <BarChart3 className="w-8 h-8" />
        Relatório de Ocupação de Locais
      </h1>

      {locaisList.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhum horário cadastrado. Cadastre horários para visualizar o relatório.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Botão de Exportação */}
          <div className="mb-6">
            <Button onClick={handleExportarPDF} className="bg-[#532B1D] hover:bg-[#3d1f14]">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico de Barras */}
            <Card>
              <CardHeader>
                <CardTitle>Ocupação por Local</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ocupacaoData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="local" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bolsistas" fill="#532B1D" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Bolsistas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribuicaoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ local, bolsistas }) => `${local}: ${bolsistas}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="bolsistas"
                    >
                      {distribuicaoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="text-left p-3">Local</th>
                      <th className="text-left p-3">Dia</th>
                      <th className="text-left p-3">Horário</th>
                      <th className="text-center p-3">Bolsistas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabelaData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{row.local}</td>
                        <td className="p-3">{row.dia}</td>
                        <td className="p-3">
                          {row.horaInicio} - {row.horaFim}
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-[#F5BE56] text-[#532B1D] px-3 py-1 rounded-full font-semibold">
                            {row.bolsistas}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Resumo por Local */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resumo por Local</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ocupacaoData.map((row, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p className="text-lg font-semibold">{row.local}</p>
                    <p className="text-2xl font-bold text-[#532B1D] mt-2">
                      {row.bolsistas}
                    </p>
                    <p className="text-xs text-muted-foreground">bolsistas</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
