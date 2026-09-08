import { and, eq, gt, ne, or, sql } from "drizzle-orm";
import { AppError } from "@/errors/app.errors";
import { db } from "@/lib/db";
import { io } from "@/lib/socket";
import { runCodeJs } from "@/shared/utils/run-code-js";
import { challenges } from "../../../../../drizzle/schema/challenge";
import { challengeCode } from "../../../../../drizzle/schema/challenge-code";
import { duelChallenges, duels } from "../../../../../drizzle/schema/duels";
import { friends } from "../../../../../drizzle/schema/friends";
import { users } from "../../../../../drizzle/schema/users";
import type {
   CreateDuelRequest,
   Duels,
   DuelsRepository,
} from "../../repositories/duels.repository";

export class DuelsDrizzleRepository implements DuelsRepository {
   async createDuel({
      friendId,
      userId,
      difficulty,
      language,
      totalChallenges,
      receiverName,
      senderName,
   }: CreateDuelRequest) {
      const difficultyOrder = {
         easy: ["easy"],
         medium: ["medium", "easy"],
         hard: ["hard", "medium", "easy"],
      } as const;

      const difficulties = difficultyOrder[difficulty];

      const challengesDb: (typeof challenges.$inferSelect)[] = [];

      for (const currentDifficulty of difficulties) {
         const remaining = totalChallenges - challengesDb.length;

         if (remaining <= 0) break;

         const currentChallenges = await db
            .select()
            .from(challenges)
            .where(
               and(
                  eq(challenges.language, language),
                  eq(challenges.difficulty, currentDifficulty),
               ),
            )
            .orderBy(sql`RANDOM()`)
            .limit(remaining);

         challengesDb.push(...currentChallenges);
      }

      type Difficulty = "easy" | "medium" | "hard";
      const timePerDifficulty: Record<Difficulty, number> = {
         easy: 1 * 60 * 1000, // 1 minuto
         medium: 90 * 1000, // 1 minuto e 30
         hard: 2 * 60 * 1000, // 2 minutos
      };

      let totalTimeMs = 0;

      for (const challenge of challengesDb) {
         totalTimeMs += timePerDifficulty[challenge.difficulty as Difficulty];
      }

      const expiredAt = new Date(Date.now() + 1 * 60 * 1000); // 1 m
      const duelsDb = await db
         .insert(duels)
         .values({
            difficulty,
            senderId: userId,
            receiverId: friendId,
            expiredAt: expiredAt,
            language,
            totalChallenges,
            totalTime: totalTimeMs,
            receiverName,
            senderName,
         })
         .returning();

      await db.insert(duelChallenges).values(
         challengesDb.map((challenge, index) => ({
            duelId: duelsDb[0]?.id as string,
            challengeId: challenge.id,
            order: index + 1,
         })),
      );

      return duelsDb[0] as Duels;
   }

   async findByDuelIsCreatedByFriendId({
      userId,
      friendId,
   }: {
      userId: string;
      friendId: string;
   }): Promise<Duels | null> {
      const duelsDb = await db
         .select()
         .from(duels)
         .where(
            and(eq(duels.senderId, userId), eq(duels.receiverId, friendId)),
         );

      if (!duelsDb[0]) {
         return null;
      }

      return duelsDb[0] as Duels;
   }

   async findByUserId({ userId }: { userId: string }) {
      const now = new Date();

      const duelsDb = await db
         .select()
         .from(duels)
         .where(
            and(
               // O usuário participa do duelo
               or(eq(duels.senderId, userId), eq(duels.receiverId, userId)),

               // Não mostrar PENDING expirado
               or(ne(duels.status, "PENDING"), gt(duels.expiredAt, now)),

               // Não mostrar FINISHED
               or(ne(duels.status, "FINISHED")),

               // Não mostrar FORFEITED
               or(ne(duels.status, "FORFEITED")),
            ),
         );

      if (!duelsDb[0]) {
         return [];
      }

      return duelsDb as Duels[];
   }

   async userGiveUp({ userId, duelsId }: { userId: string; duelsId: string }) {
      await db.transaction(async (tx) => {
         const duelsDb = await tx
            .update(duels)
            .set({ forfeitedId: userId, status: "FORFEITED" })
            .where(
               and(
                  eq(duels.id, duelsId),
                  or(eq(duels.receiverId, userId), eq(duels.senderId, userId)),
               ),
            )
            .returning();

         await tx
            .update(users)
            .set({
               losses: sql`${users.losses} + 1`,
            })
            .where(eq(users.id, userId));

         if (duelsDb[0] && duelsDb[0].senderId === userId) {
            await tx
               .update(users)
               .set({
                  wins: sql`${users.losses} + 1`,
               })
               .where(eq(users.id, duelsDb[0]?.receiverId as string));
         }

         if (duelsDb[0] && duelsDb[0].receiverId === userId) {
            await tx
               .update(users)
               .set({
                  wins: sql`${users.losses} + 1`,
               })
               .where(eq(users.id, duelsDb[0]?.senderId as string));
         }
      });
   }

   async refuseDuel({ duelsId }: { duelsId: string }) {
      await db.transaction(async (tx) => {
         await tx
            .delete(duelChallenges)
            .where(eq(duelChallenges.duelId, duelsId));

         await tx.delete(duels).where(eq(duels.id, duelsId));
      });
   }

   async acceptDuel({ duelsId, userId }: { duelsId: string; userId: string }) {
      const startAt = new Date();

      await db.transaction(async (tx) => {
         const [duel] = await tx
            .update(duels)
            .set({ expiredAt: null, status: "ACTIVE", startAt: startAt })
            .where(and(eq(duels.id, duelsId), eq(duels.receiverId, userId)))
            .returning();

         if (!duel) {
            throw new AppError("Duel not found");
         }

         const friendId =
            duel.receiverId === userId ? duel.senderId : duel.receiverId;

         await tx
            .update(friends)
            .set({
               totalDuel: sql`${friends.totalDuel} + 1`,
            })
            .where(
               or(
                  and(
                     eq(friends.userId, userId),
                     eq(friends.friendId, friendId),
                  ),

                  and(
                     eq(friends.userId, friendId),
                     eq(friends.friendId, userId),
                  ),
               ),
            );
      });
   }

   async duelExpired({
      duelsId,
      winnerId,
   }: {
      duelsId: string;
      winnerId: string | null;
   }) {
      await db.transaction(async (tx) => {
         const [duel] = await tx
            .update(duels)
            .set({
               status: "FINISHED",
               winnerId,
            })
            .where(eq(duels.id, duelsId))
            .returning();

         if (!duel) {
            throw new AppError("Error duel not found");
         }

         if (winnerId) {
            await tx
               .update(users)
               .set({
                  wins: sql`${users.losses} + 1`,
               })
               .where(eq(users.id, winnerId));

            const friendId =
               duel.receiverId === winnerId ? duel.senderId : duel.receiverId;

            await tx
               .update(users)
               .set({
                  losses: sql`${users.losses} + 1`,
               })
               .where(eq(users.id, friendId));
         }

         await tx
            .update(users)
            .set({
               draws: sql`${users.losses} + 1`,
            })
            .where(eq(users.id, duel.receiverId));

         await tx
            .update(users)
            .set({
               draws: sql`${users.losses} + 1`,
            })
            .where(eq(users.id, duel.senderId));
      });
   }

   async findOneDuel({ duelsId, userId }: { duelsId: string; userId: string }) {
      const duelDb = await db
         .select({
            duel: duels,
            duelChallenge: duelChallenges,
            challenge: challenges,
            challengeCode: challengeCode,
         })
         .from(duels)
         .leftJoin(duelChallenges, eq(duels.id, duelChallenges.duelId))
         .leftJoin(challenges, eq(duelChallenges.challengeId, challenges.id))
         .leftJoin(challengeCode, eq(challenges.id, challengeCode.challengeId))
         .where(
            and(
               eq(duels.id, duelsId),
               or(eq(duels.receiverId, userId), eq(duels.senderId, userId)),
            ),
         );

      if (duelDb.length === 0) {
         return null;
      }

      const duel = {
         ...duelDb[0]?.duel,

         challenges: duelDb
            .sort(
               (a, b) =>
                  (a.duelChallenge?.order ?? 0) - (b.duelChallenge?.order ?? 0),
            )
            .map((item) => ({
               ...item.challenge,

               challengeCode: item.challengeCode,
            })),
      };

      return duel as Duels;
   }

   async completeDuel({
      duelsId,
      results,
      userIs,
   }: {
      duelsId: string;
      userId: string;
      userIs: "receiverId" | "senderId";
      results: { challengeSlug: string; res: string }[];
   }) {
      const addNewResults = results.map(async (result) => {
         const [challenge] = await db
            .select()
            .from(challenges)
            .leftJoin(
               challengeCode,
               eq(challengeCode.challengeId, challenges.id),
            )
            .where(eq(challenges.slug, result.challengeSlug));

         if (!challenge) {
            throw new AppError("Challenge Not found", 404);
         }

         if (challenge.challenges.type === "code") {
            if (challenge.challenge_code?.languageCode === "javascript") {
               const resultCode = await runCodeJs({
                  code: result.res,
                  functionName: challenge.challenge_code.functionName,
                  testCases: challenge.challenge_code.testCases ?? [],
               });

               return {
                  challengeId: challenge.challenges.id,
                  isCorrect: resultCode.success,
               };
            }
         }

         if (challenge.challenges.type === "quiz") {
            const challengeAlternative =
               challenge.challenges.alternatives?.find(
                  (c) => c.text === result.res,
               );

            const isValidResult = challengeAlternative
               ? challengeAlternative.isCorrect
               : false;

            return {
               challengeId: challenge.challenges.id as string,
               isCorrect: isValidResult,
            };
         }

         return {
            challengeId: challenge.challenges.id,
            isCorrect: false,
         };
      });

      const resultsFilter = await Promise.all(addNewResults);

      let isCompleted = false;
      let winnerId: string | null = null;

      if (userIs === "receiverId") {
         const [duel] = await db
            .update(duels)
            .set({
               challengesCompletedReceiverId: resultsFilter,
            })
            .where(eq(duels.id, duelsId))
            .returning();

         if (!duel) {
            throw new AppError("Duels Not found", 404);
         }

         const totalChallenges = duel.totalChallenges ?? 1;

         const senderChallenges = duel.challengesCompletedSenderId ?? [];
         const receiverChallenges = resultsFilter;

         const senderCompleted = senderChallenges.filter(
            (challenge) => challenge.isCorrect === true,
         ).length;

         const receiverCompleted = receiverChallenges.filter(
            (challenge) => challenge.isCorrect === true,
         ).length;

         const senderFinished = senderChallenges.length >= totalChallenges;

         const receiverFinished = receiverChallenges.length >= totalChallenges;

         if (senderFinished && receiverFinished) {
            if (receiverCompleted > senderCompleted) {
               winnerId = duel.receiverId;
            } else if (senderCompleted > receiverCompleted) {
               winnerId = duel.senderId;
            } else {
               winnerId = null;
            }

            await db
               .update(duels)
               .set({
                  status: "FINISHED",
               })
               .where(eq(duels.id, duelsId));

            isCompleted = true;
         }
      }

      if (userIs === "senderId") {
         const [duel] = await db
            .update(duels)
            .set({
               challengesCompletedSenderId: resultsFilter,
            })
            .where(eq(duels.id, duelsId))
            .returning();

         if (!duel) {
            throw new AppError("Duels Not found", 404);
         }

         const totalChallenges = duel.totalChallenges ?? 1;

         const receiverChallenges = duel.challengesCompletedReceiverId ?? [];

         const senderChallenges = resultsFilter;

         const senderCompleted = senderChallenges.filter(
            (challenge) => challenge.isCorrect === true,
         ).length;

         const receiverCompleted = receiverChallenges.filter(
            (challenge) => challenge.isCorrect === true,
         ).length;

         const senderFinished = senderChallenges.length >= totalChallenges;

         const receiverFinished = receiverChallenges.length >= totalChallenges;

         if (senderFinished && receiverFinished) {
            if (senderCompleted > receiverCompleted) {
               winnerId = duel.senderId;
            } else if (receiverCompleted > senderCompleted) {
               winnerId = duel.receiverId;
            } else {
               winnerId = null;
            }

            await db
               .update(duels)
               .set({
                  status: "FINISHED",
               })
               .where(eq(duels.id, duelsId));

            isCompleted = true;
         }
      }

      return {
         isCompleted,
         winnerId,
      };
   }

   async addPointsWinnerDuel({
      userId,
      pointsRank,
   }: {
      userId: string;
      pointsRank: number;
   }): Promise<void> {
      await db
         .update(users)
         .set({
            rankPoints: sql`${users.rankPoints} + ${pointsRank}`,
         })
         .where(eq(users.id, userId));
   }

   async deleteDuels({ duelsId }: { duelsId: string }): Promise<void> {
      await db.transaction(async (tx) => {
         await tx
            .delete(duelChallenges)
            .where(eq(duelChallenges.duelId, duelsId));

         await tx.delete(duels).where(eq(duels.id, duelsId));
      });
   }
}
