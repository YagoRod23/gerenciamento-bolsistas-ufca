ALTER TABLE `projetos` MODIFY COLUMN `dataInicio` date;--> statement-breakpoint
ALTER TABLE `projetos` MODIFY COLUMN `dataFim` date;--> statement-breakpoint
ALTER TABLE `projetos` ADD `ano` int NOT NULL;--> statement-breakpoint
ALTER TABLE `projetos` ADD `cargaHoraria` int;--> statement-breakpoint
ALTER TABLE `projetos` DROP COLUMN `cargaHorariaSemanal`;