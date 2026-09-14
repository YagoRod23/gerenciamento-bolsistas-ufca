import { date, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabelas do Sistema de Gerenciamento de Bolsistas

export const projetos = mysqlTable("projetos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  ano: int("ano").notNull(), // Ano do edital
  dataInicio: date("dataInicio"),
  dataFim: date("dataFim"),
  cargaHoraria: int("cargaHoraria"),
  dadosAdicionais: text("dadosAdicionais"), // JSON: { tipo: "Institucional" | "Iniciativa da Comunidade", responsavel: string }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Projeto = typeof projetos.$inferSelect;
export type InsertProjeto = typeof projetos.$inferInsert;

export const bolsistas = mysqlTable("bolsistas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  dataInicio: timestamp("dataInicio"),
  dataFim: timestamp("dataFim"),
  projetoId: int("projetoId").references(() => projetos.id),
  cronograma: text("cronograma"), // JSON: { local: string, horaInicio: string, horaFim: string, dias: string[] }
  dadosAdicionais: text("dadosAdicionais"), // JSON: { matricula, telefone, sexo, idade, observacoes }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bolsista = typeof bolsistas.$inferSelect;
export type InsertBolsista = typeof bolsistas.$inferInsert;

export const documentos = mysqlTable("documentos", {
  id: int("id").autoincrement().primaryKey(),
  bolsistaId: int("bolsistaId").notNull().references(() => bolsistas.id),
  tipo: mysqlEnum("tipo", ["FREQUENCIA", "RELATORIO_FINAL"]).notNull(),
  mesAno: varchar("mesAno", { length: 7 }),
  caminhoArquivo: text("caminhoArquivo"),
  statusDocumento: mysqlEnum("statusDocumento", ["PENDENTE", "APROVADO", "REPROVADO"]).default("PENDENTE").notNull(),
  justificativa: text("justificativa"),
  analiseIA: text("analiseIA"),
  cargaHorariaTotal: int("cargaHorariaTotal"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Documento = typeof documentos.$inferSelect;
export type InsertDocumento = typeof documentos.$inferInsert;

export const controlePagamentos = mysqlTable("controlePagamentos", {
  id: int("id").autoincrement().primaryKey(),
  mesAno: varchar("mesAno", { length: 7 }).notNull(),
  status: mysqlEnum("status", ["PENDENTE", "SOLICITADO"]).default("PENDENTE").notNull(),
  numeroProcesso: varchar("numeroProcesso", { length: 100 }),
  dataSolicitacao: timestamp("dataSolicitacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ControlePagamento = typeof controlePagamentos.$inferSelect;
export type InsertControlePagamento = typeof controlePagamentos.$inferInsert;

/**
 * Horários previstos dos bolsistas
 */
export const horariosPrevistos = mysqlTable("horarios_previstos", {
  id: int("id").autoincrement().primaryKey(),
  bolsistaId: int("bolsista_id").notNull().references(() => bolsistas.id, { onDelete: "cascade" }),
  diaSemana: mysqlEnum("dia_semana", ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]).notNull(),
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
export const coordenadores = mysqlTable("coordenadores", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  usuario: varchar("usuario", { length: 100 }).notNull().unique(),
  senha: varchar("senha", { length: 255 }).notNull(),
  isSuperAdmin: mysqlEnum("isSuperAdmin", ["true", "false"]).default("false").notNull(),
  ativo: mysqlEnum("ativo", ["true", "false"]).default("true").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Coordenador = typeof coordenadores.$inferSelect;
export type InsertCoordenador = typeof coordenadores.$inferInsert;

/**
 * Relacao entre coordenadores e projetos
 */
export const coordenadorProjetos = mysqlTable("coordenador_projetos", {
  id: int("id").autoincrement().primaryKey(),
  coordenadorId: int("coordenadorId").notNull().references(() => coordenadores.id, { onDelete: "cascade" }),
  projetoId: int("projetoId").notNull().references(() => projetos.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoordenadorProjeto = typeof coordenadorProjetos.$inferSelect;
export type InsertCoordenadorProjeto = typeof coordenadorProjetos.$inferInsert;

