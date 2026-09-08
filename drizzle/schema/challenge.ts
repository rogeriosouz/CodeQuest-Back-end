import { relations } from "drizzle-orm";
import {
   boolean,
   integer,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
   varchar,
} from "drizzle-orm/pg-core";
import { challengeCode } from "./challenge-code";
import { tracks } from "./tracks";

export const challenges = pgTable("challenges", {
   id: uuid("id").defaultRandom().primaryKey(),

   tracksId: uuid("tracks_id")
      .notNull()
      .references(() => tracks.id),
   name: varchar("name", { length: 255 }).notNull(),
   slug: varchar("slug", { length: 255 }).notNull().unique(),
   description: text("description"),
   points: integer("points").notNull(),
   difficulty: varchar("difficulty", { length: 255 }).notNull(),
   type: varchar("type", { length: 255 }).notNull(),
   isCode: boolean("isCode").default(true),
   tips: text("tips").array().default([]).notNull(),
   alternatives: jsonb("alternatives")
      .$type<{ text: string; isCorrect: boolean }[]>()
      .default([]),
   code: text("code").default(""),
   language: varchar("language", { length: 255 }),

   isActive: boolean("is_active").default(true),

   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const challengesRelations = relations(challenges, ({ one }) => ({
   tracks: one(tracks, {
      fields: [challenges.tracksId],
      references: [tracks.id],
   }),
   codeChallenge: one(challengeCode, {
      fields: [challenges.id],
      references: [challengeCode.challengeId],
   }),
}));
