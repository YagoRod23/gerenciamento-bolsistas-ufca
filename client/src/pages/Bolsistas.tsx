import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";

interface HorarioDia {
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  local: string | null;
}

export default function Bolsistas() {
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const { data: bolsistas, refetch } = trpc.bolsistas.list.useQuery();
  const { data: projetos } = trpc.projetos.list.useQuery();
  const { data: horariosData } = trpc.horarios.getByBolsista.useQuery({ bolsistaId: editingId || 0 });
  
  const createMutation = trpc.bolsistas.create.useMutation();
  const updateMutation = trpc.bolsistas.update.useMutation();
  const deleteMutation = trpc.bolsistas.delete.useMutation();
  const createHorarioMutation = trpc.horarios.create.useMutation();
  const deleteHorarioMutation = trpc.horarios.delete.useMutation();
  const deleteHorariosByBolsistaMutation = trpc.horarios.deleteByBolsista.useMutation();
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    dataInicio: "",
    dataFim: "",
    projetoId: "",
  });

  const [horariosDia, setHorariosDia] = useState<HorarioDia[]>([]);
  const [novoHorario, setNovoHorario] = useState<HorarioDia>({
    diaSemana: "segunda",
    horaInicio: "",
    horaFim: "",
    local: "",
  });

  const diasSemana = [
    { chave: "segunda", label: "Segunda-feira" },
    { chave: "terca", label: "Terça-feira" },
    { chave: "quarta", label: "Quarta-feira" },
    { chave: "quinta", label: "Quinta-feira" },
    { chave: "sexta", label: "Sexta-feira" },
    { chave: "sabado", label: "Sábado" },
    { chave: "domingo", label: "Domingo" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        projetoId: formData.projetoId && formData.projetoId !== "0" ? parseInt(formData.projetoId) : null,
        dataInicio: formData.dataInicio ? new Date(formData.dataInicio) : null,
        dataFim: formData.dataFim ? new Date(formData.dataFim) : null,
        cronograma: null, // Não usar mais o campo JSON
      };

      let bolsistaId: number;

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...payload,
        });
        bolsistaId = editingId;
        toast.success("Bolsista atualizado com sucesso!");
      } else {
        const result = await createMutation.mutateAsync(payload);
        bolsistaId = (result as any).id || editingId;
        toast.success("Bolsista cadastrado com sucesso!");
      }

      // Deletar horários antigos se estiver editando
      if (editingId && bolsistaId) {
        await deleteHorariosByBolsistaMutation.mutateAsync({ bolsistaId });
      }

      // Salvar novos horários
      if (horariosDia.length > 0 && bolsistaId) {
        for (const horario of horariosDia) {
          await createHorarioMutation.mutateAsync({
            bolsistaId,
            diaSemana: horario.diaSemana as any,
            horaInicio: horario.horaInicio,
            horaFim: horario.horaFim,
            local: horario.local || "",
          });
        }
      }

      setFormData({ nome: "", cpf: "", email: "", dataInicio: "", dataFim: "", projetoId: "" });
      setHorariosDia([]);
      setEditingId(null);
      refetch();
    } catch (error) {
      toast.error(editingId ? "Erro ao atualizar bolsista" : "Erro ao cadastrar bolsista");
    }
  };

  const handleEdit = (bolsista: any) => {
    setEditingId(bolsista.id);
    setFormData({
      nome: bolsista.nome,
      cpf: bolsista.cpf,
      email: bolsista.email || "",
      dataInicio: bolsista.dataInicio ? new Date(bolsista.dataInicio).toISOString().split('T')[0] : "",
      dataFim: bolsista.dataFim ? new Date(bolsista.dataFim).toISOString().split('T')[0] : "",
      projetoId: bolsista.projetoId?.toString() || "0",
    });

    // Carregar horários do bolsista
    const horariosDobolsista = horariosData?.filter((h: any) => h.bolsistaId === bolsista.id) || [];
    setHorariosDia(horariosDobolsista);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ nome: "", cpf: "", email: "", dataInicio: "", dataFim: "", projetoId: "" });
    setHorariosDia([]);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir este bolsista?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Bolsista excluído com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir bolsista");
    }
  };

  const handleAddHorario = () => {
    if (!novoHorario.horaInicio || !novoHorario.horaFim) {
      toast.error("Preencha hora início e hora fim");
      return;
    }

    // Verificar se já existe horário para este dia
    if (horariosDia.some(h => h.diaSemana === novoHorario.diaSemana)) {
      toast.error("Já existe um horário para este dia");
      return;
    }

    setHorariosDia([...horariosDia, novoHorario]);
    setNovoHorario({
      diaSemana: "segunda",
      horaInicio: "",
      horaFim: "",
      local: "",
    });
  };

  const handleRemoveHorario = (index: number) => {
    setHorariosDia(horariosDia.filter((_, i) => i !== index));
  };

  const getProjetoNome = (projetoId: number | null) => {
    if (!projetoId) return "Sem projeto";
    return projetos?.find(p => p.id === projetoId)?.nome || "Projeto não encontrado";
  };

  const getDiaNome = (chave: string) => {
    return diasSemana.find(d => d.chave === chave)?.label || chave;
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Gerenciamento de Bolsistas</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar Bolsista" : "Cadastrar Novo Bolsista"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="projeto">Projeto</Label>
                <Select value={formData.projetoId} onValueChange={(value) => setFormData({ ...formData, projetoId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sem projeto</SelectItem>
                    {projetos?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  />
                </div>
              </div>

              {/* Seção de Horários */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Horários por Dia da Semana</h3>

                {/* Horários já adicionados */}
                <div className="space-y-2 mb-4">
                  {horariosDia.map((horario, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                      <span className="text-sm">
                        <strong>{getDiaNome(horario.diaSemana)}</strong>: {horario.horaInicio} - {horario.horaFim}
                        {horario.local && ` (${horario.local})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHorario(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adicionar novo horário */}
                <div className="space-y-2 bg-gray-50 p-3 rounded">
                  <div>
                    <Label htmlFor="dia">Dia da Semana</Label>
                    <Select value={novoHorario.diaSemana} onValueChange={(value) => setNovoHorario({ ...novoHorario, diaSemana: value })}>
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="horaInicio">Hora Início</Label>
                      <Input
                        id="horaInicio"
                        type="time"
                        value={novoHorario.horaInicio}
                        onChange={(e) => setNovoHorario({ ...novoHorario, horaInicio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="horaFim">Hora Fim</Label>
                      <Input
                        id="horaFim"
                        type="time"
                        value={novoHorario.horaFim}
                        onChange={(e) => setNovoHorario({ ...novoHorario, horaFim: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="local">Local (opcional)</Label>
                    <Input
                      id="local"
                      value={novoHorario.local || ""}
                      onChange={(e) => setNovoHorario({ ...novoHorario, local: e.target.value })}
                      placeholder="Ex: Sala 101, Laboratório, etc."
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddHorario}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus size={16} className="mr-2" />
                    Adicionar Horário
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  {editingId ? "Atualizar" : "Cadastrar"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bolsistas Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bolsistas?.map((bolsista: any) => (
                <div key={bolsista.id} className="flex justify-between items-center p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-semibold">{bolsista.nome}</p>
                    <p className="text-sm text-gray-600">{getProjetoNome(bolsista.projetoId)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(bolsista)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(bolsista.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
