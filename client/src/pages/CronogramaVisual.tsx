import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Download, Printer } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getLoginUrl } from "@/const";

const diasSemana = [
  { chave: "segunda", label: "Segunda-feira" },
  { chave: "terca", label: "Terça-feira" },
  { chave: "quarta", label: "Quarta-feira" },
  { chave: "quinta", label: "Quinta-feira" },
  { chave: "sexta", label: "Sexta-feira" },
  { chave: "sabado", label: "Sábado" },
  { chave: "domingo", label: "Domingo" },
];

interface CronogramaItem {
  bolsista: string;
  local: string;
  horaInicio: string;
  horaFim: string;
}

export default function CronogramaVisual() {
  const { data: bolsistas } = trpc.bolsistas.list.useQuery();
  const { data: projetos } = trpc.projetos.list.useQuery();
  const { data: horarios } = trpc.horarios.getAll.useQuery();
  const [selectedProjeto, setSelectedProjeto] = useState<string>("0");
  const [selectedDia, setSelectedDia] = useState<string>("segunda");
  const tableRef = useRef<HTMLDivElement>(null);

  // Filtrar bolsistas por projeto
  const bolsistasFiltrados = selectedProjeto === "0" 
    ? bolsistas || []
    : (bolsistas || []).filter(b => b.projetoId?.toString() === selectedProjeto);

  // Construir cronograma do dia selecionado
  const cronogramaDia: CronogramaItem[] = [];
  
  if (horarios && bolsistasFiltrados.length > 0) {
    // Agrupar horários por hora
    const horariosMap = new Map<string, CronogramaItem[]>();
    
    horarios.forEach((horario: any) => {
      const bolsista = bolsistasFiltrados.find((b: any) => b.id === horario.bolsistaId);
      if (bolsista && horario.diaSemana === selectedDia) {
        const chaveHora = `${horario.horaInicio}-${horario.horaFim}`;
        if (!horariosMap.has(chaveHora)) {
          horariosMap.set(chaveHora, []);
        }
        horariosMap.get(chaveHora)!.push({
          bolsista: bolsista.nome,
          local: horario.local || "-",
          horaInicio: horario.horaInicio,
          horaFim: horario.horaFim,
        });
      }
    });

    // Converter map para array e ordenar por hora
    horariosMap.forEach((items) => {
      cronogramaDia.push(...items);
    });
    cronogramaDia.sort((a, b) => (a.horaInicio || "").localeCompare(b.horaInicio || ""));
  }

  // Construir cronograma semanal completo
  const cronogramaSemanal: { [dia: string]: CronogramaItem[] } = {};
  diasSemana.forEach(dia => {
    cronogramaSemanal[dia.chave] = [];
    
    if (horarios && bolsistasFiltrados.length > 0) {
      horarios.forEach((horario: any) => {
        const bolsista = bolsistasFiltrados.find((b: any) => b.id === horario.bolsistaId);
        if (bolsista && horario.diaSemana === dia.chave) {
          cronogramaSemanal[dia.chave].push({
            bolsista: bolsista.nome,
            local: horario.local || "-",
            horaInicio: horario.horaInicio,
            horaFim: horario.horaFim,
          });
        }
      });
      
      // Ordenar por hora
      cronogramaSemanal[dia.chave].sort((a, b) => 
        (a.horaInicio || "").localeCompare(b.horaInicio || "")
      );
    }
  });

  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Título
      doc.setFontSize(16);
      doc.text("Cronograma Semanal de Bolsistas", pageWidth / 2, 15, { align: "center" });

      // Informações
      doc.setFontSize(10);
      const projetoNome = selectedProjeto === "0" 
        ? "Todos os Projetos" 
        : projetos?.find(p => p.id.toString() === selectedProjeto)?.nome || "Projeto não encontrado";
      doc.text(`Projeto: ${projetoNome}`, 14, 25);
      doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 31);

      // Tabela semanal
      const tableData: any[] = [];
      const horarios_unicos = new Set<string>();

      // Coletar todos os horários únicos
      Object.values(cronogramaSemanal).forEach(dia => {
        dia.forEach(item => {
          horarios_unicos.add(`${item.horaInicio}-${item.horaFim}`);
        });
      });

      const horariosOrdenados = Array.from(horarios_unicos).sort();

      // Montar cabeçalho
      const cabecalho = ["Horário", ...diasSemana.map(d => d.label)];
      tableData.push(cabecalho);

      // Montar linhas
      horariosOrdenados.forEach(horario => {
        const [inicio, fim] = horario.split("-");
        const linha = [`${inicio} - ${fim}`];

        diasSemana.forEach(dia => {
          const bolsistasNoDia = cronogramaSemanal[dia.chave]
            .filter(item => item.horaInicio === inicio && item.horaFim === fim)
            .map(item => `${item.bolsista}${item.local !== "-" ? ` (${item.local})` : ""}`)
            .join("\n");
          
          linha.push(bolsistasNoDia || "-");
        });

        tableData.push(linha);
      });

      // Adicionar tabela ao PDF
      (doc as any).autoTable({
        head: [tableData[0]],
        body: tableData.slice(1),
        startY: 40,
        margin: { left: 10, right: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [83, 43, 29], textColor: [255, 255, 255] }, // Marrom UFCA
        alternateRowStyles: { fillColor: [245, 190, 86, 0.1] }, // Amarelo UFCA suave
      });

      // Rodapé
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      doc.setFontSize(8);
      doc.text("Sistema de Gerenciamento de Bolsistas - UFCA", pageWidth / 2, pageHeight - 10, { align: "center" });

      doc.save(`cronograma-bolsistas-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar PDF");
    }
  };

  const handleImprimirDia = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    const diaLabel = diasSemana.find(d => d.chave === selectedDia)?.label || selectedDia;
    const projetoNome = selectedProjeto === "0" 
      ? "Todos os Projetos" 
      : projetos?.find(p => p.id.toString() === selectedProjeto)?.nome || "Projeto não encontrado";

    let html = `
      <html>
        <head>
          <title>Cronograma - ${diaLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #532B1D; text-align: center; }
            .info { margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #532B1D; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Cronograma - ${diaLabel}</h1>
          <div class="info">
            <p><strong>Projeto:</strong> ${projetoNome}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Bolsista</th>
                <th>Horário</th>
                <th>Local</th>
              </tr>
            </thead>
            <tbody>
    `;

    cronogramaDia.forEach(item => {
      html += `
        <tr>
          <td>${item.bolsista}</td>
          <td>${item.horaInicio} - ${item.horaFim}</td>
          <td>${item.local}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
            Sistema de Gerenciamento de Bolsistas - UFCA
          </p>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Público */}
      <div className="sticky top-0 z-40 bg-[#532B1D] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#F5BE56] text-[#532B1D] px-3 py-1 rounded font-bold">UFCA</div>
            <h1 className="text-xl font-bold">UFCA · Bolsistas</h1>
          </div>
          <a
            href={getLoginUrl()}
            className="bg-[#F5BE56] text-[#532B1D] px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition"
          >
            Admin
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8 text-[#532B1D]">Cronograma Visual de Bolsistas</h2>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projeto">Projeto</Label>
                <Select value={selectedProjeto} onValueChange={setSelectedProjeto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Todos os Projetos</SelectItem>
                    {projetos?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dia">Dia da Semana</Label>
                <Select value={selectedDia} onValueChange={setSelectedDia}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map(dia => (
                      <SelectItem key={dia.chave} value={dia.chave}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={handleImprimirDia}
                className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
              >
                <Printer size={18} />
                Imprimir Dia
              </button>

              <button
                onClick={handleExportarPDF}
                className="w-full flex items-center justify-center gap-2 bg-[#532B1D] text-white py-2 rounded hover:bg-[#3d1f14]"
              >
                <Download size={18} />
                Exportar Semanal (PDF)
              </button>
            </CardContent>
          </Card>

          {/* Cronograma do Dia */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Cronograma - {diasSemana.find(d => d.chave === selectedDia)?.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {cronogramaDia.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="text-left p-2">Bolsista</th>
                        <th className="text-left p-2">Local</th>
                        <th className="text-left p-2">Horário</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cronogramaDia.map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-2">{item.bolsista}</td>
                          <td className="p-2">{item.local}</td>
                          <td className="p-2 font-semibold">{item.horaInicio} - {item.horaFim}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum bolsista agendado para este dia</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cronograma Semanal Completo */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Cronograma Semanal Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={tableRef} className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#532B1D] text-white">
                    <th className="border p-2 text-left">Horário</th>
                    {diasSemana.map(dia => (
                      <th key={dia.chave} className="border p-2 text-left">{dia.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(
                    new Set(
                      Object.values(cronogramaSemanal)
                        .flat()
                        .map(item => `${item.horaInicio}-${item.horaFim}`)
                    )
                  )
                    .sort()
                    .map(horario => {
                      const [inicio, fim] = horario.split("-");
                      return (
                        <tr key={horario} className="border">
                          <td className="border p-2 font-semibold bg-gray-50">{inicio} - {fim}</td>
                          {diasSemana.map(dia => {
                            const bolsistasNoDia = cronogramaSemanal[dia.chave]
                              .filter(item => item.horaInicio === inicio && item.horaFim === fim)
                              .map((item, idx) => (
                                <div key={idx} className="text-xs">
                                  {item.bolsista}
                                  {item.local !== "-" && ` (${item.local})`}
                                </div>
                              ));
                            
                            return (
                              <td key={dia.chave} className="border p-2 bg-white">
                                {bolsistasNoDia.length > 0 ? bolsistasNoDia : "-"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
