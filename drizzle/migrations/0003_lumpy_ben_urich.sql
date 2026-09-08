CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracks_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(255) NOT NULL,
	"isCode" boolean DEFAULT true,
	"code" text DEFAULT '',
	"tips" text[] DEFAULT '{}' NOT NULL,
	"alternatives" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_tracks_id_tracks_id_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;