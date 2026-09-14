import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Clock, Edit2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const diasSemana = [
  { value: "segunda", label: "Segunda-feira" },
  { value: "terca", label: "Terça-feira" },
  { value: "quarta", label: "Quarta-feira" },
  { value: "quinta", label: "Quinta-feira" },
  { value: "sexta", label: "Sexta-feira" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

export default function Horarios() {
  const [bolsistaId, setBolsistaId] = useState<number | null>(null);
  const [diaSemana, setDiaSemana] = useState<string>("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [local, setLocal] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDia, setEditDia] = useState<string>("");
  const [editHoraInicio, setEditHoraInicio] = useState("");
  const [editHoraFim, setEditHoraFim] = useState("");
  const [editLocal, setEditLocal] = useState("");

  const { data: bolsistas = [] } = trpc.bolsistas.list.useQuery();
  const { data: horarios = [], refetch } = trpc.horarios.getByBolsista.useQuery(
    { bolsistaId: bolsistaId || 0 },
    { enabled: !!bolsistaId }
  );

  const createMutation = trpc.horarios.create.useMutation({
    onSuccess: () => {
      toast.success("Horário cadastrado com sucesso!");
      refetch();
      setDiaSemana("");
      setHoraInicio("");
      setHoraFim("");
      setLocal("");
    },
  });

  const updateMutation = trpc.horarios.update.useMutation({
    onSuccess: () => {
      toast.success("Horário atualizado com sucesso!");
      refetch();
      setEditingId(null);
    },
  });

  const deleteMutation = trpc.horarios.delete.useMutation({
    onSuccess: () => {
      toast.success("Horário excluído!");
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bolsistaId || !diaSemana || !horaInicio || !horaFim) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }
    createMutation.mutate({
      bolsistaId,
      diaSemana: diaSemana as any,
      horaInicio,
      horaFim,
      local: local || undefined,
    });
  };

  const handleEditStart = (horario: any) => {
    setEditingId(horario.id);
    setEditDia(horario.diaSemana);
    setEditHoraInicio(horario.horaInicio);
    setEditHoraFim(horario.horaFim);
    setEditLocal(horario.local || "");
  };

  const handleEditSave = () => {
    if (!editDia || !editHoraInicio || !editHoraFim) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }
    updateMutation.mutate({
      id: editingId!,
      diaSemana: editDia as any,
      horaInicio: editHoraInicio,
      horaFim: editHoraFim,
      local: editLocal || undefined,
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost">← Voltar ao Dashboard</Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Clock className="w-8 h-8" />
        Gestão de Horários Previstos
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Cadastro */}
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Horário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Bolsista</Label>
                <Select value={bolsistaId?.toString() || ""} onValueChange={(v) => setBolsistaId(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um bolsista" />
                  </SelectTrigger>
                  <SelectContent>
                    {bolsistas.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Dia da Semana</Label>
                <Select value={diaSemana} onValueChange={setDiaSemana}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((dia) => (
                      <SelectItem key={dia.value} value={dia.value}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora Início</Label>
                  <Input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Hora Fim</Label>
                  <Input
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Local (Opcional)</Label>
                <Input
                  type="text"
                  placeholder="Ex: PROCULT, Laboratório"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Cadastrando..." : "Cadastrar Horário"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Horários */}
        <Card>
          <CardHeader>
            <CardTitle>Horários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {!bolsistaId ? (
              <p className="text-muted-foreground text-center py-8">
                Selecione um bolsista para ver os horários
              </p>
            ) : horarios.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum horário cadastrado para este bolsista
              </p>
            ) : (
              <div className="space-y-2">
                {horarios.map((h) => (
                  <div key={h.id}>
                    {editingId === h.id ? (
                      // Modo Edição
                      <div className="p-3 border rounded-lg bg-blue-50 space-y-3">
                        <div>
                          <Label className="text-xs">Dia da Semana</Label>
                          <Select value={editDia} onValueChange={setEditDia}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {diasSemana.map((dia) => (
                                <SelectItem key={dia.value} value={dia.value}>
                                  {dia.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Hora Início</Label>
                            <Input
                              type="time"
                              value={editHoraInicio}
                              onChange={(e) => setEditHoraInicio(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Hora Fim</Label>
                            <Input
                              type="time"
                              value={editHoraFim}
                              onChange={(e) => setEditHoraFim(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Local</Label>
                          <Input
                            type="text"
                            value={editLocal}
                            onChange={(e) => setEditLocal(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleEditSave}
                            disabled={updateMutation.isPending}
                            className="flex-1"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditCancel}
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Modo Visualização
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">
                            {diasSemana.find((d) => d.value === h.diaSemana)?.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {h.horaInicio} - {h.horaFim}
                          </p>
                          {h.local && (
                            <p className="text-xs text-gray-500">
                              Local: {h.local}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditStart(h)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate({ id: h.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
