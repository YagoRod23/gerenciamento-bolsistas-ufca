import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "./auth";

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ usuario: z.string(), senha: z.string() }))
    .mutation(async ({ input }) => {
      const { getCoordenadorByUsuario } = await import("./db");
      
      const coordenador = await getCoordenadorByUsuario(input.usuario);
      
      if (!coordenador) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário ou senha inválidos",
        });
      }

      if (!verifyPassword(input.senha, coordenador.senha)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário ou senha inválidos",
        });
      }

      if (coordenador.ativo === "false") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Coordenador inativo",
        });
      }

      // Aqui você pode gerar um token JWT ou sessão
      // Por enquanto, retornamos os dados do coordenador
      return {
        id: coordenador.id,
        nome: coordenador.nome,
        usuario: coordenador.usuario,
        email: coordenador.email,
        isSuperAdmin: coordenador.isSuperAdmin === "true",
      };
    }),

  // Gerenciar coordenadores (apenas super admin)
  listCoordenadores: publicProcedure.query(async () => {
    const { getAllCoordenadores } = await import("./db");
    const coordenadores = await getAllCoordenadores();
    return coordenadores.map(c => ({
      id: c.id,
      nome: c.nome,
      usuario: c.usuario,
      email: c.email,
      isSuperAdmin: c.isSuperAdmin === "true",
      ativo: c.ativo === "true",
    }));
  }),

  createCoordenador: publicProcedure
    .input(z.object({
      nome: z.string(),
      usuario: z.string(),
      email: z.string().email(),
      senha: z.string(),
      isSuperAdmin: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { createCoordenador: createCoordenadorDb } = await import("./db");
      
      const senhaHash = hashPassword(input.senha);
      
      await createCoordenadorDb({
        nome: input.nome,
        usuario: input.usuario,
        email: input.email,
        senha: senhaHash,
        isSuperAdmin: input.isSuperAdmin ? "true" : "false",
        ativo: "true",
      });

      return { success: true };
    }),

  updateCoordenador: publicProcedure
    .input(z.object({
      id: z.number(),
      nome: z.string().optional(),
      email: z.string().email().optional(),
      ativo: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { updateCoordenador: updateCoordenadorDb } = await import("./db");
      
      const data: any = {};
      if (input.nome) data.nome = input.nome;
      if (input.email) data.email = input.email;
      if (input.ativo !== undefined) data.ativo = input.ativo ? "true" : "false";

      await updateCoordenadorDb(input.id, data);
      return { success: true };
    }),

  deleteCoordenador: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { deleteCoordenador: deleteCoordenadorDb } = await import("./db");
      await deleteCoordenadorDb(input.id);
      return { success: true };
    }),

  alterarSenha: publicProcedure
    .input(z.object({
      coordenadorId: z.number(),
      senhaAtual: z.string(),
      novaSenha: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { getCoordenadorByUsuario } = await import("./db");
      const { updateCoordenador: updateCoordenadorDb } = await import("./db");
      
      // Aqui você precisaria ter o coordenador autenticado
      // Por enquanto, vamos validar a senha atual
      const db = await import("./db").then(m => m.getDb());
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { coordenadores } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const coordenador = await db.select().from(coordenadores).where(eq(coordenadores.id, input.coordenadorId)).limit(1);
      
      if (!coordenador[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Coordenador não encontrado" });
      }

      if (!verifyPassword(input.senhaAtual, coordenador[0].senha)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Senha atual inválida",
        });
      }

      const novaSenhaHash = hashPassword(input.novaSenha);
      await updateCoordenadorDb(input.coordenadorId, { senha: novaSenhaHash });

      return { success: true };
    }),

  // Vincular coordenador a projetos
  linkCoordenadorToProjeto: publicProcedure
    .input(z.object({ coordenadorId: z.number(), projetoId: z.number() }))
    .mutation(async ({ input }) => {
      const { linkCoordenadorToProjeto: linkDb } = await import("./db");
      await linkDb(input.coordenadorId, input.projetoId);
      return { success: true };
    }),

  unlinkCoordenadorFromProjeto: publicProcedure
    .input(z.object({ coordenadorId: z.number(), projetoId: z.number() }))
    .mutation(async ({ input }) => {
      const { unlinkCoordenadorFromProjeto: unlinkDb } = await import("./db");
      await unlinkDb(input.coordenadorId, input.projetoId);
      return { success: true };
    }),

  getProjetosByCoordenador: publicProcedure
    .input(z.object({ coordenadorId: z.number() }))
    .query(async ({ input }) => {
      const { getProjetosByCoordenador: getProjetosDb } = await import("./db");
      return await getProjetosDb(input.coordenadorId);
    }),
});

