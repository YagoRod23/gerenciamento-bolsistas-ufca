ALTER TABLE `documentos` ADD `statusDocumento` enum('PENDENTE','APROVADO','REPROVADO') DEFAULT 'PENDENTE' NOT NULL;--> statement-breakpoint
ALTER TABLE `documentos` ADD `analiseIA` text;--> statement-breakpoint
ALTER TABLE `documentos` DROP COLUMN `status`;