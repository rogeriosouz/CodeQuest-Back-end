import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const friends = pgTable("friends", {
   id: uuid("id").defaultRandom().primaryKey(),
   totalDuel: integer("total_duel"),

   friendId: uuid("friend_id")
      .notNull()
      .references(() => users.id),

   userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

   createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendRelations = relations(friends, ({ one }) => ({
   friend: one(users, {
      fields: [friends.friendId],
      references: [users.id],
      relationName: "friend",
   }),

   user: one(users, {
      fields: [friends.userId],
      references: [users.id],
      relationName: "user",
   }),
}));
