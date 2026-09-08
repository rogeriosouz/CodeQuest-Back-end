export interface User {
   id: string;
   name: string;
   email: string;
   passwordHash: string;
   displayName: string | null;
   avatarUrl: string | null;
   bio: string | null;
   xp: number;
   level: number;
   rankPoints: number;
   challengesCompleted: number;
   challengesFailed: number;
   wins: number;
   losses: number;
   draws: number;
   streakDays: number;
   lastActiveAt: Date | null;
   friendsCount: number;
   isPremium: boolean;
   premiumUntil: Date | null;
   isAdmin: boolean;
   totalXpApp: number;
   currentXpInLevel: number;
   xpForNextLevel: number;
   progressPercentage: number;
   createdAt: Date;
   updatedAt: Date;
}

export interface UserRepository {
   findByDisplayName(displayName: string): Promise<null | User>;
   findById(userId: string): Promise<null | User>;
   findByEmail(email: string): Promise<null | User>;
   findAllAdmin(filter: {
      search?: string | undefined;
      page: number;
      perPage: number;
   }): Promise<PaginatedUsers>;
   create({
      name,
      email,
      passwordHash,
   }: {
      name: string;
      email: string;
      passwordHash: string;
   }): Promise<User>;
   update({
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
   }): Promise<User>;
   updatePassword({
      passwordHash,
      userId,
   }: {
      passwordHash: string;
      userId: string;
   }): Promise<User>;
}

export interface PaginatedUsers {
   users: Omit<User, "passwordHash">[];
   total: number;
   page: number;
   perPage: number;
   totalPages: number;
}
