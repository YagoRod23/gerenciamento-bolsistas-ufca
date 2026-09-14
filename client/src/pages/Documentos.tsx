import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";

export default function Documentos() {
  const { data: documentos, refetch } = trpc.documentos.list.useQuery();
  const { data: bolsistas } = trpc.bolsistas.list.useQuery();
  const { data: projetos } = trpc.projetos.list.useQuery();
  const createMutation = trpc.documentos.create.useMutation();
  const updateMutation = trpc.documentos.update.useMutation();
  const uploadMutation = trpc.upload.uploadDocumento.useMutation();
  const analisarIAMutation = trpc.documentos.analisarComIA.useMutation();
  const deleteMutation = trpc.documentos.delete.useMutation();

  const [formData, setFormData] = useState({
    bolsistaId: "",
    tipo: "",
    mesAno: "",
    cargaHorariaTotal: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [justificativa, setJustificativa] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [resultadoAnalise, setResultadoAnalise] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Apenas arquivos PDF são permitidos");
        return;
      }
      if (file.size > 16 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máximo 16MB)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let caminhoArquivo = null;

      // Se houver arquivo, fazer upload
      if (selectedFile) {
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(selectedFile);
        });

        const uploadResult = await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          fileData,
          mimeType: selectedFile.type,
        });

        caminhoArquivo = uploadResult.url;
      }

      // Criar documento no banco
      await createMutation.mutateAsync({
        bolsistaId: parseInt(formData.bolsistaId),
        tipo: formData.tipo,
        mesAno: formData.mesAno,
        cargaHorariaTotal: formData.cargaHorariaTotal ? parseInt(formData.cargaHorariaTotal) : null,
        caminhoArquivo,
        status: "PENDENTE",
      });

      toast.success("Documento cadastrado com sucesso!");
      setFormData({ bolsistaId: "", tipo: "", mesAno: "", cargaHorariaTotal: "" });
      setSelectedFile(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao cadastrar documento");
    } finally {
      setUploading(false);
    }
  };

  const handleAprovar = async (id: number) => {
    try {
      await updateMutation.mutateAsync({
        id,
        statusDocumento: "APROVADO",
        justificativa: justificativa || "Documento aprovado",
      });
      toast.success("Documento aprovado!");
      setSelectedDoc(null);
      setJustificativa("");
      refetch();
    } catch (error) {
      toast.error("Erro ao aprovar documento");
    }
  };

  const handleReprovar = async (id: number) => {
    if (!justificativa.trim()) {
      toast.error("Informe uma justificativa para reprovar");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id,
        statusDocumento: "REPROVADO",
        justificativa,
      });
      toast.success("Documento reprovado");
      setSelectedDoc(null);
      setJustificativa("");
      refetch();
    } catch (error) {
      toast.error("Erro ao reprovar documento");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir este documento?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("🗑️ Documento excluído com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir documento");
    }
  };

  const handleAnalisarIA = async (documentoId: number) => {
    setAnalisando(true);
    setResultadoAnalise(null);
    toast.info("🤖 Analisando documento com IA... Isso pode levar alguns segundos.");
    
    try {
      // Buscar documento para pegar o bolsista
      const doc = documentos?.find(d => d.id === documentoId);
      if (!doc) throw new Error("Documento não encontrado");
      
      // Buscar bolsista para pegar o projeto
      const bolsista = bolsistas?.find(b => b.id === doc.bolsistaId);
      const projeto = bolsista?.projetoId ? projetos?.find(p => p.id === bolsista.projetoId) : null;
      const projetoNome = projeto?.nome || "Projeto desconhecido";
      
      const resultado = await analisarIAMutation.mutateAsync({ 
        documentoId, 
        projetoNome 
      });
      setResultadoAnalise(resultado);
      toast.success("✅ Análise concluída!");
    } catch (error: any) {
      toast.error(`Erro na análise: ${error.message || "Erro desconhecido"}`);
    } finally {
      setAnalisando(false);
    }
  };

  const getBolsistaNome = (bolsistaId: number) => {
    return bolsistas?.find(b => b.id === bolsistaId)?.nome || "Bolsista não encontrado";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      PENDENTE: "secondary",
      APROVADO: "default",
      REPROVADO: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const documentosPendentes = documentos?.filter(d => d.status === "PENDENTE") || [];
  const documentosProcessados = documentos?.filter(d => d.status !== "PENDENTE") || [];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Gerenciamento de Documentos</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário de Cadastro */}
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="bolsista">Bolsista *</Label>
                <Select value={formData.bolsistaId} onValueChange={(value) => setFormData({ ...formData, bolsistaId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um bolsista" />
                  </SelectTrigger>
                  <SelectContent>
                    {bolsistas?.map((bolsista) => (
                      <SelectItem key={bolsista.id} value={bolsista.id.toString()}>
                        {bolsista.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipo">Tipo de Documento *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREQUENCIA">Frequência</SelectItem>
                    <SelectItem value="RELATORIO_FINAL">Relatório Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mesAno">Mês/Ano *</Label>
                <Input
                  id="mesAno"
                  value={formData.mesAno}
                  onChange={(e) => setFormData({ ...formData, mesAno: e.target.value })}
                  placeholder="Ex: 01/2024"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cargaHoraria">Carga Horária Total (horas)</Label>
                <Input
                  id="cargaHoraria"
                  type="number"
                  value={formData.cargaHorariaTotal}
                  onChange={(e) => setFormData({ ...formData, cargaHorariaTotal: e.target.value })}
                  placeholder="Ex: 80"
                />
              </div>

              <div>
                <Label htmlFor="arquivo">Upload de Arquivo PDF (opcional)</Label>
                <div className="mt-2">
                  <Input
                    id="arquivo"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Enviando..." : "Cadastrar Documento"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Documentos Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos Pendentes ({documentosPendentes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {documentosPendentes.map((doc) => (
                <div key={doc.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{getBolsistaNome(doc.bolsistaId)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.tipo} - {doc.mesAno}
                      </p>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>

                  {doc.cargaHorariaTotal && (
                    <p className="text-sm mb-2">Carga horária: {doc.cargaHorariaTotal}h</p>
                  )}

                  {doc.caminhoArquivo && (
                    <a
                      href={doc.caminhoArquivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-3"
                    >
                      <Upload className="h-3 w-3" />
                      Ver arquivo PDF
                    </a>
                  )}

                  {selectedDoc?.id === doc.id ? (
                    <div className="space-y-3 mt-3">
                      <div>
                        <Label>Justificativa (opcional para aprovar)</Label>
                        <Textarea
                          value={justificativa}
                          onChange={(e) => setJustificativa(e.target.value)}
                          placeholder="Digite a justificativa..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAprovar(doc.id)}
                          className="flex-1"
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReprovar(doc.id)}
                          className="flex-1"
                        >
                          Reprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDoc(null);
                            setJustificativa("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDoc(doc)}
                        className="flex-1"
                      >
                        Validar Documento
                      </Button>
                      {doc.caminhoArquivo && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAnalisarIA(doc.id)}
                          className="flex-1"
                        >
                          🤖 Analisar com IA
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {documentosPendentes.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum documento pendente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documentos Processados */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos Processados ({documentosProcessados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {documentosProcessados.map((doc) => (
                <div key={doc.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{getBolsistaNome(doc.bolsistaId)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.tipo} - {doc.mesAno}
                      </p>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                  {doc.cargaHorariaTotal && (
                    <p className="text-sm text-muted-foreground">
                      Carga horária: {doc.cargaHorariaTotal}h
                    </p>
                  )}
                  {doc.caminhoArquivo && (
                    <a
                      href={doc.caminhoArquivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2"
                    >
                      <Upload className="h-3 w-3" />
                      Ver arquivo PDF
                    </a>
                  )}
                  {doc.justificativa && (
                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                      {doc.justificativa}
                    </p>
                  )}
                </div>
              ))}
              {documentosProcessados.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum documento processado ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultado da Análise IA */}
        {resultadoAnalise && (
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 Resultado da Análise Automática
                <Badge variant={resultadoAnalise.status === "CONFORME" ? "default" : "destructive"}>
                  {resultadoAnalise.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Carga Declarada</p>
                  <p className="text-2xl font-bold">{resultadoAnalise.cargaHorariaDeclarada}h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carga Calculada</p>
                  <p className="text-2xl font-bold">{resultadoAnalise.cargaHorariaCalculada}h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Divergência</p>
                  <p className="text-2xl font-bold text-red-600">{resultadoAnalise.divergenciaHoras}h</p>
                </div>
              </div>

              {/* Observações */}
              {resultadoAnalise.observacoes && resultadoAnalise.observacoes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">📝 Observações:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {resultadoAnalise.observacoes.map((obs: string, idx: number) => (
                      <li key={idx} className="text-sm">{obs}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Atividades */}
              {resultadoAnalise.atividades && resultadoAnalise.atividades.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">📋 Atividades Identificadas:</h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {resultadoAnalise.atividades.map((ativ: any, idx: number) => (
                      <div key={idx} className={`p-3 rounded-lg ${
                        ativ.alerta ? "bg-yellow-50 border border-yellow-300" : "bg-muted"
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Dia {ativ.dia}</p>
                            <p className="text-sm text-muted-foreground">{ativ.descricao}</p>
                          </div>
                          <Badge variant="outline">{ativ.horas}h</Badge>
                        </div>
                        {ativ.alerta && (
                          <p className="text-xs text-yellow-700 mt-2">⚠️ {ativ.alerta}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendação */}
              {resultadoAnalise.recomendacao && (
                <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
                  <h4 className="font-semibold mb-2">🎯 Recomendação:</h4>
                  <p className="text-sm">{resultadoAnalise.recomendacao}</p>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => setResultadoAnalise(null)}
                className="w-full"
              >
                Fechar Análise
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

