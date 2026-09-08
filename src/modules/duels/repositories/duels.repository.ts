export interface CreateDuelRequest {
   friendId: string;
   userId: string;
   language: string;
   difficulty: "easy" | "medium" | "hard";
   totalChallenges: number;
   receiverName: string;
   senderName: string;
}

export interface Duels {
   difficulty: "easy" | "medium" | "hard";
   language: string | null;
   totalChallenges: number | null;
   id: string;
   createdAt: Date;
   senderId: string;
   receiverId: string;
   receiverName: string | null;
   senderName: string | null;
   totalChallengesCompletedSenderId: number | null;
   totalChallengesCompletedReceiverId: number | null;

   challengesCompletedSenderId:
      | { challengeId: string; isCorrect: boolean }[]
      | null;
   challengesCompletedReceiverId:
      | { challengeId: string; isCorrect: boolean }[]
      | null;
   totalTime: number | null;
   winnerId: string | null;
   forfeitedId: string | null;
   startAt: Date | null;
   status: "PENDING" | "ACTIVE" | "FINISHED" | "FORFEITED";
   expiredAt: Date | null;
   challenges?: DuelChallengeObject[];
}

export interface DuelChallengeObject {
   id?: string;

   tracksId?: string;

   name?: string;
   slug?: string;

   description?: string | null;

   points?: number;

   difficulty?: string;

   type?: string;

   isCode?: boolean | null;

   tips?: string[];

   alternatives?:
      | {
           text: string;
           isCorrect: boolean;
        }[]
      | null;

   code?: string | null;

   language?: string | null;

   isActive?: boolean | null;

   createdAt?: Date;
   updatedAt?: Date;

   challengeCode: ChallengeCodeObject | null;
}

export interface ChallengeCodeObject {
   id: string;

   challengeId: string;

   languageCode: string;

   functionName: string;

   testCases:
      | {
           input: unknown[];
           expectedOutput: unknown;
           isHidden?: boolean;
        }[]
      | null;

   starterCode: string | null;

   timeLimitMs: number;

   memoryLimitMb: number;

   createdAt: Date;
}

export interface DuelsRepository {
   createDuel(data: CreateDuelRequest): Promise<Duels>;
   findByUserId({ userId }: { userId: string }): Promise<Duels[]>;
   duelExpired({
      duelsId,
      winnerId,
   }: {
      duelsId: string;
      winnerId: string | null;
   }): Promise<void>;
   findByDuelIsCreatedByFriendId({
      userId,
      friendId,
   }: {
      userId: string;
      friendId: string;
   }): Promise<Duels | null>;
   findOneDuel({
      duelsId,
      userId,
   }: {
      duelsId: string;
      userId: string;
   }): Promise<Duels | null>;
   userGiveUp({
      userId,
      duelsId,
   }: {
      userId: string;
      duelsId: string;
   }): Promise<void>;
   addPointsWinnerDuel({
      userId,
      pointsRank,
   }: {
      userId: string;
      pointsRank: number;
   }): Promise<void>;
   refuseDuel({ duelsId }: { duelsId: string; userId: string }): Promise<void>;
   acceptDuel({ duelsId }: { duelsId: string; userId: string }): Promise<void>;
   completeDuel({
      duelsId,
      userId,
   }: {
      duelsId: string;
      userId: string;
      userIs: "receiverId" | "senderId";
      results: { challengeSlug: string; res: string }[];
   }): Promise<{
      isCompleted: boolean;
      winnerId: string | null;
   }>;
   deleteDuels({ duelsId }: { duelsId: string }): Promise<void>;
}
