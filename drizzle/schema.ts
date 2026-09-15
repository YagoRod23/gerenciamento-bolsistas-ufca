import { date, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const documentoTipoEnum = pgEnum("documento_tipo", ["FREQUENCIA", "RELATORIO_FINAL"]);
export const documentoStatusEnum = pgEnum("documento_status", ["PENDENTE", "APROVADO", "REPROVADO"]);
export const pagamentoStatusEnum = pgEnum("pagamento_status", ["PENDENTE", "SOLICITADO"]);
export const diaSemanaEnum = pgEnum("dia_semana", ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]);
export const boolStringEnum = pgEnum("bool_string", ["true", "false"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabelas do Sistema de Gerenciamento de Bolsistas

export const projetos = pgTable("projetos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  ano: integer("ano").notNull(), // Ano do edital
  dataInicio: date("dataInicio"),
  dataFim: date("dataFim"),
  cargaHoraria: integer("cargaHoraria"),
  dadosAdicionais: text("dadosAdicionais"), // JSON: { tipo: "Institucional" | "Iniciativa da Comunidade", responsavel: string }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Projeto = typeof projetos.$inferSelect;
export type InsertProjeto = typeof projetos.$inferInsert;

export const bolsistas = pgTable("bolsistas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  dataInicio: timestamp("dataInicio"),
  dataFim: timestamp("dataFim"),
  projetoId: integer("projetoId").references(() => projetos.id),
  cronograma: text("cronograma"), // JSON: { local: string, horaInicio: string, horaFim: string, dias: string[] }
  dadosAdicionais: text("dadosAdicionais"), // JSON: { matricula, telefone, sexo, idade, observacoes }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Bolsista = typeof bolsistas.$inferSelect;
export type InsertBolsista = typeof bolsistas.$inferInsert;

export const documentos = pgTable("documentos", {
  id: serial("id").primaryKey(),
  bolsistaId: integer("bolsistaId").notNull().references(() => bolsistas.id),
  tipo: documentoTipoEnum("tipo").notNull(),
  mesAno: varchar("mesAno", { length: 7 }),
  caminhoArquivo: text("caminhoArquivo"),
  statusDocumento: documentoStatusEnum("statusDocumento").default("PENDENTE").notNull(),
  justificativa: text("justificativa"),
  analiseIA: text("analiseIA"),
  cargaHorariaTotal: integer("cargaHorariaTotal"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Documento = typeof documentos.$inferSelect;
export type InsertDocumento = typeof documentos.$inferInsert;

export const controlePagamentos = pgTable("controlePagamentos", {
  id: serial("id").primaryKey(),
  mesAno: varchar("mesAno", { length: 7 }).notNull(),
  status: pagamentoStatusEnum("status").default("PENDENTE").notNull(),
  numeroProcesso: varchar("numeroProcesso", { length: 100 }),
  dataSolicitacao: timestamp("dataSolicitacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type ControlePagamento = typeof controlePagamentos.$inferSelect;
export type InsertControlePagamento = typeof controlePagamentos.$inferInsert;

/**
 * Horários previstos dos bolsistas
 */
export const horariosPrevistos = pgTable("horarios_previstos", {
  id: serial("id").primaryKey(),
  bolsistaId: integer("bolsista_id").notNull().references(() => bolsistas.id, { onDelete: "cascade" }),
  diaSemana: diaSemanaEnum("dia_semana").notNull(),
  horaInicio: varchar("hora_inicio", { length: 5 }).notNull(),
  horaFim: varchar("hora_fim", { length: 5 }).notNull(),
  local: varchar("local", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type HorarioPrevisto = typeof horariosPrevistos.$inferSelect;
export type InsertHorarioPrevisto = typeof horariosPrevistos.$inferInsert;

/**
 * Coordenadores de projetos
 */
export const coordenadores = pgTable("coordenadores", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  usuario: varchar("usuario", { length: 100 }).notNull().unique(),
  senha: varchar("senha", { length: 255 }).notNull(),
  isSuperAdmin: boolStringEnum("isSuperAdmin").default("false").notNull(),
  ativo: boolStringEnum("ativo").default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Coordenador = typeof coordenadores.$inferSelect;
export type InsertCoordenador = typeof coordenadores.$inferInsert;

/**
 * Relacao entre coordenadores e projetos
 */
export const coordenadorProjetos = pgTable("coordenador_projetos", {
  id: serial("id").primaryKey(),
  coordenadorId: integer("coordenadorId").notNull().references(() => coordenadores.id, { onDelete: "cascade" }),
  projetoId: integer("projetoId").notNull().references(() => projetos.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoordenadorProjeto = typeof coordenadorProjetos.$inferSelect;
export type InsertCoordenadorProjeto = typeof coordenadorProjetos.$inferInsert;
