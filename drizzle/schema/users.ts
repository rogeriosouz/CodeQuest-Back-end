import { relations } from "drizzle-orm";
import {
   boolean,
   integer,
   pgTable,
   text,
   timestamp,
   uuid,
   varchar,
} from "drizzle-orm/pg-core";
import { duels } from "./duels";
import { friends } from "./friends";
import { refreshToken } from "./refresh-token";
import { userTrackProgress } from "./user-track-progress";

export const users = pgTable("users", {
   id: uuid("id").defaultRandom().primaryKey(),
   name: varchar("name", { length: 255 }).notNull(),
   email: varchar("email", { length: 255 }).notNull().unique(),
   passwordHash: varchar("password_hash", { length: 255 }).notNull(),

   // 👤 Perfil
   displayName: varchar("display_name", { length: 255 }),
   avatarUrl: text("avatar_url"),
   bio: text("bio"),

   // 🎮 Progressão
   xp: integer("xp").default(0).notNull(),
   level: integer("level").default(1).notNull(),
   rankPoints: integer("rank_points").default(0).notNull(),

   // 🏆 Estatísticas
   challengesCompleted: integer("challenges_completed").default(0).notNull(),
   challengesFailed: integer("challenges_failed").default(0).notNull(),

   wins: integer("wins").default(0).notNull(),
   losses: integer("losses").default(0).notNull(),
   draws: integer("draws").default(0).notNull(),

   // Atividade
   streakDays: integer("streak_days").default(0).notNull(),
   lastActiveAt: timestamp("last_active_at"),

   // Social
   friendsCount: integer("friends_count").default(0).notNull(),

   // Monetização
   isPremium: boolean("is_premium").default(false).notNull(),
   premiumUntil: timestamp("premium_until"),
   isAdmin: boolean("is_admin").default(false).notNull(),

   // Sistema
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
   refreshTokens: many(refreshToken),
}));

export const userTrackProgressTRelations = relations(users, ({ many }) => ({
   trackProgress: many(userTrackProgress),
}));

export const usersRelationsFriends = relations(users, ({ many }) => ({
   friends: many(friends, {
      relationName: "user",
   }),

   addedAsFriend: many(friends, {
      relationName: "friend",
   }),
}));

export const usersRelationsDuels = relations(users, ({ many }) => ({
   sentDuels: many(duels, {
      relationName: "duelSender",
   }),

   receivedDuels: many(duels, {
      relationName: "duelReceiver",
   }),

   wonDuels: many(duels, {
      relationName: "duelWinner",
   }),
}));
