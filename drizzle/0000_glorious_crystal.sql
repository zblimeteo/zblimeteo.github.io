CREATE TABLE IF NOT EXISTS `unique_visitors_v3` (
	`visitor_key` text PRIMARY KEY NOT NULL,
	`visited_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`country_code` text,
	`country` text,
	`city` text,
	`latitude` real,
	`longitude` real,
	`path` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `visitor_country_sources` (
	`visitor_key` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`recorded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`visitor_key`) REFERENCES `unique_visitors_v3`(`visitor_key`) ON UPDATE no action ON DELETE no action
);
