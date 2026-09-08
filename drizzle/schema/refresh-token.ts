import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const refreshToken = pgTable("refresh_token", {
   id: uuid("id").defaultRandom().primaryKey(),

   tokenHash: text("token_hash"),

   userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

   expiresAt: timestamp("expires_at").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refreshTokenRelations = relations(refreshToken, ({ one }) => ({
   user: one(users, {
      fields: [refreshToken.userId],
      references: [users.id],
   }),
}));
