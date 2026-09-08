import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { io } from "@/lib/socket";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { DuelsRepository } from "../repositories/duels.repository";

interface CompleteDuelUseCaseRequest {
   userId: string;
   duelsId: string;
   results: { challengeSlug: string; res: string }[];
}

export const DUEL_RANK_POINTS = {
   easy: 10,
   medium: 25,
   hard: 50,
} as const;

function getDuelRankPoints(difficulty: keyof typeof DUEL_RANK_POINTS) {
   return DUEL_RANK_POINTS[difficulty];
}

export class CompleteDuelUseCase {
   constructor(
      private duelsRepository: DuelsRepository,
      private usersRepository: UserRepository,
   ) {}

   async execute({ userId, duelsId, results }: CompleteDuelUseCaseRequest) {
      const isUser = await this.usersRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const isDuels = await this.duelsRepository.findOneDuel({
         duelsId,
         userId,
      });

      if (!isDuels) {
         throw new ResourceNotFoundError();
      }

      if (isDuels.expiredAt !== null) {
         throw new ResourceNotFoundError();
      }

      const userIs = isDuels.receiverId === userId ? "receiverId" : "senderId";

      const { isCompleted, winnerId } = await this.duelsRepository.completeDuel(
         {
            duelsId,
            results,
            userId,
            userIs,
         },
      );

      if (isCompleted && winnerId) {
         io.to(`user:${isDuels.receiverId}`).emit("duel:finished");
         io.to(`user:${isDuels.senderId}`).emit("duel:finished");

         const points = getDuelRankPoints(isDuels.difficulty);

         await this.duelsRepository.addPointsWinnerDuel({
            userId: winnerId,
            pointsRank: points,
         });
      }

      return {
         isCompetedDuel: isCompleted,
      };
   }
}
