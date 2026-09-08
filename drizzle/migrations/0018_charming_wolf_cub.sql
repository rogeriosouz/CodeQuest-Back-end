CREATE TYPE "public"."duel_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TABLE "duel_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"duel_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"language" text,
	"difficulty" "duel_difficulty" NOT NULL,
	"total_challenges" integer,
	"total_challenges_completed" integer,
	"total_time" integer,
	"winner_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "duel_challenges" ADD CONSTRAINT "duel_challenges_duel_id_duels_id_fk" FOREIGN KEY ("duel_id") REFERENCES "public"."duels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duel_challenges" ADD CONSTRAINT "duel_challenges_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;