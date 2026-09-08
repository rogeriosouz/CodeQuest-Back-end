export interface ChallengeCode {
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

export interface Challenge {
   id: string;
   tracksId: string;
   name: string;
   slug: string;
   description: string | null;
   points: number;
   difficulty: string;
   type: string;
   isCode: boolean | null;
   code: string | null;
   tips: string[];
   language: string | null;
   alternatives:
      | {
           text: string;
           isCorrect: boolean;
        }[]
      | null;
   isActive: boolean | null;
   challengeCode: ChallengeCode | null;
   isCompleted?: boolean;
   createdAt: Date;
   updatedAt: Date;
}

export interface AdminChallenge extends Challenge {
   track?: {
      id: string;
      name: string;
      slug: string;
   } | null;
}

export interface ChallengeRepository {
   create(
      input: CreateChallengeInput | CreateChallengeInput[],
   ): Promise<CreatedChallenge[]>;
   findAll({
      tracksId,
      userId,
   }: {
      tracksId: string;
      userId: string;
   }): Promise<Challenge[]>;
   findAllAdmin(filter?: {
      tracksId?: string | undefined;
      search?: string | undefined;
   }): Promise<AdminChallenge[]>;
   findById(challengeId: string): Promise<Challenge | null>;
   findBySlug({
      slug,
      userId,
   }: {
      slug: string;
      userId: string;
   }): Promise<Challenge | null>;
   findByIdCode(challengeId: string): Promise<ChallengeCode | null>;
   update(input: UpdateChallengeInput): Promise<Challenge | null>;
}

export interface CreateChallengeCodeInput {
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

export interface CreateChallengeInput {
   tracksId: string;
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
   codeChallenge?: CreateChallengeCodeInput | undefined;
}

export interface UpdateChallengeCodeInput {
   languageCode?: string | undefined;
   functionName?: string | undefined;
   testCases?:
      | {
           input: unknown[];
           expectedOutput: unknown;
           isHidden?: boolean | undefined;
        }[]
      | undefined;
   starterCode?: string | undefined;
   timeLimitMs?: number | undefined;
   memoryLimitMb?: number | undefined;
}

export interface UpdateChallengeInput {
   challengeId: string;
   tracksId?: string | undefined;
   name?: string | undefined;
   slug?: string | undefined;
   description?: string | null | undefined;
   points?: number | undefined;
   difficulty?: string | undefined;
   type?: string | undefined;
   isCode?: boolean | undefined;
   tips?: string[] | undefined;
   alternatives?: { text: string; isCorrect: boolean }[] | undefined;
   code?: string | null | undefined;
   language?: string | null | undefined;
   isActive?: boolean | undefined;
   codeChallenge?: UpdateChallengeCodeInput | undefined;
}

export interface CreatedChallenge {
   id: string;
   tracksId: string;
   name: string;
   slug: string;
}
