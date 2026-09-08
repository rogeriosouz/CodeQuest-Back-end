import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "../repositories/user.repository";

interface ListMyUseCaseRequest {
   userId: string;
}

export class ListMyUseCase {
   constructor(private UserRepository: UserRepository) {}

   async execute({ userId }: ListMyUseCaseRequest) {
      const user = await this.UserRepository.findById(userId);

      if (!user) {
         throw new UserNotFoundError();
      }

      const userFilter = {
         name: user.name,
         displayName: user.displayName,
         avatarUrl: user.avatarUrl,
         bio: user.bio,
         xp: user.xp,
         level: user.level,
         rankPoints: user.rankPoints,
         challengesCompleted: user.challengesCompleted,
         challengesFailed: user.challengesFailed,
         wins: user.wins,
         losses: user.losses,
         draws: user.draws,
         streakDays: user.streakDays,
         lastActiveAt: user.lastActiveAt,
         friendsCount: user.friendsCount,
         totalXpApp: user.totalXpApp,
         currentXpInLevel: user.currentXpInLevel,
         xpForNextLevel: user.xpForNextLevel,
         progressPercentage: user.progressPercentage,
      };

      return userFilter;
   }
}
