ALTER TABLE `items` ADD COLUMN `project_id` text;

CREATE TABLE IF NOT EXISTS `context_people` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `name` text NOT NULL,
  `expires_at` integer,
  `created_at` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `idx_context_people_user_id` ON `context_people` (`user_id`);

CREATE TABLE IF NOT EXISTS `context_projects` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `name` text NOT NULL,
  `active` integer NOT NULL DEFAULT 1,
  `created_at` integer NOT NULL
);
CREATE INDEX IF NOT EXISTS `idx_context_projects_user_id` ON `context_projects` (`user_id`);

CREATE TABLE IF NOT EXISTS `item_people` (
  `id` text PRIMARY KEY NOT NULL,
  `item_id` text NOT NULL,
  `person_id` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `idx_item_people_item_id` ON `item_people` (`item_id`);
CREATE INDEX IF NOT EXISTS `idx_item_people_person_id` ON `item_people` (`person_id`);
