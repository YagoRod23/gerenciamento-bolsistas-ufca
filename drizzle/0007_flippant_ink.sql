CREATE TABLE `coordenador_projetos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coordenadorId` int NOT NULL,
	`projetoId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coordenador_projetos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coordenadores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`usuario` varchar(100) NOT NULL,
	`senha` varchar(255) NOT NULL,
	`isSuperAdmin` enum('true','false') NOT NULL DEFAULT 'false',
	`ativo` enum('true','false') NOT NULL DEFAULT 'true',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coordenadores_id` PRIMARY KEY(`id`),
	CONSTRAINT `coordenadores_email_unique` UNIQUE(`email`),
	CONSTRAINT `coordenadores_usuario_unique` UNIQUE(`usuario`)
);
--> statement-breakpoint
ALTER TABLE `coordenador_projetos` ADD CONSTRAINT `coordenador_projetos_coordenadorId_coordenadores_id_fk` FOREIGN KEY (`coordenadorId`) REFERENCES `coordenadores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coordenador_projetos` ADD CONSTRAINT `coordenador_projetos_projetoId_projetos_id_fk` FOREIGN KEY (`projetoId`) REFERENCES `projetos`(`id`) ON DELETE cascade ON UPDATE no action;