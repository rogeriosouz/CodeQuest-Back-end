CREATE TYPE "public"."duel_status" AS ENUM('PENDING', 'ACTIVE', 'FINISHED', 'FORFEITED');--> statement-breakpoint
ALTER TABLE "duels" ADD COLUMN "forfeited_id" uuid;--> statement-breakpoint
ALTER TABLE "duels" ADD COLUMN "status" "duel_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "duels" ADD CONSTRAINT "duels_forfeited_id_users_id_fk" FOREIGN KEY ("forfeited_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;