import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export default function Pagamentos() {
  const { data: pagamentos, refetch } = trpc.pagamentos.list.useQuery();
  const createMutation = trpc.pagamentos.create.useMutation();
  const updateMutation = trpc.pagamentos.update.useMutation();
  const deleteMutation = trpc.pagamentos.delete.useMutation();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    mesAno: "",
  });

  const [processoData, setProcessoData] = useState<{ id: number; numeroProcesso: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          mesAno: formData.mesAno,
        });
        toast.success("Controle atualizado!");
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({
          mesAno: formData.mesAno,
          status: "PENDENTE",
        });
        toast.success("Controle de pagamento criado!");
      }
      setFormData({ mesAno: "" });
      refetch();
    } catch (error) {
      toast.error(editingId ? "Erro ao atualizar" : "Erro ao criar controle de pagamento");
    }
  };

  const handleEdit = (pag: any) => {
    setEditingId(pag.id);
    setFormData({ mesAno: pag.mesAno });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ mesAno: "" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir este controle de pagamento?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Controle excluído!");
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const handleSolicitar = async () => {
    if (!processoData || !processoData.numeroProcesso.trim()) {
      toast.error("Informe o número do processo");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: processoData.id,
        status: "SOLICITADO",
        numeroProcesso: processoData.numeroProcesso,
        dataSolicitacao: new Date(),
      });
      toast.success("Pagamento solicitado!");
      setProcessoData(null);
      refetch();
    } catch (error) {
      toast.error("Erro ao solicitar pagamento");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary"> = {
      PENDENTE: "secondary",
      SOLICITADO: "default",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const pagamentosPendentes = pagamentos?.filter(p => p.status === "PENDENTE") || [];
  const pagamentosSolicitados = pagamentos?.filter(p => p.status === "SOLICITADO") || [];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Controle de Pagamentos</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar Controle" : "Criar Novo Controle"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="mesAno">Mês/Ano (formato: MM/AAAA) *</Label>
                <Input
                  id="mesAno"
                  value={formData.mesAno}
                  onChange={(e) => setFormData({ ...formData, mesAno: e.target.value })}
                  placeholder="Ex: 01/2024"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Atualizar" : "Criar Controle"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6">
              <h3 className="font-semibold mb-3">Pagamentos Pendentes ({pagamentosPendentes.length})</h3>
              <div className="space-y-2">
                {pagamentosPendentes.map((pag) => (
                  <div key={pag.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pag.mesAno}</span>
                        {getStatusBadge(pag.status)}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(pag)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(pag.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {processoData?.id === pag.id ? (
                      <div className="space-y-2 mt-2">
                        <Input
                          placeholder="Número do processo"
                          value={processoData.numeroProcesso}
                          onChange={(e) =>
                            setProcessoData({ ...processoData, numeroProcesso: e.target.value })
                          }
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSolicitar} className="flex-1">
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProcessoData(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setProcessoData({ id: pag.id, numeroProcesso: "" })}
                        className="w-full"
                      >
                        Solicitar Pagamento
                      </Button>
                    )}
                  </div>
                ))}
                {pagamentosPendentes.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    Nenhum pagamento pendente
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Solicitados ({pagamentosSolicitados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {pagamentosSolicitados.map((pag) => (
                <div key={pag.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{pag.mesAno}</span>
                      {getStatusBadge(pag.status)}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(pag.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Processo: {pag.numeroProcesso}</div>
                    {pag.dataSolicitacao && (
                      <div>
                        Solicitado em: {new Date(pag.dataSolicitacao).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {pagamentosSolicitados.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pagamento solicitado ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

