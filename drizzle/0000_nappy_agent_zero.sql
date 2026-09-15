CREATE TYPE "public"."bool_string" AS ENUM('true', 'false');--> statement-breakpoint
CREATE TYPE "public"."dia_semana" AS ENUM('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo');--> statement-breakpoint
CREATE TYPE "public"."documento_status" AS ENUM('PENDENTE', 'APROVADO', 'REPROVADO');--> statement-breakpoint
CREATE TYPE "public"."documento_tipo" AS ENUM('FREQUENCIA', 'RELATORIO_FINAL');--> statement-breakpoint
CREATE TYPE "public"."pagamento_status" AS ENUM('PENDENTE', 'SOLICITADO');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "bolsistas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"email" varchar(320),
	"dataInicio" timestamp,
	"dataFim" timestamp,
	"projetoId" integer,
	"cronograma" text,
	"dadosAdicionais" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bolsistas_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "controlePagamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"mesAno" varchar(7) NOT NULL,
	"status" "pagamento_status" DEFAULT 'PENDENTE' NOT NULL,
	"numeroProcesso" varchar(100),
	"dataSolicitacao" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coordenador_projetos" (
	"id" serial PRIMARY KEY NOT NULL,
	"coordenadorId" integer NOT NULL,
	"projetoId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coordenadores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"usuario" varchar(100) NOT NULL,
	"senha" varchar(255) NOT NULL,
	"isSuperAdmin" "bool_string" DEFAULT 'false' NOT NULL,
	"ativo" "bool_string" DEFAULT 'true' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coordenadores_email_unique" UNIQUE("email"),
	CONSTRAINT "coordenadores_usuario_unique" UNIQUE("usuario")
);
--> statement-breakpoint
CREATE TABLE "documentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"bolsistaId" integer NOT NULL,
	"tipo" "documento_tipo" NOT NULL,
	"mesAno" varchar(7),
	"caminhoArquivo" text,
	"statusDocumento" "documento_status" DEFAULT 'PENDENTE' NOT NULL,
	"justificativa" text,
	"analiseIA" text,
	"cargaHorariaTotal" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "horarios_previstos" (
	"id" serial PRIMARY KEY NOT NULL,
	"bolsista_id" integer NOT NULL,
	"dia_semana" "dia_semana" NOT NULL,
	"hora_inicio" varchar(5) NOT NULL,
	"hora_fim" varchar(5) NOT NULL,
	"local" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projetos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"ano" integer NOT NULL,
	"dataInicio" date,
	"dataFim" date,
	"cargaHoraria" integer,
	"dadosAdicionais" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "bolsistas" ADD CONSTRAINT "bolsistas_projetoId_projetos_id_fk" FOREIGN KEY ("projetoId") REFERENCES "public"."projetos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coordenador_projetos" ADD CONSTRAINT "coordenador_projetos_coordenadorId_coordenadores_id_fk" FOREIGN KEY ("coordenadorId") REFERENCES "public"."coordenadores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coordenador_projetos" ADD CONSTRAINT "coordenador_projetos_projetoId_projetos_id_fk" FOREIGN KEY ("projetoId") REFERENCES "public"."projetos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_bolsistaId_bolsistas_id_fk" FOREIGN KEY ("bolsistaId") REFERENCES "public"."bolsistas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios_previstos" ADD CONSTRAINT "horarios_previstos_bolsista_id_bolsistas_id_fk" FOREIGN KEY ("bolsista_id") REFERENCES "public"."bolsistas"("id") ON DELETE cascade ON UPDATE no action;