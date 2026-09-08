import { eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { calculateLevel } from "@/shared/utils/calculate-level";
import { challenges } from "../../../../../drizzle/schema/challenge";
import { tracks } from "../../../../../drizzle/schema/tracks";
import { userTrackProgress } from "../../../../../drizzle/schema/user-track-progress";
import { users } from "../../../../../drizzle/schema/users";
import type {
   PaginatedUsers,
   User,
   UserRepository,
} from "../../repositories/user.repository";

export class UserDrizzleRepository implements UserRepository {
   async findByDisplayName(displayName: string): Promise<null | User> {
      const user = await db
         .select()
         .from(users)
         .where(eq(users.displayName, displayName));

      if (!user[0]) {
         return null;
      }

      const [result] = await db
         .select({
            totalXp: sql<number>`COALESCE(SUM(${challenges.points}), 0)`,
         })
         .from(challenges);

      const { currentXp, xpToNextLevel, progressPercentage } = calculateLevel(
         user[0].xp,
         result?.totalXp ?? 0,
      );

      return {
         ...user[0],
         totalXpApp: result?.totalXp ?? 0,
         currentXpInLevel: currentXp,
         xpForNextLevel: xpToNextLevel,
         progressPercentage,
      };
   }

   async findById(userId: string): Promise<null | User> {
      const user = await db.select().from(users).where(eq(users.id, userId));

      if (!user[0]) {
         return null;
      }

      const [result] = await db
         .select({
            totalXp: sql<number>`COALESCE(SUM(${challenges.points}), 0)`,
         })
         .from(challenges);

      const { currentXp, xpToNextLevel, progressPercentage } = calculateLevel(
         user[0].xp,
         result?.totalXp ?? 0,
      );

      return {
         ...user[0],
         totalXpApp: result?.totalXp ?? 0,
         currentXpInLevel: currentXp,
         xpForNextLevel: xpToNextLevel,
         progressPercentage,
      };
   }

   async findByEmail(email: string): Promise<null | User> {
      const user = await db.select().from(users).where(eq(users.email, email));

      if (!user[0]) {
         return null;
      }

      const [result] = await db
         .select({
            totalXp: sql<number>`COALESCE(SUM(${challenges.points}), 0)`,
         })
         .from(challenges);

      const { currentXp, xpToNextLevel, progressPercentage } = calculateLevel(
         user[0].xp,
         result?.totalXp ?? 0,
      );
      return {
         ...user[0],
         totalXpApp: result?.totalXp ?? 0,
         currentXpInLevel: currentXp,
         xpForNextLevel: xpToNextLevel,
         progressPercentage,
      };
   }

   async findAllAdmin({
      search,
      page,
      perPage,
   }: {
      search?: string;
      page: number;
      perPage: number;
   }): Promise<PaginatedUsers> {
      const offset = (page - 1) * perPage;

      const whereCondition = search
         ? or(
              ilike(users.name, `%${search}%`),
              ilike(users.email, `%${search}%`),
              ilike(users.displayName, `%${search}%`),
           )
         : undefined;

      const [countResult] = await db
         .select({ count: sql<number>`count(*)`.mapWith(Number) })
         .from(users)
         .where(whereCondition);

      const total = countResult?.count ?? 0;

      const usersDb = await db
         .select({
            id: users.id,
            name: users.name,
            email: users.email,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            bio: users.bio,
            xp: users.xp,
            level: users.level,
            rankPoints: users.rankPoints,
            challengesCompleted: users.challengesCompleted,
            challengesFailed: users.challengesFailed,
            wins: users.wins,
            losses: users.losses,
            draws: users.draws,
            streakDays: users.streakDays,
            lastActiveAt: users.lastActiveAt,
            friendsCount: users.friendsCount,
            isPremium: users.isPremium,
            premiumUntil: users.premiumUntil,
            isAdmin: users.isAdmin,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
         })
         .from(users)
         .where(whereCondition)
         .limit(perPage)
         .offset(offset)
         .orderBy(users.createdAt);

      return {
         users: usersDb as Omit<User, "passwordHash">[],
         total,
         page,
         perPage,
         totalPages: Math.ceil(total / perPage),
      };
   }

   async create({
      name,
      email,
      passwordHash,
   }: {
      name: string;
      email: string;
      passwordHash: string;
   }): Promise<User> {
      const user = await db
         .insert(users)
         .values({ name, email, passwordHash })
         .returning();

      const tracksDb = await db.select().from(tracks);

      if (tracksDb[0] && user[0]) {
         const createProgressTracks = tracksDb.map(async (track) => {
            await db
               .insert(userTrackProgress)
               .values({ trackId: track.id, userId: user[0]?.id as string });
         });

         await Promise.all(createProgressTracks);
      }

      return user[0] as User;
   }

   async update({
      userId,
      name,
      email,
      displayName,
      bio,
      isPremium,
      avatarUrl,
      isAdmin,
      level,
      xp,
      streakDays,
      rankPoints,
   }: {
      userId: string;
      name?: string | undefined;
      email?: string | undefined;
      displayName?: string | undefined;
      bio?: string | undefined;
      isPremium?: boolean | undefined;
      avatarUrl?: string | undefined;
      isAdmin?: boolean | undefined;
      level?: number | undefined;
      xp?: number | undefined;
      streakDays?: number | undefined;
      rankPoints?: number | undefined;
   }): Promise<User> {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const data: any = {};

      if (name !== undefined) data.name = name;
      if (email !== undefined) data.email = email;
      if (displayName !== undefined) data.displayName = displayName;
      if (bio !== undefined) data.bio = bio;
      if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
      if (isPremium !== undefined) data.isPremium = isPremium;
      if (isAdmin !== undefined) data.isAdmin = isAdmin;
      if (level !== undefined) data.level = level;
      if (xp !== undefined) data.xp = xp;
      if (streakDays !== undefined) data.streakDays = streakDays;
      if (rankPoints !== undefined) data.rankPoints = rankPoints;
      data.updatedAt = new Date();

      const user = await db
         .update(users)
         .set(data)
         .where(eq(users.id, userId))
         .returning();

      return user[0] as User;
   }

   async updatePassword({
      passwordHash,
      userId,
   }: {
      passwordHash: string;
      userId: string;
   }): Promise<User> {
      const user = await db
         .update(users)
         .set({ passwordHash })
         .where(eq(users.id, userId))
         .returning();

      return user[0] as User;
   }
}
