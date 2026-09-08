import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const friendRequests = pgTable("friend_requests", {
   id: uuid("id").defaultRandom().primaryKey(),

   senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),

   receiverId: uuid("receiver_id")
      .notNull()
      .references(() => users.id),

   createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
   sender: one(users, {
      fields: [friendRequests.senderId],
      references: [users.id],
      relationName: "sentFriendRequests",
   }),

   receiver: one(users, {
      fields: [friendRequests.receiverId],
      references: [users.id],
      relationName: "receivedFriendRequests",
   }),
}));
