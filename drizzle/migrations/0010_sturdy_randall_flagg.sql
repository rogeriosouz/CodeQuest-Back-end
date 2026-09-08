ALTER TABLE "tracks" ADD COLUMN "difficulty" varchar(255);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "language" varchar(255) DEFAULT 'javascript' NOT NULL;