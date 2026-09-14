import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Copy } from "lucide-react";

export default function Projetos() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { data: projetos, refetch } = trpc.projetos.list.useQuery();
  const createMutation = trpc.projetos.create.useMutation();
  const updateMutation = trpc.projetos.update.useMutation();
  const deleteMutation = trpc.projetos.delete.useMutation();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ano: currentYear.toString(),
    dataInicio: "",
    dataFim: "",
    cargaHoraria: "",
    tipo: "Institucional",
    responsavel: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { tipo, responsavel, ...rest } = formData;
      const payload = {
        ...rest,
        ano: parseInt(rest.ano),
        cargaHoraria: rest.cargaHoraria ? parseInt(rest.cargaHoraria) : null,
        dataInicio: rest.dataInicio ? new Date(rest.dataInicio) : null,
        dataFim: rest.dataFim ? new Date(rest.dataFim) : null,
        dadosAdicionais: JSON.stringify({ tipo, responsavel }),
      };

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...payload,
        });
        toast.success("Projeto atualizado com sucesso!");
        setEditingId(null);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Projeto cadastrado com sucesso!");
      }
      setFormData({ nome: "", descricao: "", ano: currentYear.toString(), dataInicio: "", dataFim: "", cargaHoraria: "", tipo: "Institucional", responsavel: "" });
      refetch();
    } catch (error) {
      toast.error(editingId ? "Erro ao atualizar projeto" : "Erro ao cadastrar projeto");
    }
  };

  const handleEdit = (projeto: any) => {
    setEditingId(projeto.id);
    let dadosAdicionais = { tipo: "Institucional", responsavel: "" };
    if ((projeto as any).dadosAdicionais) {
      try {
        dadosAdicionais = typeof (projeto as any).dadosAdicionais === 'string' ? JSON.parse((projeto as any).dadosAdicionais) : (projeto as any).dadosAdicionais;
      } catch (e) {
        console.error('Erro ao parsear dadosAdicionais:', e);
      }
    }
    setFormData({
      nome: projeto.nome,
      descricao: projeto.descricao || "",
      ano: projeto.ano.toString(),
      dataInicio: projeto.dataInicio ? new Date(projeto.dataInicio).toISOString().split('T')[0] : "",
      dataFim: projeto.dataFim ? new Date(projeto.dataFim).toISOString().split('T')[0] : "",
      cargaHoraria: projeto.cargaHoraria?.toString() || "",
      tipo: dadosAdicionais.tipo || "Institucional",
      responsavel: dadosAdicionais.responsavel || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ nome: "", descricao: "", ano: currentYear.toString(), dataInicio: "", dataFim: "", cargaHoraria: "", tipo: "Institucional", responsavel: "" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir este projeto?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Projeto excluído com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir projeto");
    }
  };

  const handleRenovar = (projeto: any) => {
    let dadosAdicionais = { tipo: "Institucional", responsavel: "" };
    if ((projeto as any).dadosAdicionais) {
      try {
        dadosAdicionais = typeof (projeto as any).dadosAdicionais === 'string' ? JSON.parse((projeto as any).dadosAdicionais) : (projeto as any).dadosAdicionais;
      } catch (e) {
        console.error('Erro ao parsear dadosAdicionais:', e);
      }
    }
    setFormData({
      nome: projeto.nome,
      descricao: projeto.descricao || "",
      ano: (currentYear + 1).toString(),
      dataInicio: "",
      dataFim: "",
      cargaHoraria: projeto.cargaHoraria?.toString() || "",
      tipo: dadosAdicionais.tipo || "Institucional",
      responsavel: dadosAdicionais.responsavel || "",
    });
    toast.info(`Renovando projeto "${projeto.nome}" para ${currentYear + 1}`);
  };

  const projetosFiltrados = projetos?.filter(p => p.ano === selectedYear) || [];
  const anosDisponiveis = Array.from(new Set(projetos?.map(p => p.ano) || [])).sort((a, b) => b - a);
  if (!anosDisponiveis.includes(currentYear)) {
    anosDisponiveis.unshift(currentYear);
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Projetos</h1>
        <div className="flex items-center gap-2">
          <Label>Filtrar por ano:</Label>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map(ano => (
                <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar Projeto" : "Cadastrar Novo Projeto"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Projeto *</Label>
                <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="ano">Ano do Edital *</Label>
                <Input id="ano" type="number" value={formData.ano} onChange={(e) => setFormData({ ...formData, ano: e.target.value })} min="2020" max="2030" required />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de Projeto *</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Institucional">Institucional</SelectItem>
                    <SelectItem value="Iniciativa da Comunidade">Iniciativa da Comunidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responsavel">Responsável</Label>
                <Input id="responsavel" value={formData.responsavel} onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })} placeholder="Nome do responsável" />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input id="dataInicio" type="date" value={formData.dataInicio} onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input id="dataFim" type="date" value={formData.dataFim} onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="cargaHoraria">Carga Horária Total (horas)</Label>
                <Input id="cargaHoraria" type="number" value={formData.cargaHoraria} onChange={(e) => setFormData({ ...formData, cargaHoraria: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingId ? "Atualizar Projeto" : "Cadastrar Projeto"}</Button>
                {editingId && (<Button type="button" variant="outline" onClick={handleCancelEdit}>Cancelar</Button>)}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projetos Cadastrados ({projetosFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {projetosFiltrados.map((projeto: any) => {
                let dados = { tipo: "", responsavel: "" };
                if (projeto.dadosAdicionais) {
                  try {
                    dados = typeof projeto.dadosAdicionais === 'string' ? JSON.parse(projeto.dadosAdicionais) : projeto.dadosAdicionais;
                  } catch (e) {
                    console.error('Erro ao parsear dadosAdicionais:', e);
                  }
                }
                return (
                  <div key={projeto.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold">{projeto.nome}</h3>
                        <p className="text-sm text-muted-foreground">Ano: {projeto.ano}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(projeto)} title="Editar"><Pencil className="h-3 w-3" /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleRenovar(projeto)} title="Renovar para próximo ano"><Copy className="h-3 w-3" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(projeto.id)} title="Excluir"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    {projeto.descricao && (<p className="text-sm text-muted-foreground mb-2">{projeto.descricao}</p>)}
                    <div className="text-xs text-muted-foreground space-y-1">
                      {dados.tipo && (<div>Tipo: {dados.tipo}</div>)}
                      {dados.responsavel && (<div>Responsável: {dados.responsavel}</div>)}
                      {projeto.dataInicio && projeto.dataFim && (<div>Período: {new Date(projeto.dataInicio).toLocaleDateString()} até {new Date(projeto.dataFim).toLocaleDateString()}</div>)}
                      {projeto.cargaHoraria && (<div>Carga horária: {projeto.cargaHoraria}h</div>)}
                    </div>
                  </div>
                );
              })}
              {projetosFiltrados.length === 0 && (<p className="text-center text-muted-foreground py-8">Nenhum projeto cadastrado para {selectedYear}</p>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
