import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { calculateLevel } from "@/shared/utils/calculate-level";
import { challenges } from "../../../../../drizzle/schema/challenge";
import { challengeCode } from "../../../../../drizzle/schema/challenge-code";
import { tracks } from "../../../../../drizzle/schema/tracks";
import { userTrackProgress } from "../../../../../drizzle/schema/user-track-progress";
import { users } from "../../../../../drizzle/schema/users";
import type {
   CreatedTrack,
   CreateTrackInput,
   Tracks,
   TracksRepository,
   UpdateTrackInput,
} from "../../repositories/tracks.repository";

export class TracksDrizzleRepository implements TracksRepository {
   async create(input: CreateTrackInput): Promise<CreatedTrack> {
      return db.transaction(async (tx) => {
         const [track] = await tx
            .insert(tracks)
            .values({
               name: input.name,
               slug: input.slug,
               description: input.description,
               icon: input.icon,
               color: input.color,
               difficulty: input.difficulty,
               language: input.language,
               isActive: input.isActive,
            })
            .returning({ id: tracks.id, name: tracks.name, slug: tracks.slug });

         if (!track) throw new Error("Could not create track");
         const challengeIds: string[] = [];

         for (const challenge of input.challenges) {
            const [createdChallenge] = await tx
               .insert(challenges)
               .values({
                  tracksId: track.id,
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
               .returning({ id: challenges.id });

            if (!createdChallenge)
               throw new Error("Could not create challenge");
            challengeIds.push(createdChallenge.id);

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

         const allUsers = await tx.select({ id: users.id }).from(users);

         if (allUsers.length > 0) {
            await tx.insert(userTrackProgress).values(
               allUsers.map((user) => ({
                  userId: user.id,
                  trackId: track.id,
                  points: 0,
                  completedChallenges: 0,
                  totalChallenges: challengeIds.length,
                  progressPercentage: 0,
                  isCompleted: false,
                  challengesCompleted: [],
               })),
            );
         }

         return { ...track, challengeIds };
      });
   }

   async update({
      tracksId,
      ...input
   }: UpdateTrackInput): Promise<Tracks | null> {
      const [track] = await db
         .update(tracks)
         .set({ ...input, updatedAt: new Date() })
         .where(eq(tracks.id, tracksId))
         .returning();

      if (!track) return null;

      const [challengeCount] = await db
         .select({ count: sql<number>`count(*)` })
         .from(challenges)
         .where(eq(challenges.tracksId, tracksId));

      return {
         ...track,
         progress: null,
         totalChallenges: Number(challengeCount?.count ?? 0),
      } as Tracks;
   }

   async findByName({ name }: { name: string }): Promise<Tracks | null> {
      const tracksDb = await db
         .select()
         .from(tracks)
         .where(eq(tracks.name, name));

      if (!tracksDb[0]) {
         return null;
      }

      return tracksDb[0] as Tracks;
   }

   async findBySlug({
      slug,
      userId,
   }: {
      slug: string;
      userId: string;
   }): Promise<Tracks | null> {
      const tracksDb = await db
         .select()
         .from(tracks)
         .leftJoin(
            userTrackProgress,
            and(
               eq(tracks.id, userTrackProgress.trackId),
               eq(userTrackProgress.userId, userId),
            ),
         )
         .where(eq(tracks.slug, slug));

      if (!tracksDb[0]) {
         return null;
      }

      const data = tracksDb.map((tracks) => ({
         ...tracks.tracks,
         progress: {
            id: tracks.user_track_progress?.id,
            points: tracks.user_track_progress?.points,
            completedChallenges:
               tracks.user_track_progress?.completedChallenges,
            challengesCompleted:
               tracks.user_track_progress?.challengesCompleted,
            totalChallenges: tracks.user_track_progress?.totalChallenges,
            progressPercentage: tracks.user_track_progress?.progressPercentage,
            isCompleted: tracks.user_track_progress?.isCompleted,
            lastActivityAt: tracks.user_track_progress?.lastActivityAt,
            createdAt: tracks.user_track_progress?.createdAt,
            updatedAt: tracks.user_track_progress?.updatedAt,
         },
      }));

      return data[0] as Tracks;
   }
   async findById(tracksId: string): Promise<Tracks | null> {
      const tracksDb = await db
         .select()
         .from(tracks)
         .leftJoin(userTrackProgress, eq(tracks.id, userTrackProgress.trackId))
         .where(eq(tracks.id, tracksId));

      if (!tracksDb[0]) {
         return null;
      }

      const data = tracksDb.map((tracks) => ({
         ...tracks.tracks,
         progress: {
            id: tracks.user_track_progress?.id,
            points: tracks.user_track_progress?.points,
            completedChallenges:
               tracks.user_track_progress?.completedChallenges,
            challengesCompleted:
               tracks.user_track_progress?.challengesCompleted,
            totalChallenges: tracks.user_track_progress?.totalChallenges,
            progressPercentage: tracks.user_track_progress?.progressPercentage,
            isCompleted: tracks.user_track_progress?.isCompleted,
            lastActivityAt: tracks.user_track_progress?.lastActivityAt,
            createdAt: tracks.user_track_progress?.createdAt,
            updatedAt: tracks.user_track_progress?.updatedAt,
         },
      }));

      return data[0] as Tracks;
   }

   async findAll({
      userId,
      search,
   }: {
      userId: string;
      search?: string;
   }): Promise<Tracks[]> {
      const tracksDb = await db
         .select({
            tracks,
            user_track_progress: userTrackProgress,
            totalChallenges: sql<number>`(
               SELECT COUNT(*)
               FROM ${challenges}
               WHERE ${challenges.tracksId} = ${tracks.id}
            )`.mapWith(Number),
         })
         .from(tracks)
         .leftJoin(userTrackProgress, eq(tracks.id, userTrackProgress.trackId))
         .where(
            and(
               eq(userTrackProgress.userId, userId),
               search
                  ? or(
                       ilike(tracks.name, `%${search}%`),
                       ilike(tracks.language, `%${search}%`),
                    )
                  : undefined,
            ),
         );

      if (!tracksDb[0]) {
         return [];
      }

      const data = tracksDb.map((tracks) => ({
         ...tracks.tracks,
         totalChallenges: tracks.totalChallenges,
         progress: {
            id: tracks.user_track_progress?.id,
            points: tracks.user_track_progress?.points,
            completedChallenges:
               tracks.user_track_progress?.completedChallenges,
            challengesCompleted:
               tracks.user_track_progress?.challengesCompleted,
            totalChallenges: tracks.user_track_progress?.totalChallenges,
            progressPercentage: tracks.user_track_progress?.progressPercentage,
            isCompleted: tracks.user_track_progress?.isCompleted,
            lastActivityAt: tracks.user_track_progress?.lastActivityAt,
            createdAt: tracks.user_track_progress?.createdAt,
            updatedAt: tracks.user_track_progress?.updatedAt,
         },
      }));

      return data as Tracks[];
   }

   async completeChallenge({
      userId,
      tracksId,
      challengeId,
   }: {
      userId: string;
      tracksId: string;
      challengeId: string;
   }): Promise<void> {
      await db.transaction(async (tx) => {
         const [challenge] = await tx
            .select()
            .from(challenges)
            .where(eq(challenges.id, challengeId));

         if (!challenge) throw new Error("Challenge not found");

         const [progress] = await tx
            .select()
            .from(userTrackProgress)
            .where(
               and(
                  eq(userTrackProgress.trackId, tracksId),
                  eq(userTrackProgress.userId, userId),
               ),
            );

         if (!progress) throw new Error("Progress not found");

         const total = await tx
            .select({ count: sql<number>`count(*)` })
            .from(challenges)
            .where(eq(challenges.tracksId, tracksId));

         const nextCompleted = (progress.completedChallenges as number) + 1;
         const isLast = nextCompleted >= Number(total[0]?.count);

         const totalChallenges = Number(total[0]?.count ?? 0);

         const rawPercentage =
            totalChallenges > 0 ? (nextCompleted / totalChallenges) * 100 : 0;

         const progressPercentage = Math.min(100, Math.floor(rawPercentage));

         const challengesCompleted = [
            ...(progress.challengesCompleted as {
               challengeId: string;
            }[]),
            { challengeId: challengeId },
         ];

         await tx
            .update(userTrackProgress)
            .set({
               points: sql`${userTrackProgress.points} + ${challenge.points}`,
               completedChallenges: sql`${userTrackProgress.completedChallenges} + 1`,
               lastActivityAt: new Date(),
               progressPercentage: progressPercentage,
               isCompleted: isLast,
               challengesCompleted: challengesCompleted,
            })
            .where(
               and(
                  eq(userTrackProgress.trackId, tracksId),
                  eq(userTrackProgress.userId, userId),
               ),
            );

         const [user] = await tx
            .select({
               xp: users.xp,
            })
            .from(users)
            .where(eq(users.id, userId));

         if (!user) throw new Error("User not found");

         const [result] = await db
            .select({
               totalXp: sql<number>`COALESCE(SUM(${challenges.points}), 0)`,
            })
            .from(challenges);

         const newXp = user.xp + challenge.points;
         const { level } = calculateLevel(newXp, result?.totalXp ?? 0);

         await tx
            .update(users)
            .set({
               xp: sql`${users.xp} + ${challenge.points}`,
               level,
               lastActiveAt: new Date(),
               challengesCompleted: sql`${users.challengesCompleted} + 1`,
            })
            .where(eq(users.id, userId));
      });
   }
}
