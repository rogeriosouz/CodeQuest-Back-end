import { relations } from "drizzle-orm";
import {
   boolean,
   integer,
   jsonb,
   pgTable,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { tracks } from "./tracks";
import { users } from "./users";

export const userTrackProgress = pgTable("user_track_progress", {
   id: uuid("id").defaultRandom().primaryKey(),

   userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

   trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id),

   points: integer("total_points").default(0),

   completedChallenges: integer("completed_challenges").default(0),
   totalChallenges: integer("total_challenges").default(0),

   progressPercentage: integer("progress_percentage").default(0),

   isCompleted: boolean("is_completed").default(false),

   lastActivityAt: timestamp("last_activity_at"),

   challengesCompleted: jsonb("challenges_completed")
      .$type<{ challengeId: string }[]>()
      .default([]),

   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userTrackProgressRelations = relations(
   userTrackProgress,
   ({ one }) => ({
      user: one(users, {
         fields: [userTrackProgress.userId],
         references: [users.id],
      }),
      track: one(tracks, {
         fields: [userTrackProgress.trackId],
         references: [tracks.id],
      }),
   }),
);
