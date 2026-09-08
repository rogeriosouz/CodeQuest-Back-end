CREATE TABLE "challenge_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"language_code" varchar(255) DEFAULT 'javascript' NOT NULL,
	"function_name" varchar(255) NOT NULL,
	"test_cases" jsonb DEFAULT '[]'::jsonb,
	"starter_code" text DEFAULT '',
	"time_limit_ms" integer DEFAULT 3000 NOT NULL,
	"memory_limit_mb" integer DEFAULT 128 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_code_challenge_id_unique" UNIQUE("challenge_id")
);
--> statement-breakpoint
ALTER TABLE "challenge_code" ADD CONSTRAINT "challenge_code_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN "language_code";--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN "code";