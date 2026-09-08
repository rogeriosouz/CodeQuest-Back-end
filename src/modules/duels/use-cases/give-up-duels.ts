import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { io } from "@/lib/socket";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { DuelsRepository } from "../repositories/duels.repository";

interface GiveUpDuelsUseCaseRequest {
   userId: string;
   duelsId: string;
}

export class GiveUpDuelsUseCase {
   constructor(
      private duelsRepository: DuelsRepository,
      private usersRepository: UserRepository,
   ) {}

   async execute({ userId, duelsId }: GiveUpDuelsUseCaseRequest) {
      const isUser = await this.usersRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const duels = await this.duelsRepository.findOneDuel({
         duelsId,
         userId,
      });

      if (!duels) {
         throw new ResourceNotFoundError();
      }

      await this.duelsRepository.userGiveUp({
         duelsId,
         userId,
      });

      if (duels.senderId === userId) {
         io.to(`user:${duels.receiverId}`).emit("duel:user-giveup");
      }

      if (duels.receiverId === userId) {
         io.to(`user:${duels.senderId}`).emit("duel:user-giveup");
      }
   }
}
