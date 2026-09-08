import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { challenges } from "../../../../../drizzle/schema/challenge";
import { challengeCode } from "../../../../../drizzle/schema/challenge-code";
import { tracks } from "../../../../../drizzle/schema/tracks";
import { userTrackProgress } from "../../../../../drizzle/schema/user-track-progress";
import type {
   AdminChallenge,
   Challenge,
   ChallengeCode,
   ChallengeRepository,
   CreateChallengeInput,
   CreatedChallenge,
   UpdateChallengeInput,
} from "../../repositories/challenge.repository";

export class ChallengeDrizzleRepository implements ChallengeRepository {
   async create(
      input: CreateChallengeInput | CreateChallengeInput[],
   ): Promise<CreatedChallenge[]> {
      const challengesInput = Array.isArray(input) ? input : [input];

      return db.transaction(async (tx) => {
         const trackIds = [
            ...new Set(challengesInput.map((item) => item.tracksId)),
         ];
         const existingTracks = await tx
            .select({ id: tracks.id })
            .from(tracks)
            .where(inArray(tracks.id, trackIds));

         if (existingTracks.length !== trackIds.length) {
            throw new Error("Track not found");
         }

         const createdChallenges: CreatedChallenge[] = [];

         for (const challenge of challengesInput) {
            const [createdChallenge] = await tx
               .insert(challenges)
               .values({
                  tracksId: challenge.tracksId,
                  name: challenge.name,
                  slug: challenge.slug,
                  description: challenge.description,
                  points: challenge.points,
                  difficulty: challenge.difficulty,
                  type: challenge.type,
                  isCode: challenge.isCode,
                  tips: challenge.tips,
                  alternatives: challenge.alternatives,
                  code: challenge.code,
                  language: challenge.language,
                  isActive: challenge.isActive,
               })
               .returning({
                  id: challenges.id,
                  tracksId: challenges.tracksId,
                  name: challenges.name,
                  slug: challenges.slug,
               });

            if (!createdChallenge)
               throw new Error("Could not create challenge");
            createdChallenges.push(createdChallenge);

            if (challenge.codeChallenge) {
               const testCases = challenge.codeChallenge.testCases.map(
                  ({ input, expectedOutput, isHidden }) =>
                     isHidden === undefined
                        ? { input, expectedOutput }
                        : { input, expectedOutput, isHidden },
               );

               await tx.insert(challengeCode).values({
                  challengeId: createdChallenge.id,
                  languageCode: challenge.codeChallenge.languageCode,
                  functionName: challenge.codeChallenge.functionName,
                  testCases,
                  starterCode: challenge.codeChallenge.starterCode,
                  timeLimitMs: challenge.codeChallenge.timeLimitMs,
                  memoryLimitMb: challenge.codeChallenge.memoryLimitMb,
               });
            }
         }

         for (const trackId of trackIds) {
            const createdCount = challengesInput.filter(
               (challenge) => challenge.tracksId === trackId,
            ).length;

            await tx
               .update(userTrackProgress)
               .set({
                  totalChallenges: sql`${userTrackProgress.totalChallenges} + ${createdCount}`,
               })
               .where(eq(userTrackProgress.trackId, trackId));
         }

         return createdChallenges;
      });
   }

   async findAll({
      tracksId,
      userId,
   }: {
      tracksId: string;
      userId: string;
   }): Promise<Challenge[]> {
      const challengesDb = await db
         .select()
         .from(challenges)
         .leftJoin(
            userTrackProgress,
            and(
               eq(userTrackProgress.userId, userId),
               eq(userTrackProgress.trackId, tracksId),
            ),
         )
         .where(eq(challenges.tracksId, tracksId));

      if (!challengesDb[0]) {
         return [];
      }

      const challengeFilter = challengesDb.map((challenge) => {
         return {
            ...challenge.challenges,
            isCompleted:
               !!challenge.user_track_progress?.challengesCompleted?.find(
                  (item) => item.challengeId === challenge.challenges.id,
               ),
         };
      });

      return challengeFilter as Challenge[];
   }

   async findAllAdmin({
      tracksId,
      search,
   }: {
      tracksId?: string | undefined;
      search?: string | undefined;
   } = {}): Promise<AdminChallenge[]> {
      const conditions = [];

      if (tracksId) {
         conditions.push(eq(challenges.tracksId, tracksId));
      }

      if (search) {
         conditions.push(
            or(
               ilike(challenges.name, `%${search}%`),
               ilike(challenges.slug, `%${search}%`),
            ),
         );
      }

      const challengesDb = await db
         .select({
            challenge: challenges,
            challengeCode: challengeCode,
            track: {
               id: tracks.id,
               name: tracks.name,
               slug: tracks.slug,
            },
         })
         .from(challenges)
         .leftJoin(challengeCode, eq(challengeCode.challengeId, challenges.id))
         .leftJoin(tracks, eq(tracks.id, challenges.tracksId))
         .where(conditions.length > 0 ? and(...conditions) : undefined);

      return challengesDb.map((item) => ({
         ...item.challenge,
         challengeCode: item.challengeCode ? { ...item.challengeCode } : null,
         track: item.track?.id ? item.track : null,
      })) as AdminChallenge[];
   }

   async findById(challengeId: string): Promise<Challenge | null> {
      const challenge = await db
         .select()
         .from(challenges)
         .leftJoin(challengeCode, eq(challengeCode.challengeId, challenges.id))
         .where(eq(challenges.id, challengeId));

      if (!challenge[0]) {
         return null;
      }

      return {
         ...challenge[0].challenges,
         challengeCode: challenge[0].challenge_code
            ? { ...challenge[0].challenge_code }
            : null,
      } as Challenge;
   }

   async findBySlug({ slug, userId }: { slug: string; userId: string }) {
      const challenge = await db
         .select()
         .from(challenges)
         .leftJoin(challengeCode, eq(challengeCode.challengeId, challenges.id))
         .leftJoin(
            userTrackProgress,
            and(
               eq(userTrackProgress.trackId, challenges.tracksId),
               eq(userTrackProgress.userId, userId),
            ),
         )
         .where(eq(challenges.slug, slug));

      if (!challenge[0]) {
         return null;
      }

      const completedChallenge =
         challenge[0].user_track_progress?.challengesCompleted?.find(
            (item) => item.challengeId === challenge[0]?.challenges.id,
         );

      return {
         ...challenge[0].challenges,
         challengeCode: challenge[0].challenge_code
            ? { ...challenge[0].challenge_code }
            : null,
         isCompleted: !!completedChallenge,
      } as Challenge;
   }

   async findByIdCode(challengeId: string) {
      const challengeCodeDb = await db
         .select()
         .from(challengeCode)
         .where(eq(challengeCode.challengeId, challengeId));

      if (!challengeCodeDb[0]) {
         return null;
      }

      return challengeCodeDb[0] as ChallengeCode;
   }

   async update({
      challengeId,
      codeChallenge,
      ...input
   }: UpdateChallengeInput): Promise<Challenge | null> {
      return db.transaction(async (tx) => {
         const [existing] = await tx
            .select()
            .from(challenges)
            .where(eq(challenges.id, challengeId));

         if (!existing) {
            return null;
         }

         if (input.tracksId && input.tracksId !== existing.tracksId) {
            const [trackExists] = await tx
               .select({ id: tracks.id })
               .from(tracks)
               .where(eq(tracks.id, input.tracksId));

            if (!trackExists) {
               throw new Error("Track not found");
            }

            await tx
               .update(userTrackProgress)
               .set({
                  totalChallenges: sql`GREATEST(0, ${userTrackProgress.totalChallenges} - 1)`,
               })
               .where(eq(userTrackProgress.trackId, existing.tracksId));

            await tx
               .update(userTrackProgress)
               .set({
                  totalChallenges: sql`${userTrackProgress.totalChallenges} + 1`,
               })
               .where(eq(userTrackProgress.trackId, input.tracksId));
         }

         const updateData: Partial<typeof challenges.$inferInsert> = {
            updatedAt: new Date(),
         };

         if (input.tracksId !== undefined) updateData.tracksId = input.tracksId;
         if (input.name !== undefined) updateData.name = input.name;
         if (input.slug !== undefined) updateData.slug = input.slug;
         if (input.description !== undefined)
            updateData.description = input.description;
         if (input.points !== undefined) updateData.points = input.points;
         if (input.difficulty !== undefined)
            updateData.difficulty = input.difficulty;
         if (input.type !== undefined) updateData.type = input.type;
         if (input.isCode !== undefined) updateData.isCode = input.isCode;
         if (input.tips !== undefined) updateData.tips = input.tips;
         if (input.alternatives !== undefined)
            updateData.alternatives = input.alternatives;
         if (input.code !== undefined) updateData.code = input.code;
         if (input.language !== undefined) updateData.language = input.language;
         if (input.isActive !== undefined) updateData.isActive = input.isActive;

         const [updatedChallenge] = await tx
            .update(challenges)
            .set(updateData)
            .where(eq(challenges.id, challengeId))
            .returning();

         if (!updatedChallenge) {
            return null;
         }

         if (codeChallenge) {
            const [existingCode] = await tx
               .select()
               .from(challengeCode)
               .where(eq(challengeCode.challengeId, challengeId));

            if (existingCode) {
               const codeUpdateData: Partial<
                  typeof challengeCode.$inferInsert
               > = {};
               if (codeChallenge.languageCode !== undefined)
                  codeUpdateData.languageCode = codeChallenge.languageCode;
               if (codeChallenge.functionName !== undefined)
                  codeUpdateData.functionName = codeChallenge.functionName;
               if (codeChallenge.testCases !== undefined)
                  codeUpdateData.testCases = codeChallenge.testCases;
               if (codeChallenge.starterCode !== undefined)
                  codeUpdateData.starterCode = codeChallenge.starterCode;
               if (codeChallenge.timeLimitMs !== undefined)
                  codeUpdateData.timeLimitMs = codeChallenge.timeLimitMs;
               if (codeChallenge.memoryLimitMb !== undefined)
                  codeUpdateData.memoryLimitMb = codeChallenge.memoryLimitMb;

               if (Object.keys(codeUpdateData).length > 0) {
                  await tx
                     .update(challengeCode)
                     .set(codeUpdateData)
                     .where(eq(challengeCode.challengeId, challengeId));
               }
            } else {
               await tx.insert(challengeCode).values({
                  challengeId,
                  languageCode: codeChallenge.languageCode ?? "javascript",
                  functionName: codeChallenge.functionName ?? "solution",
                  testCases: codeChallenge.testCases ?? [],
                  starterCode: codeChallenge.starterCode ?? "",
                  timeLimitMs: codeChallenge.timeLimitMs ?? 3000,
                  memoryLimitMb: codeChallenge.memoryLimitMb ?? 128,
               });
            }
         }

         const [code] = await tx
            .select()
            .from(challengeCode)
            .where(eq(challengeCode.challengeId, challengeId));

         return {
            ...updatedChallenge,
            challengeCode: code ? { ...code } : null,
         } as Challenge;
      });
   }
}
