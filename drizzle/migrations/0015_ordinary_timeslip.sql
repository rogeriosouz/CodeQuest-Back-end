ALTER TABLE "challenges" ADD COLUMN "isCode" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "code" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "language" varchar(255);