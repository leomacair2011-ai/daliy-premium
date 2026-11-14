CREATE TABLE `support_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`request_id` text NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `support_threads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `support_messages_thread` ON `support_messages` (`thread_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `support_message_retry` ON `support_messages` (`thread_id`,`request_id`);--> statement-breakpoint
CREATE TABLE `support_presence` (
	`id` text PRIMARY KEY NOT NULL,
	`available` integer DEFAULT 0 NOT NULL,
	`last_seen` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `support_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_key` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`owner_read_at` integer DEFAULT 0 NOT NULL,
	`visitor_read_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `support_visitor` ON `support_threads` (`visitor_key`);--> statement-breakpoint
CREATE INDEX `support_updated` ON `support_threads` (`updated_at`);