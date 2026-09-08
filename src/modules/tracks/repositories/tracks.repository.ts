export interface Tracks {
   progress: {
      id: string;
      points: number | null;
      completedChallenges: number | null;
      totalChallenges: number | null;
      progressPercentage: number | null;
      challengesCompleted:
         | {
              challengeId: string;
           }[]
         | null
         | undefined;
      isCompleted: boolean | null;
      lastActivityAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
   } | null;
   id: string;
   name: string;
   slug: string;
   description: string | null;
   icon: string | null;
   color: string | null;
   isActive: boolean | null;
   difficulty: string;
   language: string;
   totalChallenges: number;
   createdAt: Date;
   updatedAt: Date;
}

export interface TracksRepository {
   create(input: CreateTrackInput): Promise<CreatedTrack>;
   update(input: UpdateTrackInput): Promise<Tracks | null>;
   findAll({
      userId,
      search,
   }: {
      userId: string;
      search?: string;
   }): Promise<Tracks[]>;
   findByName({ name }: { name: string }): Promise<Tracks | null>;
   findById(tracksId: string): Promise<Tracks | null>;
   findBySlug({
      slug,
      userId,
   }: {
      slug: string;
      userId: string;
   }): Promise<Tracks | null>;
   completeChallenge({
      userId,
      tracksId,
      challengeId,
   }: {
      userId: string;
      tracksId: string;
      challengeId: string;
   }): Promise<void>;
}

export interface TrackChallengeCodeInput {
   languageCode: string;
   functionName: string;
   testCases: {
      input: unknown[];
      expectedOutput: unknown;
      isHidden?: boolean | undefined;
   }[];
   starterCode: string;
   timeLimitMs: number;
   memoryLimitMb: number;
}

export interface TrackChallengeInput {
   name: string;
   slug: string;
   description?: string | undefined;
   points: number;
   difficulty: string;
   type: string;
   isCode: boolean;
   tips: string[];
   alternatives: { text: string; isCorrect: boolean }[];
   code?: string | undefined;
   language?: string | undefined;
   isActive: boolean;
   codeChallenge?: TrackChallengeCodeInput | undefined;
}

export interface CreateTrackInput {
   name: string;
   slug: string;
   description?: string | undefined;
   icon?: string | undefined;
   color?: string | undefined;
   difficulty?: string | undefined;
   language: string;
   isActive: boolean;
   challenges: TrackChallengeInput[];
}

export interface UpdateTrackInput {
   tracksId: string;
   name?: string | undefined;
   slug?: string | undefined;
   description?: string | undefined;
   icon?: string | undefined;
   color?: string | undefined;
   difficulty?: string | undefined;
   language?: string | undefined;
   isActive?: boolean | undefined;
}

export interface CreatedTrack {
   id: string;
   name: string;
   slug: string;
   challengeIds: string[];
}
