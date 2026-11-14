CREATE TABLE `catalogue_products` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_media` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`items_json` text NOT NULL,
	`total_pence` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`ip_hash` text NOT NULL,
	`stripe_session_id` text,
	`customer_json` text,
	`paid_at` integer,
	`fulfilment` text DEFAULT 'unfulfilled' NOT NULL,
	`tracking` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_stripe_session` ON `orders` (`stripe_session_id`);--> statement-breakpoint
CREATE INDEX `order_created` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `order_ip_created` ON `orders` (`ip_hash`,`created_at`);