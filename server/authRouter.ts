import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "./auth";
import { createCoordenadorSessionToken, SESSION_MAX_AGE_MS } from "./localSession";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ usuario: z.string(), senha: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { getCoordenadorByUsuario } = await import("./db");

      const coordenador = await getCoordenadorByUsuario(input.usuario);

      if (!coordenador) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Usuário ou senha inválidos",
        });
      }

      if (!(await verifyPassword(input.senha, coordenador.senha))) {
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

      const sessionToken = await createCoordenadorSessionToken({
        coordenadorId: coordenador.id,
        usuario: coordenador.usuario,
        nome: coordenador.nome,
        isSuperAdmin: coordenador.isSuperAdmin === "true",
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });

      return {
        id: coordenador.id,
        nome: coordenador.nome,
        usuario: coordenador.usuario,
        email: coordenador.email,
        isSuperAdmin: coordenador.isSuperAdmin === "true",
      };
    }),

  // Gerenciar coordenadores (requer login)
  listCoordenadores: protectedProcedure.query(async () => {
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

  createCoordenador: protectedProcedure
    .input(z.object({
      nome: z.string(),
      usuario: z.string(),
      email: z.string().email(),
      senha: z.string(),
      isSuperAdmin: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { createCoordenador: createCoordenadorDb } = await import("./db");

      const senhaHash = await hashPassword(input.senha);

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

  updateCoordenador: protectedProcedure
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

  deleteCoordenador: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { deleteCoordenador: deleteCoordenadorDb } = await import("./db");
      await deleteCoordenadorDb(input.id);
      return { success: true };
    }),

  alterarSenha: protectedProcedure
    .input(z.object({
      coordenadorId: z.number(),
      senhaAtual: z.string(),
      novaSenha: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.id !== input.coordenadorId && !ctx.user.isSuperAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para alterar esta senha" });
      }

      const db = await import("./db").then(m => m.getDb());
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { coordenadores } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const coordenador = await db.select().from(coordenadores).where(eq(coordenadores.id, input.coordenadorId)).limit(1);

      if (!coordenador[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Coordenador não encontrado" });
      }

      if (!(await verifyPassword(input.senhaAtual, coordenador[0].senha))) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Senha atual inválida",
        });
      }

      const { updateCoordenador: updateCoordenadorDb } = await import("./db");
      const novaSenhaHash = await hashPassword(input.novaSenha);
      await updateCoordenadorDb(input.coordenadorId, { senha: novaSenhaHash });

      return { success: true };
    }),

  // Vincular coordenador a projetos
  linkCoordenadorToProjeto: protectedProcedure
    .input(z.object({ coordenadorId: z.number(), projetoId: z.number() }))
    .mutation(async ({ input }) => {
      const { linkCoordenadorToProjeto: linkDb } = await import("./db");
      await linkDb(input.coordenadorId, input.projetoId);
      return { success: true };
    }),

  unlinkCoordenadorFromProjeto: protectedProcedure
    .input(z.object({ coordenadorId: z.number(), projetoId: z.number() }))
    .mutation(async ({ input }) => {
      const { unlinkCoordenadorFromProjeto: unlinkDb } = await import("./db");
      await unlinkDb(input.coordenadorId, input.projetoId);
      return { success: true };
    }),

  getProjetosByCoordenador: protectedProcedure
    .input(z.object({ coordenadorId: z.number() }))
    .query(async ({ input }) => {
      const { getProjetosByCoordenador: getProjetosDb } = await import("./db");
      return await getProjetosDb(input.coordenadorId);
    }),
});
