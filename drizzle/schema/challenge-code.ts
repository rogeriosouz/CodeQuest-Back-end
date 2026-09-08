import { relations } from "drizzle-orm";
import {
   integer,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
   varchar,
} from "drizzle-orm/pg-core";
import { challenges } from "./challenge";

export const challengeCode = pgTable("challenge_code", {
   id: uuid("id").defaultRandom().primaryKey(),
   challengeId: uuid("challenge_id")
      .notNull()
      .unique()
      .references(() => challenges.id, { onDelete: "cascade" }),
   languageCode: varchar("language_code", { length: 255 })
      .notNull()
      .default("javascript"),
   functionName: varchar("function_name", { length: 255 }).notNull(),
   testCases: jsonb("test_cases")
      .$type<
         {
            input: unknown[];
            expectedOutput: unknown;
            isHidden?: boolean | undefined;
         }[]
      >()
      .default([]),
   starterCode: text("starter_code").default(""),

   timeLimitMs: integer("time_limit_ms").default(3000).notNull(),
   memoryLimitMb: integer("memory_limit_mb").default(128).notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challengeCodeRelations = relations(challengeCode, ({ one }) => ({
   challenge: one(challenges, {
      fields: [challengeCode.challengeId],
      references: [challenges.id],
   }),
}));
