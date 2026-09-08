ALTER TABLE "duels" ADD COLUMN "total_challenges_completed_sender_id" integer;--> statement-breakpoint
ALTER TABLE "duels" ADD COLUMN "total_challenges_completed_receiver_id" integer;--> statement-breakpoint
ALTER TABLE "duels" DROP COLUMN "total_challenges_completed";