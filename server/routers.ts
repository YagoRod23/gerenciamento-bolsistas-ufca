import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { uploadRouter } from "./upload";
import { authRouter } from "./authRouter";
import { z } from "zod";
import { analisarFrequenciaComIA } from "./analiseFrequencia";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { documentos } from "../drizzle/schema";
import { eq } from "drizzle-orm";
// Funções de horários serão importadas dinamicamente

export const appRouter = router({
  system: systemRouter,

  coordenadores: authRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Routers do Sistema de Gerenciamento de Bolsistas
  projetos: router({
    list: publicProcedure.query(async () => {
      const { getAllProjetos } = await import("./db");
      return await getAllProjetos();
    }),
    create: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { createProjeto } = await import("./db");
        return await createProjeto(input);
      }),
    update: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { updateProjeto } = await import("./db");
        const { id, ...rest } = input;
        await updateProjeto(id, rest);
        return { success: true };
      }),
    delete: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { deleteProjeto } = await import("./db");
        await deleteProjeto(input.id);
        return { success: true };
      }),
  }),

  bolsistas: router({
    list: publicProcedure.query(async () => {
      const { getAllBolsistas } = await import("./db");
      return await getAllBolsistas();
    }),
    create: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { createBolsista } = await import("./db");
        return await createBolsista(input);
      }),
    update: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { updateBolsista } = await import("./db");
        const { id, ...rest } = input;
        await updateBolsista(id, rest);
        return { success: true };
      }),
    delete: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { deleteBolsista } = await import("./db");
        await deleteBolsista(input.id);
        return { success: true };
      }),
  }),

  documentos: router({
    list: publicProcedure.query(async () => {
      const { getAllDocumentos } = await import("./db");
      return await getAllDocumentos();
    }),
    create: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { createDocumento } = await import("./db");
        return await createDocumento(input);
      }),
    update: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { updateDocumento } = await import("./db");
        const { id, ...rest } = input;
        await updateDocumento(id, rest);
        return { success: true };
      }),
    analisarComIA: publicProcedure
      .input(z.object({ documentoId: z.number(), projetoNome: z.string() }))
      .mutation(async ({ input }) => {
        console.log(`[Router] Iniciando análise do documento ID: ${input.documentoId}`);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const doc = await db.select().from(documentos).where(eq(documentos.id, input.documentoId)).limit(1);
        if (!doc[0] || !doc[0].caminhoArquivo) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Documento ou arquivo não encontrado" });
        }
        
        console.log(`[Router] Documento encontrado, arquivo: ${doc[0].caminhoArquivo}`);
        const analise = await analisarFrequenciaComIA(doc[0].caminhoArquivo, input.projetoNome);
        
        console.log(`[Router] Salvando análise no banco...`);
        const result = await db.update(documentos)
          .set({ analiseIA: JSON.stringify(analise) })
          .where(eq(documentos.id, input.documentoId));
        
        console.log(`[Router] Análise salva com sucesso! Retornando resultado.`);
        return analise;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteDocumento } = await import("./db");
        await deleteDocumento(input.id);
        return { success: true };
      }),
  }),

  upload: uploadRouter,

  pagamentos: router({
    list: publicProcedure.query(async () => {
      const { getAllControlePagamentos } = await import("./db");
      return await getAllControlePagamentos();
    }),
    create: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { createControlePagamento } = await import("./db");
        return await createControlePagamento(input);
      }),
    update: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { updateControlePagamento } = await import("./db");
        const { id, ...rest } = input;
        await updateControlePagamento(id, rest);
        return { success: true };
      }),
    delete: publicProcedure
      .input((data: any) => data)
      .mutation(async ({ input }) => {
        const { deleteControlePagamento } = await import("./db");
        await deleteControlePagamento(input.id);
        return { success: true };
      }),
  }),

  analiseIA: router({
    analisar: publicProcedure
      .input(z.object({ documentoId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // Buscar documento
        const [documento] = await db.select().from(documentos).where(eq(documentos.id, input.documentoId)).limit(1);
        if (!documento) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado" });
        }

        if (!documento.caminhoArquivo) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Documento não possui arquivo PDF" });
        }

        // Buscar bolsista e projeto
        const { bolsistas, projetos } = await import("../drizzle/schema");
        const [bolsista] = await db.select().from(bolsistas).where(eq(bolsistas.id, documento.bolsistaId)).limit(1);
        
        let projetoNome = "Projeto não especificado";
        if (bolsista?.projetoId) {
          const [projeto] = await db.select().from(projetos).where(eq(projetos.id, bolsista.projetoId)).limit(1);
          if (projeto) {
            projetoNome = projeto.nome;
          }
        }

        // Chamar função de análise
        const resultado = await analisarFrequenciaComIA(documento.caminhoArquivo, projetoNome);
        
        return resultado;
      }),
  }),

  horarios: router({
    getAll: publicProcedure.query(async () => {
      const { getAllHorarios } = await import("./db");
      return await getAllHorarios();
    }),
    getByBolsista: publicProcedure
      .input(z.object({ bolsistaId: z.number() }))
      .query(async ({ input }) => {
        const { getHorariosByBolsista } = await import("./db");
        return await getHorariosByBolsista(input.bolsistaId);
      }),
    create: publicProcedure
      .input(z.object({
        bolsistaId: z.number(),
        diaSemana: z.enum(["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]),
        horaInicio: z.string(),
        horaFim: z.string(),
        local: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createHorarioPrevisto } = await import("./db");
        await createHorarioPrevisto(input);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteHorarioPrevisto } = await import("./db");
        await deleteHorarioPrevisto(input.id);
        return { success: true };
      }),
    deleteByBolsista: publicProcedure
      .input(z.object({ bolsistaId: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteHorariosByBolsista } = await import("./db");
        await deleteHorariosByBolsista(input.bolsistaId);
        return { success: true };
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        diaSemana: z.enum(["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]).optional(),
        horaInicio: z.string().optional(),
        horaFim: z.string().optional(),
        local: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateHorarioPrevisto } = await import("./db");
        const { id, ...rest } = input;
        await updateHorarioPrevisto(id, rest);
        return { success: true };
      }),
    ocupacao: publicProcedure.query(async () => {
      const { getOcupacaoLocais } = await import("./db");
      return await getOcupacaoLocais();
    }),
  }),
});

export type AppRouter = typeof appRouter;

// Adicionar endpoints de edição e ocupação
