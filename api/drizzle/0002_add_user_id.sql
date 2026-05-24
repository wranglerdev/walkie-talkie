ALTER TABLE `items` ADD COLUMN `user_id` text NOT NULL DEFAULT '';
CREATE INDEX `idx_items_user_id` ON `items` (`user_id`);
