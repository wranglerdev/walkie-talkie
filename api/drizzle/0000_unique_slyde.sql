CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`transcript` text NOT NULL,
	`audio_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`due_date` integer,
	`completed` integer,
	`paid` integer,
	`metadata` text
);
