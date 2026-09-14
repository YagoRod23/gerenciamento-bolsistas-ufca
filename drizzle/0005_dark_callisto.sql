CREATE TABLE `horarios_previstos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bolsista_id` int NOT NULL,
	`dia_semana` enum('segunda','terca','quarta','quinta','sexta','sabado','domingo') NOT NULL,
	`hora_inicio` varchar(5) NOT NULL,
	`hora_fim` varchar(5) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `horarios_previstos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `horarios_previstos` ADD CONSTRAINT `horarios_previstos_bolsista_id_bolsistas_id_fk` FOREIGN KEY (`bolsista_id`) REFERENCES `bolsistas`(`id`) ON DELETE cascade ON UPDATE no action;