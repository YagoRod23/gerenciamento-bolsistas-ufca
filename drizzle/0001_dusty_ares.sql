CREATE TABLE `bolsistas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cpf` varchar(14) NOT NULL,
	`email` varchar(320),
	`dataInicio` timestamp,
	`dataFim` timestamp,
	`projetoId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bolsistas_id` PRIMARY KEY(`id`),
	CONSTRAINT `bolsistas_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `controlePagamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mesAno` varchar(7) NOT NULL,
	`status` enum('PENDENTE','SOLICITADO') NOT NULL DEFAULT 'PENDENTE',
	`numeroProcesso` varchar(100),
	`dataSolicitacao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `controlePagamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bolsistaId` int NOT NULL,
	`tipo` enum('FREQUENCIA','RELATORIO_FINAL') NOT NULL,
	`mesAno` varchar(7),
	`caminhoArquivo` text,
	`status` enum('PENDENTE','APROVADO','REPROVADO') NOT NULL DEFAULT 'PENDENTE',
	`justificativa` text,
	`cargaHorariaTotal` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projetos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`dataInicio` timestamp,
	`dataFim` timestamp,
	`cargaHorariaSemanal` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projetos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bolsistas` ADD CONSTRAINT `bolsistas_projetoId_projetos_id_fk` FOREIGN KEY (`projetoId`) REFERENCES `projetos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentos` ADD CONSTRAINT `documentos_bolsistaId_bolsistas_id_fk` FOREIGN KEY (`bolsistaId`) REFERENCES `bolsistas`(`id`) ON DELETE no action ON UPDATE no action;