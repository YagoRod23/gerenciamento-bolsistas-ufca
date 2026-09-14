import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Trash2, Plus, Edit2 } from "lucide-react";

export default function GerenciadorCoordenadores() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    usuario: "",
    email: "",
    senha: "",
    isSuperAdmin: false,
  });

  const { data: coordenadores, refetch } = trpc.coordenadores.listCoordenadores.useQuery();
  const createMutation = trpc.coordenadores.createCoordenador.useMutation();
  const updateMutation = trpc.coordenadores.updateCoordenador.useMutation();
  const deleteMutation = trpc.coordenadores.deleteCoordenador.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.usuario || !formData.email || (!editingId && !formData.senha)) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          nome: formData.nome,
          email: formData.email,
        });
        toast.success("Coordenador atualizado!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Coordenador criado!");
      }

      setFormData({ nome: "", usuario: "", email: "", senha: "", isSuperAdmin: false });
      setEditingId(null);
      setOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar coordenador");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este coordenador?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Coordenador deletado!");
        refetch();
      } catch (error: any) {
        toast.error(error.message || "Erro ao deletar coordenador");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciador de Coordenadores</h1>
          <p className="text-muted-foreground">Gerencie os coordenadores do sistema</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Coordenador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Coordenador" : "Novo Coordenador"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do coordenador
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Usuário</label>
                <Input
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  placeholder="Usuário único"
                  disabled={!!editingId}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              {!editingId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Senha</label>
                  <Input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Senha"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="superAdmin"
                  checked={formData.isSuperAdmin}
                  onChange={(e) => setFormData({ ...formData, isSuperAdmin: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="superAdmin" className="text-sm font-medium">
                  Super Admin
                </label>
              </div>

              <Button type="submit" className="w-full">
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {coordenadores?.map((coord) => (
          <Card key={coord.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{coord.nome}</CardTitle>
                  <CardDescription>{coord.usuario}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        nome: coord.nome,
                        usuario: coord.usuario,
                        email: coord.email,
                        senha: "",
                        isSuperAdmin: coord.isSuperAdmin,
                      });
                      setEditingId(coord.id);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(coord.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{coord.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={coord.ativo ? "text-green-600" : "text-red-600"}>
                  {coord.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span>{coord.isSuperAdmin ? "Super Admin" : "Coordenador"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

