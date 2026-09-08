import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { io } from "@/lib/socket";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { DuelsRepository } from "../repositories/duels.repository";

interface AcceptDuelsUseCaseRequest {
   userId: string;
   duelsId: string;
}

export class AcceptDuelsUseCase {
   constructor(
      private duelsRepository: DuelsRepository,
      private usersRepository: UserRepository,
   ) {}

   async execute({ userId, duelsId }: AcceptDuelsUseCaseRequest) {
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

      await this.duelsRepository.acceptDuel({
         duelsId,
         userId,
      });

      io.to(`user:${isDuels.senderId}`).emit("duel:accept", {
         duelsId: isDuels.id,
         senderName: isDuels.senderName,
         difficulty: isDuels.difficulty,
         totalChallenges: isDuels.totalChallenges,
      });
   }
}
