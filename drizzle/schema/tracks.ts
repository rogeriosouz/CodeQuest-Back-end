import { relations } from "drizzle-orm";
import {
   boolean,
   pgTable,
   text,
   timestamp,
   uuid,
   varchar,
} from "drizzle-orm/pg-core";
import { challenges } from "./challenge";
import { userTrackProgress } from "./user-track-progress";

export const tracks = pgTable("tracks", {
   id: uuid("id").defaultRandom().primaryKey(),

   name: varchar("name", { length: 255 }).notNull(),
   slug: varchar("slug", { length: 255 }).notNull().unique(),
   description: text("description"),

   icon: varchar("icon", { length: 100 }),
   color: varchar("color", { length: 20 }),
   difficulty: varchar("difficulty", { length: 255 }),
   language: varchar("language", { length: 255 })
      .notNull()
      .default("javascript"),
   isActive: boolean("is_active").default(true),

   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tracksRelations = relations(tracks, ({ many }) => ({
   trackProgress: many(userTrackProgress),
}));

export const tracksRelationsChallenges = relations(tracks, ({ many }) => ({
   challenges: many(challenges),
}));
