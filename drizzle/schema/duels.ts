import { relations } from "drizzle-orm";
import {
   integer,
   jsonb,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { challenges } from "./challenge";
import { users } from "./users";

export const duelDifficultyEnum = pgEnum("duel_difficulty", [
   "easy",
   "medium",
   "hard",
]);

export const duelStatusEnum = pgEnum("duel_status", [
   "PENDING",
   "ACTIVE",
   "FINISHED",
   "FORFEITED",
]);

export const duels = pgTable("duels", {
   id: uuid("id").defaultRandom().primaryKey(),

   senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),

   receiverId: uuid("receiver_id")
      .notNull()
      .references(() => users.id),

   receiverName: text("receiver_name"),
   senderName: text("sender_name"),

   language: text("language"),
   difficulty: duelDifficultyEnum("difficulty").notNull(),
   totalChallenges: integer("total_challenges"),
   totalChallengesCompletedSenderId: integer(
      "total_challenges_completed_sender_id",
   ),
   totalChallengesCompletedReceiverId: integer(
      "total_challenges_completed_receiver_id",
   ),

   challengesCompletedSenderId: jsonb("challenges_completed_sender_id")
      .$type<{ challengeId: string; isCorrect: boolean }[]>()
      .default([]),

   challengesCompletedReceiverId: jsonb("challenges_completed_receiver_id")
      .$type<{ challengeId: string; isCorrect: boolean }[]>()
      .default([]),

   totalTime: integer("total_time"),

   winnerId: uuid("winner_id").references(() => users.id),
   forfeitedId: uuid("forfeited_id").references(() => users.id),

   status: duelStatusEnum("status").default("PENDING").notNull(),
   startAt: timestamp("start_at"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   expiredAt: timestamp("expired_at"),
});

export const duelChallenges = pgTable("duel_challenges", {
   id: uuid("id").defaultRandom().primaryKey(),

   duelId: uuid("duel_id")
      .notNull()
      .references(() => duels.id),

   challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id),

   order: integer("order").notNull(),
});

export const duelChallengesRelations = relations(duelChallenges, ({ one }) => ({
   duel: one(duels, {
      fields: [duelChallenges.duelId],
      references: [duels.id],
   }),

   challenge: one(challenges, {
      fields: [duelChallenges.challengeId],
      references: [challenges.id],
   }),
}));

export const duelRelations = relations(duels, ({ one, many }) => ({
   sender: one(users, {
      fields: [duels.senderId],
      references: [users.id],
      relationName: "duelSender",
   }),

   receiver: one(users, {
      fields: [duels.receiverId],
      references: [users.id],
      relationName: "duelReceiver",
   }),

   winner: one(users, {
      fields: [duels.winnerId],
      references: [users.id],
      relationName: "duelWinner",
   }),

   forfeitedId: one(users, {
      fields: [duels.forfeitedId],
      references: [users.id],
      relationName: "duelForfeitedId",
   }),

   challenges: many(duelChallenges),
}));
