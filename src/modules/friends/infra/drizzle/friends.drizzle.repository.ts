import { and, eq, inArray, not, or, sql } from "drizzle-orm";
import { AppError } from "@/errors/app.errors";
import { db } from "@/lib/db";
import { friendRequests } from "../../../../../drizzle/schema/friend-requests";
import { friends } from "../../../../../drizzle/schema/friends";
import { users } from "../../../../../drizzle/schema/users";
import type {
   Friends,
   FriendsRepository,
   RequestFriends,
} from "../../repositories/friends.repository";

export class FriendsDrizzleRepository implements FriendsRepository {
   async searchUsers({
      query,
      userId,
   }: {
      query: string;
      userId: string;
   }): Promise<Friends[]> {
      const usersDb = await db
         .select()
         .from(users)
         .where(not(eq(users.id, userId)));

      if (!usersDb || usersDb.length === 0) return [];

      const q = (query ?? "").trim().toLowerCase();

      const filtered = usersDb.filter((u) => {
         if (!q) return true;

         const name = u.name?.toLowerCase() ?? "";
         const display = u.displayName?.toLowerCase() ?? "";

         return name.includes(q) || display.includes(q);
      });

      return filtered.map((user) => ({
         id: user.id,
         name: user.name,
         displayName: user.displayName,
         level: user.level,
      })) as Friends[];
   }

   async findAll({ userId }: { userId: string }) {
      const friendships = await db
         .select()
         .from(friends)
         .where(or(eq(friends.userId, userId), eq(friends.friendId, userId)));

      if (!friendships) {
         return [];
      }

      const friendIds = friendships.map((friendship) =>
         friendship.userId === userId ? friendship.friendId : friendship.userId,
      );

      if (!friendIds) {
         return [];
      }

      const usersDb = await db
         .select()
         .from(users)
         .where(inArray(users.id, friendIds));

      const friendsArrayFilter = usersDb.map((friend) => ({
         id: friend.id,
         name: friend.name,
         displayName: friend.displayName,
         level: friend.level,
      }));

      return friendsArrayFilter as Friends[];
   }

   async listAllRequestFriends({ userId }: { userId: string }) {
      const requestFriends = await db
         .select()
         .from(friendRequests)
         .innerJoin(users, eq(users.id, friendRequests.senderId))
         .where(eq(friendRequests.receiverId, userId));

      const requestFriendsArrayFilter = requestFriends.map((friend) => ({
         requestFriendId: friend.friend_requests.id,
         name: friend.users.name,
         displayName: friend.users.displayName,
         createAt: friend.friend_requests.createdAt,
      }));

      return requestFriendsArrayFilter as RequestFriends[];
   }

   async requestFriend({
      senderId,
      receiverId,
   }: {
      senderId: string;
      receiverId: string;
   }) {
      await db.insert(friendRequests).values({ senderId, receiverId });
   }

   async acceptFriend({ requestFriendId }: { requestFriendId: string }) {
      await db.transaction(async (tx) => {
         const [requestFriend] = await tx
            .select()
            .from(friendRequests)
            .where(eq(friendRequests.id, requestFriendId));

         const [friend] = await tx
            .insert(friends)
            .values({
               userId: requestFriend?.senderId as string,
               friendId: requestFriend?.receiverId as string,
               totalDuel: 0,
            })
            .returning();

         if (!friend) {
            throw new AppError("Friend not found");
         }

         await tx
            .delete(friendRequests)
            .where(eq(friendRequests.id, requestFriendId));

         await tx
            .update(users)
            .set({
               friendsCount: sql`${users.friendsCount} + 1`,
            })
            .where(eq(users.id, friend.userId));
         await tx
            .update(users)
            .set({
               friendsCount: sql`${users.friendsCount} + 1`,
            })
            .where(eq(users.id, friend.friendId));
      });
   }

   async refuseRequestFriends({
      requestFriendId,
   }: {
      requestFriendId: string;
   }) {
      await db
         .delete(friendRequests)
         .where(eq(friendRequests.id, requestFriendId));
   }

   async listOneFriend({
      friendId,
      userId,
   }: {
      friendId: string;
      userId: string;
   }) {
      const friend = await db
         .select()
         .from(friends)
         .innerJoin(users, eq(users.id, friends.friendId))
         .where(
            and(eq(friends.friendId, friendId), eq(friends.userId, userId)),
         );

      if (!friend[0]) {
         return null;
      }

      return {
         id: friend[0].users.id,
         name: friend[0].users?.name as string,
         displayName: friend[0].users?.displayName,
         level: friend[0].users?.level as number,
      };
   }

   async findByIdRequestFriend(requestFriendId: string) {
      const requestFriend = await db
         .select()
         .from(friendRequests)
         .innerJoin(users, eq(users.id, friendRequests.receiverId))
         .where(eq(friendRequests.id, requestFriendId));

      if (!requestFriend[0]) {
         return null;
      }

      return {
         requestFriendId: requestFriend[0].friend_requests.id,
         name: requestFriend[0].users.name,
         displayName: requestFriend[0].users.displayName,
         createAt: requestFriend[0].friend_requests.createdAt,
      };
   }

   async listOneRequestFriends({
      userId,
      friendId,
   }: {
      userId: string;
      friendId: string;
   }) {
      const requestFriend = await db
         .select()
         .from(friendRequests)
         .innerJoin(users, eq(users.id, friendRequests.receiverId))
         .where(
            and(
               eq(friendRequests.senderId, userId),
               eq(friendRequests.receiverId, friendId),
            ),
         );

      if (!requestFriend[0]) {
         return null;
      }

      return {
         requestFriendId: requestFriend[0].friend_requests.id,
         name: requestFriend[0].users.name,
         displayName: requestFriend[0].users.displayName,
         createAt: requestFriend[0].friend_requests.createdAt,
      } as RequestFriends;
   }
}
