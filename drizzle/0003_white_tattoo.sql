CREATE TABLE `historico_alteracoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`entidade` varchar(50) NOT NULL,
	`entidade_id` int NOT NULL,
	`acao` enum('criar','editar','excluir','aprovar','reprovar') NOT NULL,
	`descricao` text NOT NULL,
	`dados_antigos` text,
	`dados_novos` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_alteracoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `horarios_previstos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bolsista_id` int NOT NULL,
	`dia_semana` enum('segunda','terca','quarta','quinta','sexta','sabado','domingo') NOT NULL,
	`hora_inicio` varchar(5) NOT NULL,
	`hora_fim` varchar(5) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `horarios_previstos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `historico_alteracoes` ADD CONSTRAINT `historico_alteracoes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `horarios_previstos` ADD CONSTRAINT `horarios_previstos_bolsista_id_bolsistas_id_fk` FOREIGN KEY (`bolsista_id`) REFERENCES `bolsistas`(`id`) ON DELETE cascade ON UPDATE no action;